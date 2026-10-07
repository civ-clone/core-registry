import { EntityRegistry, RegistryIndex } from '../EntityRegistry';
import { expect } from 'chai';
import keysChanged from '../keysChanged';

let things = 0;

// An entity filed by something that changes, which says so, as a unit does when it moves. Each has its own id, so that
//  `deep.equal` tells two of them apart and an answer in the wrong order fails.
class Thing {
  private _id: number = ++things;
  private _place: string | null;

  constructor(place: string | null) {
    this._place = place;
  }

  place(): string | null {
    return this._place;
  }

  setPlace(place: string | null): void {
    this._place = place;

    keysChanged(this);
  }
}

class ThingRegistry extends EntityRegistry<Thing> {
  private _byPlace: RegistryIndex<Thing, string> = this.index(
    (thing: Thing): string | null => thing.place()
  );

  constructor() {
    super(Thing);
  }

  getByPlace(place: string): Thing[] {
    return this._byPlace.get(place);
  }

  // What the lookup replaces.
  scan(place: string): Thing[] {
    return this.filter((thing: Thing): boolean => thing.place() === place);
  }
}

describe('keysChanged', (): void => {
  it('should re-file an entry when it says its key changed', (): void => {
    const registry = new ThingRegistry(),
      thing = new Thing('here');

    registry.register(thing);
    thing.setPlace('there');

    expect(registry.getByPlace('here')).to.deep.equal([]);
    expect(registry.getByPlace('there')).to.deep.equal([thing]);
  });

  it('should answer in registration order, however entries have moved', (): void => {
    const registry = new ThingRegistry(),
      things = [1, 2, 3].map((): Thing => new Thing('here'));

    registry.register(...things);
    things[0].setPlace('there');
    things[0].setPlace('here');

    expect(registry.getByPlace('here')).to.deep.equal(things);

    // Unregistered and registered again, it goes to the end, as in `entries()`.
    registry.unregister(things[0]);
    registry.register(things[0]);

    expect(registry.getByPlace('here')).to.deep.equal(registry.entries());
  });

  it('should take an entry whose key becomes null out of the index, and put it back when it has one again', (): void => {
    const registry = new ThingRegistry(),
      thing = new Thing(null);

    registry.register(thing);

    expect(registry.getByPlace('here')).to.deep.equal([]);

    thing.setPlace('here');

    expect(registry.getByPlace('here')).to.deep.equal([thing]);

    thing.setPlace(null);

    expect(registry.getByPlace('here')).to.deep.equal([]);
  });

  it('should keep every registry holding an entry up to date, and stop once it is unregistered', (): void => {
    const first = new ThingRegistry(),
      second = new ThingRegistry(),
      thing = new Thing('here');

    first.register(thing);
    second.register(thing);
    thing.setPlace('there');

    expect(first.getByPlace('there')).to.deep.equal([thing]);
    expect(second.getByPlace('there')).to.deep.equal([thing]);

    second.unregister(thing);
    thing.setPlace('elsewhere');

    expect(first.getByPlace('elsewhere')).to.deep.equal([thing]);
    expect(second.getByPlace('elsewhere')).to.deep.equal([]);
  });

  it('should follow entries registered before the index was declared', (): void => {
    class LateRegistry extends EntityRegistry<Thing> {
      byPlace: RegistryIndex<Thing, string> | null = null;

      constructor() {
        super(Thing);
      }

      declare(): void {
        this.byPlace = this.index((thing: Thing) => thing.place());
      }
    }

    const registry = new LateRegistry(),
      thing = new Thing('here');

    registry.register(thing);
    registry.declare();
    thing.setPlace('there');

    expect(registry.byPlace!.get('there')).to.deep.equal([thing]);
  });

  it('should re-file with `reindex`, for an entry that changed without saying so', (): void => {
    class Quiet {
      id = ++things;
      place = 'here';
    }

    class QuietRegistry extends EntityRegistry<Quiet> {
      byPlace = this.index((quiet: Quiet): string => quiet.place);

      constructor() {
        super(Quiet);
      }
    }

    const registry = new QuietRegistry(),
      quiet = new Quiet();

    registry.register(quiet);
    quiet.place = 'there';

    expect(registry.byPlace.get('there')).to.deep.equal([]);

    registry.reindex(quiet);

    expect(registry.byPlace.get('here')).to.deep.equal([]);
    expect(registry.byPlace.get('there')).to.deep.equal([quiet]);
  });

  it('should not keep a registry alive through the entries it held', async function (): Promise<void> {
    // Only observable with `node --expose-gc`; skipped otherwise.
    const gc: (() => void) | undefined = (globalThis as any).gc;

    if (
      typeof gc !== 'function' ||
      typeof (globalThis as any).WeakRef !== 'function'
    ) {
      this.skip();
    }

    const thing = new Thing('here'),
      kept = new ThingRegistry(),
      dropped = ((): { deref(): ThingRegistry | undefined } => {
        const registry = new ThingRegistry();

        registry.register(thing);

        return new (globalThis as any).WeakRef(registry);
      })();

    kept.register(thing);

    // A weak reference is only cleared between jobs, so let one end either side of collecting.
    await new Promise((resolve) => setImmediate(resolve));
    gc!();
    await new Promise((resolve) => setImmediate(resolve));

    expect(dropped.deref()).to.equal(undefined);

    thing.setPlace('there');

    expect(kept.getByPlace('there')).to.deep.equal([thing]);
  });

  it('should always answer as a scan would, over many random changes', (): void => {
    // A small seeded generator, so a failure can be replayed.
    let seed = 308;
    const random = (): number => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;

        return seed / 0x7fffffff;
      },
      pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)],
      places = ['a', 'b', 'c', 'd', 'e'],
      registries = [new ThingRegistry(), new ThingRegistry()],
      things: Thing[] = [];

    for (let step = 0; step < 3000; step++) {
      const action = random();

      if (things.length < 4 || action < 0.15) {
        const thing = new Thing(random() < 0.1 ? null : pick(places));

        things.push(thing);
        pick(registries).register(thing);
      } else if (action < 0.25) {
        pick(registries).unregister(pick(things));
      } else if (action < 0.35) {
        pick(registries).register(pick(things));
      } else {
        pick(things).setPlace(random() < 0.1 ? null : pick(places));
      }

      registries.forEach((registry: ThingRegistry): void =>
        places.forEach((place: string): void => {
          expect(registry.getByPlace(place), `step ${step}`).to.deep.equal(
            registry.scan(place)
          );
        })
      );
    }
  });
});
