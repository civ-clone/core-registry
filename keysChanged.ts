// For a registry that files its entries by something that can change, such as a unit's tile or a city's owner: the
//  entry says when one of those has changed (`keysChanged(this)`), and each registry it's in re-files it.
//  `EntityRegistry` asks to be told for each entry while it holds it, once it has an index
//  (civ-clone/web-renderer#308).
//
// Held weakly both ways. By entry, so an entry nothing else refers to takes its watchers with it; and each watcher by a
//  weak reference, so a registry that is dropped without unregistering its entries isn't kept alive by them.

export interface KeyWatcher<T> {
  keysChanged(entity: T): void;
}

interface Ref<T> {
  deref(): T | undefined;
}

// Reached through `globalThis` rather than by name, so this compiles against an ES2019/ES2020 `lib` (as the renderer's
//  does); every current browser and Node has it. Without it, a watcher is held strongly, as a registry holds its units.
const WeakRefImplementation:
    | (new <T extends object>(target: T) => Ref<T>)
    | undefined = (globalThis as any).WeakRef,
  ref = <T extends object>(target: T): Ref<T> =>
    WeakRefImplementation
      ? new WeakRefImplementation(target)
      : { deref: (): T => target };

const watchers: WeakMap<object, Set<Ref<KeyWatcher<any>>>> = new WeakMap();

// Only an object can be held weakly, and only an object can say its keys changed.
const isObject = (value: unknown): value is object =>
  (typeof value === 'object' && value !== null) || typeof value === 'function';

export const watchKeys = <T extends object>(
  entity: T,
  watcher: KeyWatcher<T>
): void => {
  if (!isObject(entity)) {
    return;
  }

  const entityWatchers = watchers.get(entity);

  if (!entityWatchers) {
    watchers.set(entity, new Set([ref(watcher)]));

    return;
  }

  let watching = false;

  // Collected watchers' references go as well, so an entry that outlives many registries without its keys ever
  //  changing doesn't collect them.
  for (const watcherRef of entityWatchers) {
    const current = watcherRef.deref();

    if (current === undefined) {
      entityWatchers.delete(watcherRef);
    } else if (current === watcher) {
      watching = true;
    }
  }

  if (!watching) {
    entityWatchers.add(ref(watcher));
  }
};

export const unwatchKeys = <T extends object>(
  entity: T,
  watcher: KeyWatcher<T>
): void => {
  if (!isObject(entity)) {
    return;
  }

  const entityWatchers = watchers.get(entity);

  if (!entityWatchers) {
    return;
  }

  for (const watcherRef of entityWatchers) {
    const current = watcherRef.deref();

    // A collected watcher's reference goes too.
    if (current === watcher || current === undefined) {
      entityWatchers.delete(watcherRef);
    }
  }

  if (entityWatchers.size === 0) {
    watchers.delete(entity);
  }
};

export const keysChanged = <T extends object>(entity: T): void => {
  const entityWatchers = watchers.get(entity);

  if (!entityWatchers) {
    return;
  }

  for (const watcherRef of entityWatchers) {
    const watcher = watcherRef.deref();

    if (watcher === undefined) {
      entityWatchers.delete(watcherRef);

      continue;
    }

    watcher.keysChanged(entity);
  }
};

export default keysChanged;
