'use strict';
var __classPrivateFieldGet =
  (this && this.__classPrivateFieldGet) ||
  function (receiver, state, kind, f) {
    if (kind === 'a' && !f)
      throw new TypeError('Private accessor was defined without a getter');
    if (
      typeof state === 'function'
        ? receiver !== state || !f
        : !state.has(receiver)
    )
      throw new TypeError(
        'Cannot read private member from an object whose class did not declare it'
      );
    return kind === 'm'
      ? f
      : kind === 'a'
      ? f.call(receiver)
      : f
      ? f.value
      : state.get(receiver);
  };
var _EntityRegistry_acceptedTypes, _EntityRegistry_entries;
Object.defineProperty(exports, '__esModule', { value: true });
exports.EntityRegistry = void 0;
class EntityRegistry {
  constructor(...acceptedTypes) {
    _EntityRegistry_acceptedTypes.set(this, []);
    _EntityRegistry_entries.set(this, []);
    __classPrivateFieldGet(this, _EntityRegistry_acceptedTypes, 'f').push(
      ...acceptedTypes
    );
  }
  accepts(entity) {
    return __classPrivateFieldGet(
      this,
      _EntityRegistry_acceptedTypes,
      'f'
    ).some((acceptedType) => entity instanceof acceptedType);
  }
  entries() {
    return __classPrivateFieldGet(this, _EntityRegistry_entries, 'f').slice();
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
    return __classPrivateFieldGet(this, _EntityRegistry_entries, 'f').includes(
      item
    );
  }
  indexOf(entity) {
    return __classPrivateFieldGet(this, _EntityRegistry_entries, 'f').indexOf(
      entity
    );
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
        throw new TypeError(
          `Registry#register: Invalid entity attempted to be registered: '${entity}'.`
        );
      }
      if (
        !__classPrivateFieldGet(this, _EntityRegistry_entries, 'f').includes(
          entity
        )
      ) {
        __classPrivateFieldGet(this, _EntityRegistry_entries, 'f').push(entity);
      }
    });
  }
  some(iterator) {
    return this.entries().some(iterator);
  }
  unregister(...entities) {
    entities.forEach((entity) => {
      const index = __classPrivateFieldGet(
        this,
        _EntityRegistry_entries,
        'f'
      ).indexOf(entity);
      if (index > -1) {
        __classPrivateFieldGet(this, _EntityRegistry_entries, 'f').splice(
          index,
          1
        );
      }
    });
  }
}
exports.EntityRegistry = EntityRegistry;
(_EntityRegistry_acceptedTypes = new WeakMap()),
  (_EntityRegistry_entries = new WeakMap());
exports.default = EntityRegistry;
//# sourceMappingURL=EntityRegistry.js.map
