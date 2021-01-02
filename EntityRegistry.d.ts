import { IRegistry, IRegistryFilter, IConstructor } from './Registry';
export interface IEntityRegistry<T> extends IRegistry<T> {
  accepts(entity: T): boolean;
  entries(): T[];
  every(iterator: IRegistryFilter<T>): boolean;
  filter(iterator: IRegistryFilter<T>): T[];
  forEach(iterator: (item: T, i: number) => void): void;
  getBy<K extends keyof T>(key: K, value: any): T[];
  includes(item: T): boolean;
  indexOf(item: T): number;
  map(iterator: (item: T, i: number) => any): any[];
  register(...entities: T[]): void;
  some(iterator: IRegistryFilter<T>): boolean;
  unregister(...entities: T[]): void;
}
export declare class EntityRegistry<T = any> implements IEntityRegistry<T> {
  #private;
  constructor(...acceptedTypes: IConstructor<T>[]);
  accepts(entity: T): boolean;
  entries(): T[];
  every(iterator: IRegistryFilter<T>): boolean;
  filter(iterator: IRegistryFilter<T>): T[];
  forEach(iterator: (item: T, i: number) => void): void;
  getBy<K extends keyof T>(key: K, value: any): T[];
  includes(item: T): boolean;
  indexOf(entity: T): number;
  get length(): number;
  map(iterator: (item: T, i: number) => any): any[];
  register(...entities: T[]): void;
  some(iterator: IRegistryFilter<T>): boolean;
  unregister(...entities: T[]): void;
}
export default EntityRegistry;
