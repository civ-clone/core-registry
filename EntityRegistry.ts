import { IRegistry, IRegistryIterator, IConstructor } from './Registry';

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
  indexOf(item: T): number;
  map(iterator: (item: T, i: number) => any): any[];
  register(...entities: T[]): void;
  some(iterator: IRegistryIterator<T>): boolean;
  unregister(...entities: T[]): void;
}

export class EntityRegistry<T = any> implements IEntityRegistry<T> {
  #acceptedTypes: IConstructor<T>[] = [];
  #entries: T[] = [];

  constructor(...acceptedTypes: IConstructor<T>[]) {
    this.#acceptedTypes.push(...acceptedTypes);
  }

  accepts(entity: T): boolean {
    return this.#acceptedTypes.some(
      (acceptedType: IConstructor<T>): boolean => entity instanceof acceptedType
    );
  }

  entries(): T[] {
    return this.#entries.slice();
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
    return this.#entries.includes(item);
  }

  indexOf(entity: T): number {
    return this.#entries.indexOf(entity);
  }

  get length(): number {
    return this.entries().length;
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

      if (!this.#entries.includes(entity)) {
        this.#entries.push(entity);
      }
    });
  }

  some(iterator: IRegistryIterator<T>): boolean {
    return this.entries().some(iterator);
  }

  unregister(...entities: T[]): void {
    entities.forEach((entity: T) => {
      const index = this.#entries.indexOf(entity);

      if (index > -1) {
        this.#entries.splice(index, 1);
      }
    });
  }
}

export default EntityRegistry;
