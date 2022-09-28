import { IRegistry, IRegistryIterator, IConstructor } from './Registry';

export interface IConstructorRegistry<T = any> extends IRegistry<T> {
  accepts(entity: IConstructor<T>): boolean;
  entries(): IConstructor<T>[];
  every(iterator: IRegistryIterator<IConstructor<T>>): boolean;
  filter(iterator: IRegistryIterator<IConstructor<T>>): IConstructor<T>[];
  forEach(iterator: (item: IConstructor<T>, i: number) => void): void;
  getBy<K extends keyof T>(
    key: K,
    value: T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : T[K]
  ): IConstructor<T>[];
  includes(item: IConstructor<T>): boolean;
  indexOf(item: IConstructor<T>): number;
  map(iterator: (item: IConstructor<T>, i: number) => any): any[];
  register(...entities: IConstructor<T>[]): void;
  some(iterator: IRegistryIterator<IConstructor<T>>): boolean;
  unregister(...entities: IConstructor<T>[]): void;
}

export class ConstructorRegistry<T = any> implements IConstructorRegistry<T> {
  #acceptedTypes: IConstructor<T>[] = [];
  #entries: IConstructor<T>[] = [];

  constructor(...acceptedTypes: IConstructor<T>[]) {
    this.#acceptedTypes.push(...acceptedTypes);
  }

  accepts(entity: IConstructor<T>): boolean {
    return (
      typeof entity === 'function' &&
      this.#acceptedTypes.some(
        (acceptedType: IConstructor<T>) =>
          Object.prototype.isPrototypeOf.call(acceptedType, entity) ||
          Object.prototype.isPrototypeOf.call(acceptedType.prototype, entity)
      )
    );
  }

  entries(): IConstructor<T>[] {
    return this.#entries.slice();
  }

  every(iterator: IRegistryIterator<IConstructor<T>>): boolean {
    return this.entries().every(iterator);
  }

  filter(iterator: IRegistryIterator<IConstructor<T>>): IConstructor<T>[] {
    return this.entries().filter(iterator);
  }

  forEach(iterator: (item: IConstructor<T>, i: number) => void): void {
    return this.entries().forEach(iterator);
  }

  getBy<K extends keyof IConstructor<T>>(
    key: K,
    value: T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : T[K]
  ): IConstructor<T>[] {
    return this.filter((entity: IConstructor<T>): boolean => {
      const check: any = entity[key];

      if (check instanceof Function) {
        return check.bind(entity)() === value;
      }

      return entity[key] === value;
    });
  }

  includes(item: IConstructor<T>): boolean {
    return this.#entries.includes(item);
  }

  indexOf(entity: IConstructor<T>): number {
    return this.#entries.indexOf(entity);
  }

  get length(): number {
    return this.entries().length;
  }

  map(iterator: (item: IConstructor<T>, i: number) => any): any[] {
    return this.entries().map(iterator);
  }

  register(...entities: IConstructor<T>[]): void {
    entities.forEach((entity: IConstructor<T>): void => {
      if (!this.accepts(entity)) {
        throw new TypeError(
          `Registry#register: Invalid entity attempted to be registered: '${entity}'.`
        );
      }

      if (!this.#entries.includes(entity)) {
        this.#entries.push(entity);
      }
    });
  }

  some(iterator: IRegistryIterator<IConstructor<T>>): boolean {
    return this.entries().some(iterator);
  }

  unregister(...entities: IConstructor<T>[]): void {
    entities.forEach((entity: IConstructor<T>) => {
      const index = this.#entries.indexOf(entity);

      if (index > -1) {
        this.#entries.splice(index, 1);
      }
    });
  }
}

export default ConstructorRegistry;
