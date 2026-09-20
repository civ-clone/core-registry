"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConstructorRegistry = void 0;
class ConstructorRegistry {
    constructor(...acceptedTypes) {
        this._acceptedTypes = [];
        this._entries = [];
        this._acceptedTypes.push(...acceptedTypes);
    }
    accepts(entity) {
        return (typeof entity === 'function' &&
            this._acceptedTypes.some((acceptedType) => Object.prototype.isPrototypeOf.call(acceptedType, entity) ||
                Object.prototype.isPrototypeOf.call(acceptedType.prototype, entity)));
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
            }
        });
    }
}
exports.ConstructorRegistry = ConstructorRegistry;
exports.default = ConstructorRegistry;
//# sourceMappingURL=ConstructorRegistry.js.map