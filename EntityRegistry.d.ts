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
export declare class EntityRegistry<T = any> implements IEntityRegistry<T> {
  #private;
  constructor(...acceptedTypes: IConstructor<T>[]);
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
  indexOf(entity: T): number;
  get length(): number;
  map(iterator: (item: T, i: number) => any): any[];
  register(...entities: T[]): void;
  some(iterator: IRegistryIterator<T>): boolean;
  unregister(...entities: T[]): void;
}
export default EntityRegistry;
