import { IRegistry, IRegistryIterator, IConstructor } from './Registry';

/**
 * A lookup kept alongside a registry's entries, so a `getBy…` is a map read
 * rather than a scan of everything.
 *
 * Measured before writing: a 150-turn headless game spent 23% of its time in
 * `TransportRegistry.getByUnit`, which scanned every manifest to answer "is
 * this unit aboard anything" for every unit, every move.
 *
 * `keyOf` returning `null` means "not indexed" — an entity with no key sits in
 * no bucket and is simply not found by this index, which is what a lookup for
 * some other key should say anyway.
 */
export class RegistryIndex<T, K> {
  private _buckets: Map<K, T[]> = new Map();
  private _keyOf: (entity: T) => K | null;

  constructor(keyOf: (entity: T) => K | null) {
    this._keyOf = keyOf;
  }

  add(entity: T): void {
    const key = this._keyOf(entity);

    if (key === null || key === undefined) {
      return;
    }

    const bucket = this._buckets.get(key);

    if (!bucket) {
      this._buckets.set(key, [entity]);

      return;
    }

    if (!bucket.includes(entity)) {
      bucket.push(entity);
    }
  }

  /**
   * Removed by its *current* key where that works, and by search where it does
   * not.
   *
   * The fallback is what makes a key that changed while the entity was
   * registered survivable: without it the entity would stay in the bucket it
   * was filed under and be handed out for a key it no longer has. A registry
   * whose keys move should call `reindex`; this is the safety net for the one
   * that forgets.
   */
  remove(entity: T): void {
    const key = this._keyOf(entity);
    const bucket =
      key === null || key === undefined ? undefined : this._buckets.get(key);

    if (bucket) {
      const index = bucket.indexOf(entity);

      if (index > -1) {
        bucket.splice(index, 1);

        if (bucket.length === 0 && key !== null && key !== undefined) {
          this._buckets.delete(key);
        }

        return;
      }
    }

    this._buckets.forEach((entries: T[], bucketKey: K): void => {
      const index = entries.indexOf(entity);

      if (index === -1) {
        return;
      }

      entries.splice(index, 1);

      if (entries.length === 0) {
        this._buckets.delete(bucketKey);
      }
    });
  }

  /** A copy: a caller that sorts or splices the result must not edit the index. */
  get(key: K): T[] {
    return (this._buckets.get(key) ?? []).slice();
  }

  has(key: K): boolean {
    return (this._buckets.get(key)?.length ?? 0) > 0;
  }

  rebuild(entities: T[]): void {
    this._buckets.clear();

    entities.forEach((entity: T): void => this.add(entity));
  }
}

export interface IEntityRegistry<T> extends IRegistry<T> {
  accepts(entity: T): boolean;
  entries(): T[];
  every(iterator: IRegistryIterator<T>): boolean;
  filter(iterator: IRegistryIterator<T>): T[];
  forEach(iterator: (item: T, i: number) => void): void;
  getBy<K extends keyof T>(
    key: K,
    value: T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : T[K]
  ): T[];
  includes(item: T): boolean;
  reindex(entity: T): void;
  indexOf(item: T): number;
  map(iterator: (item: T, i: number) => any): any[];
  register(...entities: T[]): void;
  some(iterator: IRegistryIterator<T>): boolean;
  unregister(...entities: T[]): void;
}

export class EntityRegistry<T = any> implements IEntityRegistry<T> {
  private _acceptedTypes: IConstructor<T>[] = [];
  private _entries: T[] = [];
  private _indexes: RegistryIndex<T, any>[] = [];

  constructor(...acceptedTypes: IConstructor<T>[]) {
    this._acceptedTypes.push(...acceptedTypes);
  }

  accepts(entity: T): boolean {
    return this._acceptedTypes.some(
      (acceptedType: IConstructor<T>): boolean => entity instanceof acceptedType
    );
  }

  entries(): T[] {
    return this._entries.slice();
  }

  every(iterator: IRegistryIterator<T>): boolean {
    return this.entries().every(iterator);
  }

  filter(iterator: IRegistryIterator<T>): T[] {
    return this.entries().filter(iterator);
  }

  forEach(iterator: (item: T, i: number) => void): void {
    return this.entries().forEach(iterator);
  }

  /**
   * Declare a lookup this registry keeps up to date.
   *
   * ```ts
   * class TransportRegistry extends EntityRegistry<TransportManifest> {
   *   private _byUnit = this.index((manifest) => manifest.unit());
   * }
   * ```
   *
   * Built from whatever is already registered, so it does not matter whether
   * the declaration runs before or after anything was added.
   *
   * **Only index a key that cannot change while the entity is registered**, or
   * call `reindex` where it changes. A manifest's unit and transport are fixed
   * for its lifetime — stowing and unloading register and unregister it — so
   * they are safe. A unit's tile is not.
   */
  protected index<K>(keyOf: (entity: T) => K | null): RegistryIndex<T, K> {
    const index = new RegistryIndex<T, K>(keyOf);

    index.rebuild(this._entries);
    this._indexes.push(index);

    return index;
  }

  /** Re-file one entity, for a key that changed under a live registration. */
  reindex(entity: T): void {
    if (!this._entries.includes(entity)) {
      return;
    }

    this._indexes.forEach((index: RegistryIndex<T, any>): void => {
      index.remove(entity);
      index.add(entity);
    });
  }

  getBy<K extends keyof T>(
    key: K,
    value: T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : T[K]
  ): T[] {
    return this.filter((entity: T): boolean => {
      const check = entity[key];

      if (check instanceof Function) {
        return check.bind(entity)() === value;
      }

      return entity[key] === value;
    });
  }

  includes(item: T): boolean {
    return this._entries.includes(item);
  }

  indexOf(entity: T): number {
    return this._entries.indexOf(entity);
  }

  get length(): number {
    // Not `this.entries().length`, which copied the registry to read a number
    // off the copy. A subclass overriding `entries()` to reorder — as
    // `RuleRegistry` does — still has the same count either way.
    return this._entries.length;
  }

  map(iterator: (item: T, i: number) => any): any[] {
    return this.entries().map(iterator);
  }

  register(...entities: T[]): void {
    entities.forEach((entity: T): void => {
      if (!this.accepts(entity)) {
        throw new TypeError(
          `Registry#register: Invalid entity attempted to be registered: '${entity}'.`
        );
      }

      if (!this._entries.includes(entity)) {
        this._entries.push(entity);

        this._indexes.forEach((index: RegistryIndex<T, any>): void =>
          index.add(entity)
        );
      }
    });
  }

  some(iterator: IRegistryIterator<T>): boolean {
    return this.entries().some(iterator);
  }

  unregister(...entities: T[]): void {
    entities.forEach((entity: T) => {
      const index = this._entries.indexOf(entity);

      if (index > -1) {
        this._entries.splice(index, 1);

        this._indexes.forEach((registryIndex: RegistryIndex<T, any>): void =>
          registryIndex.remove(entity)
        );
      }
    });
  }
}

export default EntityRegistry;
