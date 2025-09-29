interface Variable<T> {
  apply<K>(transformer: (v: T) => K): Variable<K>;
  value(): T;
}

interface InputVariable<T> extends Variable<T> {
  next(newValue: T): void;
}

type MaybeVariable<T> = Variable<T> | T;

type Unwrap<W> = W extends Variable<infer T> ? T : W;

type UnwrapStruct<T> = {
  [P in keyof T]: Unwrap<T[P]>;
};

declare function variable<T>(arg: T): InputVariable<T>;
declare function block<T>(args: T): Variable<UnwrapStruct<T>>;

type exampleOfUnwrapStruct = UnwrapStruct<{
  e: Variable<number>;
  o: string;
}>;

let a1 = variable(3);
let a2 = block({ a1, n: "as" }).apply(({ a1, n }) => `Hello ${n} ${a1}`);
