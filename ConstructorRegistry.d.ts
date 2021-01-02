import { IRegistry, IRegistryFilter, IConstructor } from './Registry';
export interface IConstructorRegistry<T = any> extends IRegistry<T> {
  accepts(entity: IConstructor<T>): boolean;
  entries(): IConstructor<T>[];
  every(iterator: IRegistryFilter<IConstructor<T>>): boolean;
  filter(iterator: IRegistryFilter<IConstructor<T>>): IConstructor<T>[];
  forEach(iterator: (item: IConstructor<T>, i: number) => void): void;
  getBy<K extends keyof IConstructor<T>>(key: K, value: any): IConstructor<T>[];
  includes(item: IConstructor<T>): boolean;
  indexOf(item: IConstructor<T>): number;
  map(iterator: (item: IConstructor<T>, i: number) => any): any[];
  register(...entities: IConstructor<T>[]): void;
  some(iterator: IRegistryFilter<IConstructor<T>>): boolean;
  unregister(...entities: IConstructor<T>[]): void;
}
export declare class ConstructorRegistry<T = any>
  implements IConstructorRegistry<T> {
  #private;
  constructor(...acceptedTypes: IConstructor<T>[]);
  accepts(entity: IConstructor<T>): boolean;
  entries(): IConstructor<T>[];
  every(iterator: IRegistryFilter<IConstructor<T>>): boolean;
  filter(iterator: IRegistryFilter<IConstructor<T>>): IConstructor<T>[];
  forEach(iterator: (item: IConstructor<T>, i: number) => void): void;
  getBy<K extends keyof IConstructor<T>>(key: K, value: any): IConstructor<T>[];
  includes(item: IConstructor<T>): boolean;
  indexOf(entity: IConstructor<T>): number;
  get length(): number;
  map(iterator: (item: IConstructor<T>, i: number) => any): any[];
  register(...entities: IConstructor<T>[]): void;
  some(iterator: IRegistryFilter<IConstructor<T>>): boolean;
  unregister(...entities: IConstructor<T>[]): void;
}
export default ConstructorRegistry;
