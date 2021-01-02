import ConstructorRegistry from '../ConstructorRegistry';
import { expect } from 'chai';

describe('ConstructorRegistry', () => {
  it('should only accept constructors', (): void => {
    const registry: ConstructorRegistry = new ConstructorRegistry(
      ConstructorRegistry
    );

    class A extends ConstructorRegistry {}

    expect(() => registry.register(registry)).to.throw();
    expect(() => registry.register(A)).to.not.throw();

    const [entry] = registry.entries();

    expect(entry).to.equal(A);
  });

  it('should be possible to use primitive constructors', (): void => {
    const registry: ConstructorRegistry = new ConstructorRegistry(Function);

    class A {}
    class B extends A {}
    const c = () => {};
    const d = function () {};

    expect(() => registry.register(registry)).to.throw();
    expect(() => registry.register(A)).to.not.throw();
    expect(() => registry.register(B)).to.not.throw();
    expect(() => registry.register(c)).to.not.throw();
    expect(() => registry.register(d)).to.not.throw();
  });
});
