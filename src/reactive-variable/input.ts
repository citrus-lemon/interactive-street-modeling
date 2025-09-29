import { html, TemplateResult } from "lit";
import { InputVariable } from "./core";
import { spread } from "@open-wc/lit-helpers";

type InputComponentOptionType = Partial<HTMLInputElement> & {
  label?: string;
};

declare module "./core" {
  interface InputVariable<T> {
    input(options?: InputComponentOptionType): TemplateResult<any>;
  }
}

InputVariable.prototype.input = function (options?: InputComponentOptionType) {
  return inputComponent(this, options);
};

export function inputComponent<T>(
  val: InputVariable<T>,
  options?: InputComponentOptionType
): TemplateResult<any> {
  const { label, ...args } = options || {};
  let callback;
  let type: HTMLInputElement["type"];
  if (typeof val.value === "number") {
    type = "range";
    callback = (e: Event) => {
      const target = e.target as HTMLInputElement;
      val.value = Number(target.value) as T;
    };
  } else if (typeof val.value === "string") {
    type = "text";
    callback = (e: Event) => {
      const target = e.target as HTMLInputElement;
      val.value = target.value as T;
    };
  } else {
    return html`Variable ${val.view}`;
  }
  const attrs = spread({
    type,
    ...args,
    ".value": String(val.value),
    "@input": callback,
  });
  return html`
    ${label && html`<label>${label}</label>: ${val.view}`}
    <input ${attrs} />
  `;
}
