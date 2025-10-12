import { Observable } from "rxjs";
import { Variable } from "../core";

// Helper types
export type MaybeVariable<T> = Variable<T> | T;
type Unwrap<W> = W extends Variable<infer T> ? T : W;

// CompositeVariable implementation as a class
class CompositeVariable<T extends object> extends Variable<{
  [K in keyof T]: Unwrap<T[K]>;
}> {
  constructor(args: T) {
    const valuesGenerators: [string, () => any][] = [];
    const observables: Observable<null>[] = [];
    for (const [key, value] of Object.entries(args)) {
      if (value instanceof Variable) {
        valuesGenerators.push([key, () => value.value]);
        // @ts-ignore
        observables.push(...value.observables);
      } else {
        valuesGenerators.push([key, () => value]);
      }
    }
    super(
      () =>
        Object.fromEntries(
          valuesGenerators.map(([key, valueGenerator]) => [
            key,
            valueGenerator(),
          ])
        ) as { [K in keyof T]: Unwrap<T[K]> },
      observables
    );
  }
}

/**
 * Combine multiple variables (or static values) into a single reactive object
 * @param args Object with Variable instances or static values
 * @returns Variable containing an object with unwrapped values
 * @example
 * const combined = block({ a: variable(1), b: variable(2), c: 3 });
 * combined.value // { a: 1, b: 2, c: 3 }
 */
export function block<T extends object>(
  args: T
): Variable<{ [K in keyof T]: Unwrap<T[K]> }> {
  return new CompositeVariable(args);
}

export { CompositeVariable };
