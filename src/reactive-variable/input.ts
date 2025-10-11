import { html, nothing, TemplateResult } from "lit";
import { InputVariable } from "./core";

type InputComponentOptionType = Partial<HTMLInputElement> & {
  label?: string;
  selection?: string[] | { [key: string]: string };
  style?: string;
  rows?: number;
  cols?: number;
};

declare module "./core" {
  interface InputVariable<T> {
    input(options?: InputComponentOptionType): any;
  }
}

InputVariable.prototype.input = function (options?: InputComponentOptionType) {
  return inputComponent(this, options);
};

export function inputComponent<T>(
  val: InputVariable<T>,
  options?: InputComponentOptionType
): TemplateResult<any> {
  const { label, selection, style, type, rows, cols, ...attrs } = options || {};

  // Number input
  if (typeof val.value === "number") {
    const inputType = type || "range";
    return html`<label>
      ${label && `${label}: `} ${val.view}
      <input
        type=${inputType as "range"}
        .value=${String(val.value)}
        @input=${(e: Event) => {
          val.value = Number((e.target as HTMLInputElement).value) as T;
        }}
        style=${style || ""}
        min=${attrs.min || ""}
        max=${attrs.max || ""}
        step=${attrs.step || ("" as any)}
        placeholder=${attrs.placeholder || ""}
      />
    </label>`;
  }

  // Selection/Dropdown input
  if (selection) {
    const optionsList = Array.isArray(selection)
      ? selection.map((v) => [v, v])
      : Object.entries(selection);
    return html`<label>
      ${label}
      <select
        .value=${val.value as string}
        @change=${(e: Event) => {
          val.value = (e.target as HTMLSelectElement).value as T;
        }}
        style=${style || ""}
      >
        ${optionsList.map(
          ([value, showName]) =>
            html`<option value=${value}>${showName}</option>`
        )}
      </select>
    </label>`;
  }

  // String input
  if (typeof val.value === "string") {
    const inputType = type || "text";

    // Textarea for multiline or long text
    if (inputType === "textarea" || (attrs as any).multiline) {
      return html`<label>
        ${label && `${label}: `}
        <textarea
          .value=${val.value}
          @input=${(e: Event) => {
            val.value = (e.target as HTMLTextAreaElement).value as T;
          }}
          style=${style || ""}
          rows=${rows || 3}
          cols=${cols || 40}
          placeholder=${attrs.placeholder || ""}
        ></textarea>
      </label>`;
    }

    // Regular input for text, email, password, url, color, etc.
    return html`<label>
      ${label && `${label}: `}
      <input
        type=${inputType as any}
        .value=${val.value}
        @input=${(e: Event) => {
          val.value = (e.target as HTMLInputElement).value as T;
        }}
        style=${style || ""}
        placeholder=${attrs.placeholder || ""}
        pattern=${attrs.pattern || ""}
        maxlength=${attrs.maxLength || ""}
      />
    </label>`;
  }

  // Boolean input
  if (typeof val.value === "boolean") {
    return html`<label>
      <input
        type="checkbox"
        .checked=${val.value}
        @change=${(e: Event) => {
          val.value = (e.target as HTMLInputElement).checked as T;
        }}
        style=${style || ""}
      />
      ${label}
    </label>`;
  }

  // Date input
  if (val.value instanceof Date) {
    const inputType = type || "date";
    let dateValue = "";

    if (inputType === "datetime-local") {
      dateValue = (val.value as Date).toISOString().slice(0, 16);
    } else if (inputType === "time") {
      dateValue = (val.value as Date).toISOString().slice(11, 16);
    } else {
      dateValue = (val.value as Date).toISOString().split("T")[0];
    }

    return html`<label>
      ${label && `${label}: `}
      <input
        type=${inputType as "date"}
        .value=${dateValue}
        @change=${(e: Event) => {
          val.value = new Date((e.target as HTMLInputElement).value) as T;
        }}
        style=${style || ""}
      />
    </label>`;
  }

  // Array input (textarea with JSON)
  if (Array.isArray(val.value)) {
    return html`<label>
      ${label && `${label}: `}
      <textarea
        .value=${JSON.stringify(val.value)}
        @input=${(e: Event) => {
          try {
            val.value = JSON.parse(
              (e.target as HTMLTextAreaElement).value
            ) as T;
          } catch {}
        }}
        style=${style || ""}
        rows=${rows || 3}
        cols=${cols || 40}
      ></textarea>
    </label>`;
  }

  // Object input (textarea with formatted JSON)
  if (typeof val.value === "object" && val.value !== null) {
    return html`<label>
      ${label && `${label}: `}
      <textarea
        .value=${JSON.stringify(val.value, null, 2)}
        @input=${(e: Event) => {
          try {
            val.value = JSON.parse(
              (e.target as HTMLTextAreaElement).value
            ) as T;
          } catch {}
        }}
        style=${style || ""}
        rows=${rows || 5}
        cols=${cols || 40}
      ></textarea>
    </label>`;
  }

  // Fallback: display only
  return html`${label && `${label}: `}${val.view}`;
}

class CustomInputVariable<T> extends InputVariable<T> {
  constructor(
    value: T,
    private inputGenerator: (val: InputVariable<T>) => Node
  ) {
    super(value);
  }
  override input(): any {
    return this.inputGenerator(this);
  }
}

interface InputsRangeOption {
  value?: number;
  step?: number;
  label?: string;
}
interface RadioRangeOption<T> {
  label?: string;
  value?: T;
}
interface SliderOption {
  value?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
}
interface ColorOption {
  value?: string;
  label?: string;
}
interface TextareaOption {
  value?: string;
  label?: string;
  rows?: number;
  cols?: number;
}

export class Inputs {
  static range(r: [number, number], opt?: InputsRangeOption) {
    return new CustomInputVariable(opt?.value ?? r[0], (self) =>
      self.lit(
        (value) => html`
          <label> ${opt?.label} </label>
          <input
            type="number"
            min=${r[0]}
            max=${r[1]}
            .value=${String(value)}
            step=${opt?.step ?? 1}
            @input=${(e: Event) => {
              const target = e.target as HTMLInputElement;
              self.value = Number(target.value);
            }}
          />
          <input
            type="range"
            min=${r[0]}
            max=${r[1]}
            .value=${String(value)}
            step=${opt?.step ?? 1}
            @input=${(e: Event) => {
              const target = e.target as HTMLInputElement;
              self.value = Number(target.value);
            }}
          />
        `
      )
    );
  }

  static slider(r: [number, number], opt?: SliderOption) {
    return new CustomInputVariable(opt?.value ?? r[0], (self) =>
      self.lit(
        (value) => html`
          <label>
            ${opt?.label}
            ${opt?.showValue !== false ? html`<span>${value}</span>` : nothing}
            <input
              type="range"
              min=${r[0]}
              max=${r[1]}
              .value=${String(value)}
              step=${opt?.step ?? 1}
              @input=${(e: Event) => {
                self.value = Number((e.target as HTMLInputElement).value);
              }}
            />
          </label>
        `
      )
    );
  }

  static radio<T extends string>(
    options: T[],
    opt?: RadioRangeOption<T>
  ): CustomInputVariable<T> {
    return new CustomInputVariable(opt?.value ?? ("" as T), (self) =>
      self.lit(
        (value) => html`
          <label>${opt?.label}</label>
          <select
            .value=${value as string}
            @change=${(e: Event) => {
              self.value = (e.target as HTMLSelectElement).value as T;
            }}
          >
            ${options.map(
              (option) =>
                html`<option value=${option as string}>${option}</option>`
            )}
          </select>
        `
      )
    );
  }

  static color(opt?: ColorOption): CustomInputVariable<string> {
    return new CustomInputVariable(opt?.value ?? "#000000", (self) =>
      self.lit(
        (value) => html`
          <label>
            ${opt?.label}
            <input
              type="color"
              .value=${value}
              @input=${(e: Event) => {
                self.value = (e.target as HTMLInputElement).value;
              }}
            />
            <span>${value}</span>
          </label>
        `
      )
    );
  }

  static textarea(opt?: TextareaOption): CustomInputVariable<string> {
    return new CustomInputVariable(opt?.value ?? "", (self) =>
      self.lit(
        (value) => html`
          <label>
            ${opt?.label}
            <textarea
              .value=${value}
              @input=${(e: Event) => {
                self.value = (e.target as HTMLTextAreaElement).value;
              }}
              rows=${opt?.rows ?? 5}
              cols=${opt?.cols ?? 50}
            ></textarea>
          </label>
        `
      )
    );
  }

  static button<T>(
    label: string,
    onClick: () => T
  ): CustomInputVariable<T | null> {
    return new CustomInputVariable(null as T | null, (self) =>
      self.lit(
        (value) => html`
          <button
            @click=${() => {
              self.value = onClick();
            }}
          >
            ${label}
          </button>
          ${value !== null ? html`<span>Result: ${value}</span>` : nothing}
        `
      )
    );
  }
}
