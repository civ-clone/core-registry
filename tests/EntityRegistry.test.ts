import EntityRegistry from '../EntityRegistry';
import { expect } from 'chai';

describe('EntityRegistry', () => {
  const acceptsNothingRegistry: EntityRegistry = new EntityRegistry(null),
    acceptsArraysRegistry: EntityRegistry = new EntityRegistry(Array),
    acceptsDatesRegistry: EntityRegistry = new EntityRegistry(Date);

  it('should start with 0 entries', (): void => {
    expect(acceptsNothingRegistry.length).to.equal(0);
    expect(acceptsArraysRegistry.length).to.equal(0);
    expect(acceptsDatesRegistry.length).to.equal(0);
  });

  it('should reject types not supplied', (): void => {
    expect(() => acceptsNothingRegistry.register(1)).to.throw(TypeError);
    expect(() => acceptsNothingRegistry.register([])).to.throw(TypeError);
    expect(() => acceptsArraysRegistry.register(1)).to.throw(TypeError);
    expect(() => acceptsArraysRegistry.register('')).to.throw(TypeError);
    expect(() => acceptsArraysRegistry.register(new Date())).to.throw(
      TypeError
    );
    expect(() => acceptsDatesRegistry.register(/a/)).to.throw(TypeError);
    expect(() => acceptsDatesRegistry.register({})).to.throw(TypeError);
    expect(() => acceptsDatesRegistry.register('')).to.throw(TypeError);
  });

  it('should accept defined types', (): void => {
    expect(() => acceptsArraysRegistry.register([])).not.to.throw(TypeError);
    expect(() => acceptsDatesRegistry.register(new Date())).not.to.throw(
      TypeError
    );
  });

  it('should correctly count entries', (): void => {
    expect(acceptsArraysRegistry.length).to.equal(1);
    expect(acceptsDatesRegistry.length).to.equal(1);
  });

  it('should not add duplicates of the same object', (): void => {
    const array: [] = [];

    acceptsArraysRegistry.register(array);

    expect(acceptsArraysRegistry.length).to.equal(2);

    acceptsArraysRegistry.register(array);

    expect(acceptsArraysRegistry.length).to.equal(2);
  });

  it('should not be possible to store constructors', (): void => {
    const registry: EntityRegistry = new EntityRegistry(EntityRegistry);

    expect(() =>
      registry.register(class A extends EntityRegistry {})
    ).to.throw();
  });
});
