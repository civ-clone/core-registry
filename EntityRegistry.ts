import { IRegistry, IRegistryIterator, IConstructor } from './Registry';
import { KeyWatcher, unwatchKeys, watchKeys } from './keysChanged';

// As a `Map` compares its keys (SameValueZero): `===`, except that `NaN` is the
//  same key as `NaN`.
const sameKey = (a: unknown, b: unknown): boolean =>
  a === b || (a !== a && b !== b);

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
 *
 * Each bucket is kept in the order its entities were registered, which is the
 * order of `entries()`, so a lookup answers in the same order as the scan it
 * replaces, however often an entity has been re-filed. The key each entity was
 * filed under is remembered, so it can be taken out of that bucket after its
 * key has changed (civ-clone/web-renderer#308).
 */
export class RegistryIndex<T, K> {
  private _buckets: Map<K, T[]> = new Map();
  private _filed: Map<T, K> = new Map();
  private _keyOf: (entity: T) => K | null;
  private _order: Map<T, number>;

  /**
   * `order` is when each entity was registered; `EntityRegistry` passes its
   * own. Without one, a bucket is in the order entities were added to it.
   */
  constructor(
    keyOf: (entity: T) => K | null,
    order: Map<T, number> = new Map()
  ) {
    this._keyOf = keyOf;
    this._order = order;
  }

  add(entity: T): void {
    if (this._filed.has(entity)) {
      return;
    }

    const key = this._keyOf(entity);

    if (key === null || key === undefined) {
      return;
    }

    this._filed.set(entity, key);

    const bucket = this._buckets.get(key);

    if (!bucket) {
      this._buckets.set(key, [entity]);

      return;
    }

    bucket.splice(this.position(bucket, entity), 0, entity);
  }

  /** Taken out of the bucket it was filed under, whatever its key is now. */
  remove(entity: T): void {
    if (!this._filed.has(entity)) {
      return;
    }

    const key = this._filed.get(entity)!,
      bucket = this._buckets.get(key)!,
      position = this.position(bucket, entity),
      index = bucket[position] === entity ? position : bucket.indexOf(entity);

    if (index > -1) {
      bucket.splice(index, 1);
    }

    if (bucket.length === 0) {
      this._buckets.delete(key);
    }

    this._filed.delete(entity);
  }

  /** Re-filed under its current key, if that isn't the one it was filed under. */
  refile(entity: T): void {
    const key = this._keyOf(entity),
      filed = this._filed.has(entity);

    if (filed && sameKey(this._filed.get(entity)!, key)) {
      return;
    }

    if (!filed && (key === null || key === undefined)) {
      return;
    }

    this.remove(entity);
    this.add(entity);
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
    this._filed.clear();

    entities.forEach((entity: T): void => this.add(entity));
  }

  // Where `entity` is, or would go, in `bucket`: by binary search on when it
  //  was registered, as a bucket can be large. An entity the registry hasn't
  //  ordered goes at the end.
  private position(bucket: T[], entity: T): number {
    const order = this._order.get(entity);

    if (order === undefined) {
      return bucket.length;
    }

    let low = 0,
      high = bucket.length;

    while (low < high) {
      const middle = (low + high) >>> 1,
        middleOrder = this._order.get(bucket[middle]);

      if (middleOrder !== undefined && middleOrder < order) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }

    return low;
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

export class EntityRegistry<T = any>
  implements IEntityRegistry<T>, KeyWatcher<T>
{
  private _acceptedTypes: IConstructor<T>[] = [];
  private _entries: T[] = [];
  private _indexes: RegistryIndex<T, any>[] = [];
  // When each entry was registered: its place in `_entries`, since registering
  //  appends. The indexes keep their buckets in this order.
  private _nextOrder: number = 0;
  private _order: Map<T, number> = new Map();

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
   * A key that can change while the entity is registered — a unit's tile, a
   * city's owner — needs the entity to say so: call `keysChanged(this)` (from
   * `@civ-clone/core-registry/keysChanged`) wherever it changes, and every
   * registry holding it re-files it. A manifest's unit and transport are fixed
   * for its lifetime, so it never needs to.
   */
  protected index<K>(keyOf: (entity: T) => K | null): RegistryIndex<T, K> {
    const index = new RegistryIndex<T, K>(keyOf, this._order);

    index.rebuild(this._entries);

    // The first index: from now on, hear about the entries' keys changing.
    if (this._indexes.length === 0) {
      this._entries.forEach((entity: T): void =>
        watchKeys(entity as any, this)
      );
    }

    this._indexes.push(index);

    return index;
  }

  /** Re-file an entry under its current keys; what `keysChanged` calls. */
  keysChanged(entity: T): void {
    if (!this._order.has(entity)) {
      return;
    }

    this._indexes.forEach((index: RegistryIndex<T, any>): void =>
      index.refile(entity)
    );
  }

  /** Re-file one entity, for a key that changed under a live registration. */
  reindex(entity: T): void {
    this.keysChanged(entity);
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
    return this._order.has(item);
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

      if (!this._order.has(entity)) {
        this._entries.push(entity);
        this._order.set(entity, this._nextOrder++);

        this._indexes.forEach((index: RegistryIndex<T, any>): void =>
          index.add(entity)
        );

        if (this._indexes.length > 0) {
          watchKeys(entity as any, this);
        }
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

        if (this._indexes.length > 0) {
          unwatchKeys(entity as any, this);
        }

        this._order.delete(entity);
      }
    });
  }
}

export default EntityRegistry;
