import { html, render } from "lit";
import { merge, Observable, Subject } from "rxjs";

export class Variable<T> {
  protected constructor(
    protected valueFunction: () => T,
    protected observables: Observable<null>[] = []
  ) {}

  get value() {
    return this.valueFunction();
  }

  apply<U>(transformer: (value: T) => U): Variable<U> {
    return new Variable(() => transformer(this.value), this.observables);
  }

  cached(): CachedVariable<T> {
    return new CachedVariable(() => this.value, this.observables);
  }

  subscribe(observerNext: () => void): this {
    merge(...this.observables).subscribe({ next: observerNext });
    return this;
  }

  get view() {
    return this.lit();
  }

  *[Symbol.iterator]() {
    yield this.lit();
  }

  lit(template?: (value: T) => unknown) {
    const frag = new DocumentFragment();
    const finshedTemplate = template ? template : (value: T) => html`${value}`;
    render(finshedTemplate(this.value), frag);
    this.subscribe(() => render(finshedTemplate(this.value), frag));
    return frag;
  }
}

export class CachedVariable<T> extends Variable<T> {
  private cachedValue: T | undefined;

  constructor(valueFunction: () => T, observables: Observable<null>[] = []) {
    super(valueFunction, observables);
    this.subscribe(() => (this.cachedValue = undefined));
  }

  get value() {
    if (this.cachedValue !== undefined) {
      return this.cachedValue;
    } else {
      return (this.cachedValue = this.valueFunction());
    }
  }
}

export class InputVariable<T> extends Variable<T> {
  private observer;
  constructor(private varValue: T) {
    const observer = new Subject<null>();
    super(() => this.varValue, [observer]);
    this.observer = observer;
  }
  get value(): T {
    return this.varValue;
  }
  set value(newValue: T) {
    this.varValue = newValue;
    this.observer.next(null);
  }
}

class CompositeVariable<T extends object> extends Variable<{
  [K in keyof T]: Unwrap<T[K]>;
}> {
  constructor(args: T) {
    const valuesGenerators: [string, () => any][] = [];
    const observables = [];
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

export type MaybeVariable<T> = Variable<T> | T;

type Unwrap<W> = W extends Variable<infer T> ? T : W;

export function variable<T>(value: T) {
  return new InputVariable(value);
}

export function block<T extends object>(
  args: T
): Variable<{ [K in keyof T]: Unwrap<T[K]> }> {
  return new CompositeVariable(args);
}
