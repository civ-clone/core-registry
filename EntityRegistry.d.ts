import { IRegistry, IRegistryIterator, IConstructor } from './Registry';
import { KeyWatcher } from './keysChanged';
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
export declare class RegistryIndex<T, K> {
  private _buckets;
  private _filed;
  private _keyOf;
  private _order;
  /**
   * `order` is when each entity was registered; `EntityRegistry` passes its
   * own. Without one, a bucket is in the order entities were added to it.
   */
  constructor(keyOf: (entity: T) => K | null, order?: Map<T, number>);
  add(entity: T): void;
  /** Taken out of the bucket it was filed under, whatever its key is now. */
  remove(entity: T): void;
  /** Re-filed under its current key, if that isn't the one it was filed under. */
  refile(entity: T): void;
  /** A copy: a caller that sorts or splices the result must not edit the index. */
  get(key: K): T[];
  has(key: K): boolean;
  rebuild(entities: T[]): void;
  private position;
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
export declare class EntityRegistry<T = any>
  implements IEntityRegistry<T>, KeyWatcher<T>
{
  private _acceptedTypes;
  private _entries;
  private _indexes;
  private _nextOrder;
  private _order;
  constructor(...acceptedTypes: IConstructor<T>[]);
  accepts(entity: T): boolean;
  entries(): T[];
  every(iterator: IRegistryIterator<T>): boolean;
  filter(iterator: IRegistryIterator<T>): T[];
  forEach(iterator: (item: T, i: number) => void): void;
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
  protected index<K>(keyOf: (entity: T) => K | null): RegistryIndex<T, K>;
  /** Re-file an entry under its current keys; what `keysChanged` calls. */
  keysChanged(entity: T): void;
  /** Re-file one entity, for a key that changed under a live registration. */
  reindex(entity: T): void;
  getBy<K extends keyof T>(
    key: K,
    value: T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : T[K]
  ): T[];
  includes(item: T): boolean;
  indexOf(entity: T): number;
  get length(): number;
  map(iterator: (item: T, i: number) => any): any[];
  register(...entities: T[]): void;
  some(iterator: IRegistryIterator<T>): boolean;
  unregister(...entities: T[]): void;
}
export default EntityRegistry;
