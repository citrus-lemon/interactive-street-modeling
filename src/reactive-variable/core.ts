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

export function variable<T>(value: T) {
  return new InputVariable(value);
}
