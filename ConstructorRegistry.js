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
var _ConstructorRegistry_acceptedTypes, _ConstructorRegistry_entries;
Object.defineProperty(exports, '__esModule', { value: true });
exports.ConstructorRegistry = void 0;
class ConstructorRegistry {
  constructor(...acceptedTypes) {
    _ConstructorRegistry_acceptedTypes.set(this, []);
    _ConstructorRegistry_entries.set(this, []);
    __classPrivateFieldGet(this, _ConstructorRegistry_acceptedTypes, 'f').push(
      ...acceptedTypes
    );
  }
  accepts(entity) {
    return (
      typeof entity === 'function' &&
      __classPrivateFieldGet(
        this,
        _ConstructorRegistry_acceptedTypes,
        'f'
      ).some(
        (acceptedType) =>
          Object.prototype.isPrototypeOf.call(acceptedType, entity) ||
          Object.prototype.isPrototypeOf.call(acceptedType.prototype, entity)
      )
    );
  }
  entries() {
    return __classPrivateFieldGet(
      this,
      _ConstructorRegistry_entries,
      'f'
    ).slice();
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
    return __classPrivateFieldGet(
      this,
      _ConstructorRegistry_entries,
      'f'
    ).includes(item);
  }
  indexOf(entity) {
    return __classPrivateFieldGet(
      this,
      _ConstructorRegistry_entries,
      'f'
    ).indexOf(entity);
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
        !__classPrivateFieldGet(
          this,
          _ConstructorRegistry_entries,
          'f'
        ).includes(entity)
      ) {
        __classPrivateFieldGet(this, _ConstructorRegistry_entries, 'f').push(
          entity
        );
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
        _ConstructorRegistry_entries,
        'f'
      ).indexOf(entity);
      if (index > -1) {
        __classPrivateFieldGet(this, _ConstructorRegistry_entries, 'f').splice(
          index,
          1
        );
      }
    });
  }
}
exports.ConstructorRegistry = ConstructorRegistry;
(_ConstructorRegistry_acceptedTypes = new WeakMap()),
  (_ConstructorRegistry_entries = new WeakMap());
exports.default = ConstructorRegistry;
//# sourceMappingURL=ConstructorRegistry.js.map
