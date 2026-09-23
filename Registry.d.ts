export declare type IConstructor<T = any> = new (...args: any[]) => T;
export declare type IRegistryIterator<T> = (item: T, i: number) => boolean;
export interface IRegistry<T> {
  readonly length: number;
  accepts(entity: T | IConstructor<T>): boolean;
  entries(): (T | IConstructor<T>)[];
  every(iterator: IRegistryIterator<T | IConstructor<T>>): boolean;
  filter(
    iterator: IRegistryIterator<T | IConstructor<T>>
  ): (T | IConstructor<T>)[];
  forEach(iterator: (item: T | IConstructor<T>, i: number) => void): void;
  getBy<K extends keyof T>(
    key: K,
    value: T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : T[K]
  ): (T | IConstructor<T>)[];
  includes(item: T | IConstructor<T>): boolean;
  indexOf(item: T | IConstructor<T>): number;
  map(iterator: (item: T | IConstructor<T>, i: number) => any): any[];
  register(...entities: (T | IConstructor<T>)[]): void;
  some(iterator: IRegistryIterator<T | IConstructor<T>>): boolean;
  unregister(...entities: (T | IConstructor<T>)[]): void;
}
