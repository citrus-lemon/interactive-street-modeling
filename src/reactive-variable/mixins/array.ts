import { Variable } from "../core";

// Helper type to extract array item type
type ArrayItem<T> = T extends (infer U)[] ? U : never;

// Type guard to check if variable contains an array
type IsArray<T> = T extends any[] ? T : never;

declare module "../core" {
  interface Variable<T> {
    /**
     * Transform each element of an array
     * Only available when T is an array type
     * @param fn Transformation function
     * @returns New variable with transformed array
     */
    map<U>(
      this: Variable<IsArray<T>>,
      fn: (item: ArrayItem<T>, index: number) => U
    ): Variable<U[]>;

    /**
     * Filter array elements
     * Only available when T is an array type
     * @param predicate Filter function
     * @returns New variable with filtered array
     */
    filter(
      this: Variable<IsArray<T>>,
      predicate: (item: ArrayItem<T>, index: number) => boolean
    ): Variable<T>;

    /**
     * Reduce array to a single value
     * Only available when T is an array type
     * @param fn Reducer function
     * @param initialValue Initial accumulator value
     * @returns New variable with reduced value
     */
    reduce<U>(
      this: Variable<IsArray<T>>,
      fn: (acc: U, item: ArrayItem<T>, index: number) => U,
      initialValue: U
    ): Variable<U>;

    /**
     * Get array length reactively
     * Only available when T is an array type
     */
    readonly length: Variable<number>;

    /**
     * Get element at specific index
     * Only available when T is an array type
     * @param index Array index
     * @returns New variable with element at index
     */
    at(
      this: Variable<IsArray<T>>,
      index: number
    ): Variable<ArrayItem<T> | undefined>;

    /**
     * Find first element matching predicate
     * Only available when T is an array type
     * @param predicate Search function
     * @returns New variable with found element or undefined
     */
    find(
      this: Variable<IsArray<T>>,
      predicate: (item: ArrayItem<T>, index: number) => boolean
    ): Variable<ArrayItem<T> | undefined>;

    /**
     * Check if any element matches predicate
     * Only available when T is an array type
     * @param predicate Test function
     * @returns New variable with boolean result
     */
    some(
      this: Variable<IsArray<T>>,
      predicate: (item: ArrayItem<T>, index: number) => boolean
    ): Variable<boolean>;

    /**
     * Check if all elements match predicate
     * Only available when T is an array type
     * @param predicate Test function
     * @returns New variable with boolean result
     */
    every(
      this: Variable<IsArray<T>>,
      predicate: (item: ArrayItem<T>, index: number) => boolean
    ): Variable<boolean>;
  }
}

Variable.prototype.map = function <T, U>(
  this: Variable<T[]>,
  fn: (item: T, index: number) => U
): Variable<U[]> {
  return this.apply((arr) => arr.map(fn));
};

Variable.prototype.filter = function <T>(
  this: Variable<T[]>,
  predicate: (item: T, index: number) => boolean
): Variable<T[]> {
  return this.apply((arr) => arr.filter(predicate));
};

Variable.prototype.reduce = function <T, U>(
  this: Variable<T[]>,
  fn: (acc: U, item: T, index: number) => U,
  initialValue: U
): Variable<U> {
  return this.apply((arr) => arr.reduce(fn, initialValue));
};

Object.defineProperty(Variable.prototype, "length", {
  get: function <T>(this: Variable<T[]>) {
    return this.apply((arr) => arr.length);
  },
  configurable: true,
});

Variable.prototype.at = function <T>(
  this: Variable<T[]>,
  index: number
): Variable<T | undefined> {
  return this.apply((arr) => arr[index]);
};

Variable.prototype.find = function <T>(
  this: Variable<T[]>,
  predicate: (item: T, index: number) => boolean
): Variable<T | undefined> {
  return this.apply((arr) => arr.find(predicate));
};

Variable.prototype.some = function <T>(
  this: Variable<T[]>,
  predicate: (item: T, index: number) => boolean
): Variable<boolean> {
  return this.apply((arr) => arr.some(predicate));
};

Variable.prototype.every = function <T>(
  this: Variable<T[]>,
  predicate: (item: T, index: number) => boolean
): Variable<boolean> {
  return this.apply((arr) => arr.every(predicate));
};
