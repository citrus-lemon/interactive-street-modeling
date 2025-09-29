import { html, TemplateResult } from "lit";
import { InputVariable } from "./core";
import { spread } from "@open-wc/lit-helpers";

type InputComponentOptionType = Partial<HTMLInputElement> & {
  label?: string;
  selection?: string[] | { [key: string]: string };
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
  const { label, selection, ...args } = options || {};
  let callback;
  let type: HTMLInputElement["type"];
  if (typeof val.value === "number") {
    type = args.type || "range";
    callback = (e: Event) => {
      const target = e.target as HTMLInputElement;
      val.value = Number(target.value) as T;
    };
    return html`<label>
      ${label && `${label}: `} ${val.view}
      <input
        ${spread({
          type,
          ...args,
          ".value": String(val.value),
          "@input": callback,
        })}
      />
    </label>`;
  } else if (selection) {
    return html`
      <label style="display: flex; align-items: center; gap: 5px;">
        ${label}
        <select
          .value=${val.value as string}
          @change=${(e: Event) => {
            val.value = (e.target as HTMLSelectElement).value as T;
          }}
        >
          ${(Array.isArray(selection)
            ? selection.map((a) => [a, a])
            : Object.entries(selection)
          ).map(
            ([value, showName]) =>
              html`<option value=${value}>${showName}</option>`
          )}
        </select>
      </label>
    `;
  } else if (typeof val.value === "string") {
    type = "text";
    callback = (e: Event) => {
      const target = e.target as HTMLInputElement;
      val.value = target.value as T;
    };
    return html`<label>
      ${label && `${label}: `}
      <input
        ${spread({
          type,
          ...args,
          ".value": String(val.value),
          "@input": callback,
        })}
      />
    </label>`;
  } else if (typeof val.value === "boolean") {
    type = "checkbox";
    return html`<label>
      <input
        type="checkbox"
        .checked=${val.value}
        @change=${(e: Event) => {
          val.value = (e.target as HTMLInputElement).checked as T;
        }}
        ${spread(args)}
      />
      ${label}
    </label>`;
  } else {
    return html`Variable ${val.view}`;
  }
}
