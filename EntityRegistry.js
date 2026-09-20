"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityRegistry = exports.RegistryIndex = void 0;
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
class RegistryIndex {
    constructor(keyOf) {
        this._buckets = new Map();
        this._keyOf = keyOf;
    }
    add(entity) {
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
    remove(entity) {
        const key = this._keyOf(entity);
        const bucket = key === null || key === undefined ? undefined : this._buckets.get(key);
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
        this._buckets.forEach((entries, bucketKey) => {
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
    get(key) {
        var _a;
        return ((_a = this._buckets.get(key)) !== null && _a !== void 0 ? _a : []).slice();
    }
    has(key) {
        var _a, _b;
        return ((_b = (_a = this._buckets.get(key)) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0;
    }
    rebuild(entities) {
        this._buckets.clear();
        entities.forEach((entity) => this.add(entity));
    }
}
exports.RegistryIndex = RegistryIndex;
class EntityRegistry {
    constructor(...acceptedTypes) {
        this._acceptedTypes = [];
        this._entries = [];
        this._indexes = [];
        this._acceptedTypes.push(...acceptedTypes);
    }
    accepts(entity) {
        return this._acceptedTypes.some((acceptedType) => entity instanceof acceptedType);
    }
    entries() {
        return this._entries.slice();
    }
    every(iterator) {
        return this.entries().every(iterator);
    }
    filter(iterator) {
        return this.entries().filter(iterator);
    }
    forEach(iterator) {
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
    index(keyOf) {
        const index = new RegistryIndex(keyOf);
        index.rebuild(this._entries);
        this._indexes.push(index);
        return index;
    }
    /** Re-file one entity, for a key that changed under a live registration. */
    reindex(entity) {
        if (!this._entries.includes(entity)) {
            return;
        }
        this._indexes.forEach((index) => {
            index.remove(entity);
            index.add(entity);
        });
    }
    getBy(key, value) {
        return this.filter((entity) => {
            const check = entity[key];
            if (check instanceof Function) {
                return check.bind(entity)() === value;
            }
            return entity[key] === value;
        });
    }
    includes(item) {
        return this._entries.includes(item);
    }
    indexOf(entity) {
        return this._entries.indexOf(entity);
    }
    get length() {
        return this.entries().length;
    }
    map(iterator) {
        return this.entries().map(iterator);
    }
    register(...entities) {
        entities.forEach((entity) => {
            if (!this.accepts(entity)) {
                throw new TypeError(`Registry#register: Invalid entity attempted to be registered: '${entity}'.`);
            }
            if (!this._entries.includes(entity)) {
                this._entries.push(entity);
                this._indexes.forEach((index) => index.add(entity));
            }
        });
    }
    some(iterator) {
        return this.entries().some(iterator);
    }
    unregister(...entities) {
        entities.forEach((entity) => {
            const index = this._entries.indexOf(entity);
            if (index > -1) {
                this._entries.splice(index, 1);
                this._indexes.forEach((registryIndex) => registryIndex.remove(entity));
            }
        });
    }
}
exports.EntityRegistry = EntityRegistry;
exports.default = EntityRegistry;
//# sourceMappingURL=EntityRegistry.js.map