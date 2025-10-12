import { Variable } from "../core";

declare module "../core" {
  interface Variable<T> {
    /**
     * Log the variable value to console whenever it changes
     * @param label Optional label to identify the log
     * @returns this for method chaining
     */
    log(label?: string): this;

    /**
     * Execute a side effect function whenever the value changes
     * @param fn Function to execute with the current value
     * @returns this for method chaining
     */
    tap(fn: (value: T) => void): this;

    /**
     * Enable detailed debugging with change count
     * @returns this for method chaining
     */
    debug(): this;
  }
}

Variable.prototype.log = function <T>(this: Variable<T>, label?: string) {
  this.subscribe(() => {
    console.log(label ? `${label}:` : "Variable:", this.value);
  });
  return this;
};

Variable.prototype.tap = function <T>(
  this: Variable<T>,
  fn: (value: T) => void
) {
  this.subscribe(() => fn(this.value));
  return this;
};

Variable.prototype.debug = function <T>(this: Variable<T>) {
  let changeCount = 0;
  console.log(`[Debug] Initial value:`, this.value);
  this.subscribe(() => {
    changeCount++;
    console.log(`[Debug] Change #${changeCount}:`, this.value);
  });
  return this;
};
