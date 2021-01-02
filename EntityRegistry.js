"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _acceptedTypes, _entries;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityRegistry = void 0;
class EntityRegistry {
    constructor(...acceptedTypes) {
        _acceptedTypes.set(this, []);
        _entries.set(this, []);
        __classPrivateFieldGet(this, _acceptedTypes).push(...acceptedTypes);
    }
    accepts(entity) {
        return __classPrivateFieldGet(this, _acceptedTypes).some((acceptedType) => entity instanceof acceptedType);
    }
    entries() {
        return __classPrivateFieldGet(this, _entries).slice();
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
        return __classPrivateFieldGet(this, _entries).includes(item);
    }
    indexOf(entity) {
        return __classPrivateFieldGet(this, _entries).indexOf(entity);
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
            if (!__classPrivateFieldGet(this, _entries).includes(entity)) {
                __classPrivateFieldGet(this, _entries).push(entity);
            }
        });
    }
    some(iterator) {
        return this.entries().some(iterator);
    }
    unregister(...entities) {
        entities.forEach((entity) => {
            const index = __classPrivateFieldGet(this, _entries).indexOf(entity);
            if (index > -1) {
                __classPrivateFieldGet(this, _entries).splice(index, 1);
            }
        });
    }
}
exports.EntityRegistry = EntityRegistry;
_acceptedTypes = new WeakMap(), _entries = new WeakMap();
exports.default = EntityRegistry;
//# sourceMappingURL=EntityRegistry.js.map