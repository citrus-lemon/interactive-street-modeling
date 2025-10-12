import { Variable } from "../core";

// Helper type to convert Variable<{a: T, b: U}> to {a: Variable<T>, b: Variable<U>}
type Destructure<T> = {
  [K in keyof T]: Variable<T[K]>;
};

// Type guard to check if variable contains an object
type IsObject<T> = T extends object ? (T extends any[] ? never : T) : never;

declare module "../core" {
  interface Variable<T> {
    /**
     * Destructure an object variable into separate variables for each property
     * Only available when T is an object type (not array)
     * @returns Object with Variable for each property
     */
    destructure(this: Variable<IsObject<T>>): Destructure<T>;

    /**
     * Get a single property as a reactive variable
     * Only available when T is an object type
     * @param key Property key
     * @returns Variable tracking that property
     */
    pick<K extends keyof IsObject<T>>(
      this: Variable<IsObject<T>>,
      key: K
    ): Variable<IsObject<T>[K]>;

    /**
     * Get multiple properties as reactive variables
     * Only available when T is an object type
     * @param keys Array of property keys
     * @returns Object with Variables for selected properties
     */
    picks<K extends keyof T>(
      this: Variable<IsObject<T>>,
      ...keys: K[]
    ): { [P in K]: Variable<T[P]> };
  }
}

Variable.prototype.destructure = function <T extends Record<string, any>>(
  this: Variable<T>
): Destructure<T> {
  const result: any = {};

  // Get all keys from current value
  const currentValue = this.value;
  const keys = Object.keys(currentValue) as (keyof T)[];

  // Create a variable for each property
  for (const key of keys) {
    result[key] = this.apply((obj) => obj[key]);
  }

  return result;
};

Variable.prototype.pick = function <T extends Record<string, any>, K extends keyof T>(
  this: Variable<T>,
  key: K
): Variable<T[K]> {
  return this.apply((obj) => obj[key]);
};

Variable.prototype.picks = function <T extends Record<string, any>, K extends keyof T>(
  this: Variable<T>,
  ...keys: K[]
): Pick<Destructure<T>, K> {
  const result: any = {};

  for (const key of keys) {
    result[key] = this.apply((obj) => obj[key]);
  }

  return result;
};
