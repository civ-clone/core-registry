export interface KeyWatcher<T> {
  keysChanged(entity: T): void;
}
export declare const watchKeys: <T extends object>(
  entity: T,
  watcher: KeyWatcher<T>
) => void;
export declare const unwatchKeys: <T extends object>(
  entity: T,
  watcher: KeyWatcher<T>
) => void;
export declare const keysChanged: <T extends object>(entity: T) => void;
export default keysChanged;
