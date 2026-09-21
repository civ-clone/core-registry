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
export declare class RegistryIndex<T, K> {
    private _buckets;
    private _keyOf;
    constructor(keyOf: (entity: T) => K | null);
    add(entity: T): void;
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
    remove(entity: T): void;
    /** A copy: a caller that sorts or splices the result must not edit the index. */
    get(key: K): T[];
    has(key: K): boolean;
    rebuild(entities: T[]): void;
}
export interface IEntityRegistry<T> extends IRegistry<T> {
    accepts(entity: T): boolean;
    entries(): T[];
    every(iterator: IRegistryIterator<T>): boolean;
    filter(iterator: IRegistryIterator<T>): T[];
    forEach(iterator: (item: T, i: number) => void): void;
    getBy<K extends keyof T>(key: K, value: T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : T[K]): T[];
    includes(item: T): boolean;
    reindex(entity: T): void;
    indexOf(item: T): number;
    map(iterator: (item: T, i: number) => any): any[];
    register(...entities: T[]): void;
    some(iterator: IRegistryIterator<T>): boolean;
    unregister(...entities: T[]): void;
}
export declare class EntityRegistry<T = any> implements IEntityRegistry<T> {
    private _acceptedTypes;
    private _entries;
    private _indexes;
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
     * **Only index a key that cannot change while the entity is registered**, or
     * call `reindex` where it changes. A manifest's unit and transport are fixed
     * for its lifetime — stowing and unloading register and unregister it — so
     * they are safe. A unit's tile is not.
     */
    protected index<K>(keyOf: (entity: T) => K | null): RegistryIndex<T, K>;
    /** Re-file one entity, for a key that changed under a live registration. */
    reindex(entity: T): void;
    getBy<K extends keyof T>(key: K, value: T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : T[K]): T[];
    includes(item: T): boolean;
    indexOf(entity: T): number;
    get length(): number;
    map(iterator: (item: T, i: number) => any): any[];
    register(...entities: T[]): void;
    some(iterator: IRegistryIterator<T>): boolean;
    unregister(...entities: T[]): void;
}
export default EntityRegistry;
