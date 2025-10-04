import { html, render } from "lit";
import { merge, Observable, Subject } from "rxjs";

export class Variable<T> {
  protected constructor(
    private valueFunction: () => T,
    private observables: Observable<null>[] = []
  ) {}

  get value() {
    return this.valueFunction();
  }

  apply<U>(transformer: (value: T) => U) {
    return new Variable(() => transformer(this.value), this.observables);
  }

  subscribe(observerNext: () => void) {
    merge(...this.observables).subscribe({ next: observerNext });
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

class CompositeVariable<T extends object> extends Variable<UnwrapStruct<T>> {
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
        ) as UnwrapStruct<T>,
      observables
    );
  }
}

export type MaybeVariable<T> = Variable<T> | T;

type Unwrap<W> = W extends Variable<infer T> ? T : W;

type UnwrapStruct<T> = {
  [P in keyof T]: Unwrap<T[P]>;
};

export function variable<T>(value: T) {
  return new InputVariable(value);
}

export function block<T extends object>(args: T): Variable<UnwrapStruct<T>> {
  return new CompositeVariable(args);
}
