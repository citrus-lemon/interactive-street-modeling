import { Variable } from "../core";

// CachedVariable implementation as a mixin
class CachedVariable<T> extends Variable<T> {
  private cachedValue: T | undefined;

  constructor(valueFunction: () => T, observables: any[] = []) {
    super(valueFunction, observables);
    this.subscribe(() => (this.cachedValue = undefined));
  }

  get value() {
    if (this.cachedValue !== undefined) {
      return this.cachedValue;
    } else {
      return (this.cachedValue = (this as any).valueFunction());
    }
  }
}

declare module "../core" {
  interface Variable<T> {
    /**
     * Cache the computed value until dependencies change
     * Useful for expensive computations that don't need to run on every access
     * @returns CachedVariable that memoizes the result
     */
    cached(): CachedVariable<T>;
  }
}

Variable.prototype.cached = function <T>(this: Variable<T>): CachedVariable<T> {
  return new CachedVariable(
    () => this.value,
    (this as any).observables
  );
};

export { CachedVariable };
