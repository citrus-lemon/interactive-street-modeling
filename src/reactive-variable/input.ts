import { html, nothing, TemplateResult } from "lit";
import { InputVariable, variable } from "./core";

type InputComponentOptionType = Partial<HTMLInputElement> & {
  label?: string;
  selection?: string[] | { [key: string]: string };
  style?: string;
  rows?: number;
  cols?: number;
};

// ============================================
// INPUT REGISTRY SYSTEM
// ============================================

type InputGenerator<T> = (
  val: InputVariable<T>,
  value: T,
  options?: any
) => TemplateResult | DocumentFragment;

class InputRegistry {
  private generators = new Map<string, InputGenerator<any>>();

  register<T>(name: string, generator: InputGenerator<T>) {
    this.generators.set(name, generator);
  }

  get(name: string): InputGenerator<any> | undefined {
    return this.generators.get(name);
  }

  has(name: string): boolean {
    return this.generators.has(name);
  }
}

const inputRegistry = new InputRegistry();

// ============================================
// EXTEND INPUT VARIABLE WITH PROPERTIES AND METHODS
// ============================================

declare module "./core" {
  interface InputVariable<T> {
    /** Internal: stores the registered input type name */
    _inputType?: string;
    /** Internal: stores options for the registered input */
    _inputOptions?: any;

    /**
     * Generate an input component for this variable
     * If a custom input type was set via useInput(), uses that generator
     * Otherwise, automatically detects appropriate input based on value type
     * @param options Override options for the input component
     */
    input(options?: InputComponentOptionType): any;

    /**
     * Set a custom input type for this variable
     * Returns the same variable instance (not a copy) for chaining
     * @param type Registered input type name (e.g., "range", "slider", "radio")
     * @param options Options to pass to the input generator
     * @returns This variable instance
     */
    useInput(type: string, options?: any): this;
  }
}

InputVariable.prototype.useInput = function (type: string, options?: any): any {
  this._inputType = type;
  this._inputOptions = options;
  return this;
};

InputVariable.prototype.input = function (options?: InputComponentOptionType) {
  const inputType = this._inputType;
  const inputOptions = this._inputOptions;

  // If input type was registered, use it
  if (inputType && inputRegistry.has(inputType)) {
    const generator = inputRegistry.get(inputType)!;
    const mergedOptions = { ...inputOptions, ...options };
    return generator(this, this.value, mergedOptions);
  }

  // Otherwise use auto-detection
  return inputComponent(this, options);
};

// ============================================
// AUTO-DETECTION INPUT COMPONENT
// ============================================

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

// ============================================
// INPUTS CLASS - REGISTERS AND CREATES INPUTS
// ============================================

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
  private static initialized = false;

  private static init() {
    if (this.initialized) return;
    this.initialized = true;

    // Register "range" input type
    inputRegistry.register<number>("range", (val, value, opt) => {
      return val.lit(
        (value) => html`
          <label> ${opt?.label} </label>
          <input
            type="number"
            min=${opt?.min ?? 0}
            max=${opt?.max ?? 100}
            .value=${String(value)}
            step=${opt?.step ?? 1}
            @input=${(e: Event) => {
              const target = e.target as HTMLInputElement;
              val.value = Number(target.value);
            }}
          />
          <input
            type="range"
            min=${opt?.min ?? 0}
            max=${opt?.max ?? 100}
            .value=${String(value)}
            step=${opt?.step ?? 1}
            @input=${(e: Event) => {
              const target = e.target as HTMLInputElement;
              val.value = Number(target.value);
            }}
          />
        `
      );
    });

    // Register "slider" input type
    inputRegistry.register<number>("slider", (val, value, opt) => {
      return val.lit(
        (value) => html`
          <label>
            ${opt?.label}
            ${opt?.showValue !== false ? html`<span>${value}</span>` : nothing}
            <input
              type="range"
              min=${opt?.min ?? 0}
              max=${opt?.max ?? 100}
              .value=${String(value)}
              step=${opt?.step ?? 1}
              @input=${(e: Event) => {
                val.value = Number((e.target as HTMLInputElement).value);
              }}
            />
          </label>
        `
      );
    });

    // Register "radio" input type
    inputRegistry.register<string>("radio", (val, value, opt) => {
      return val.lit(
        (value) => html`
          <label>${opt?.label}</label>
          <select
            .value=${value as string}
            @change=${(e: Event) => {
              val.value = (e.target as HTMLSelectElement).value;
            }}
          >
            ${opt?.options.map(
              (option: string) =>
                html`<option value=${option}>${option}</option>`
            )}
          </select>
        `
      );
    });

    // Register "color" input type
    inputRegistry.register<string>("color", (val, value, opt) => {
      return val.lit(
        (value) => html`
          <label>
            ${opt?.label}
            <input
              type="color"
              .value=${value}
              @input=${(e: Event) => {
                val.value = (e.target as HTMLInputElement).value;
              }}
            />
            <span>${value}</span>
          </label>
        `
      );
    });

    // Register "textarea" input type
    inputRegistry.register<string>("textarea", (val, value, opt) => {
      return val.lit(
        (value) => html`
          <label>
            ${opt?.label}
            <textarea
              .value=${value}
              @input=${(e: Event) => {
                val.value = (e.target as HTMLTextAreaElement).value;
              }}
              rows=${opt?.rows ?? 5}
              cols=${opt?.cols ?? 50}
            ></textarea>
          </label>
        `
      );
    });

    // Register "button" input type
    inputRegistry.register<any>("button", (val, value, opt) => {
      return val.lit(
        (value) => html`
          <button
            @click=${() => {
              val.value = opt.onClick();
            }}
          >
            ${opt?.label}
          </button>
          ${value !== null ? html`<span>Result: ${value}</span>` : nothing}
        `
      );
    });
  }

  static range(
    r: [number, number],
    opt?: InputsRangeOption
  ): InputVariable<number> {
    this.init();
    return variable(opt?.value ?? r[0]).useInput("range", {
      min: r[0],
      max: r[1],
      step: opt?.step,
      label: opt?.label,
    });
  }

  static slider(
    r: [number, number],
    opt?: SliderOption
  ): InputVariable<number> {
    this.init();
    return variable(opt?.value ?? r[0]).useInput("slider", {
      min: r[0],
      max: r[1],
      step: opt?.step,
      label: opt?.label,
      showValue: opt?.showValue,
    });
  }

  static radio<T extends string>(
    options: T[],
    opt?: RadioRangeOption<T>
  ): InputVariable<T> {
    this.init();
    return variable(opt?.value ?? ("" as T)).useInput("radio", {
      options,
      label: opt?.label,
    });
  }

  static color(opt?: ColorOption): InputVariable<string> {
    this.init();
    return variable(opt?.value ?? "#000000").useInput("color", {
      label: opt?.label,
    });
  }

  static textarea(opt?: TextareaOption): InputVariable<string> {
    this.init();
    return variable(opt?.value ?? "").useInput("textarea", {
      label: opt?.label,
      rows: opt?.rows,
      cols: opt?.cols,
    });
  }

  static button<T>(label: string, onClick: () => T): InputVariable<T | null> {
    this.init();
    return variable(null as T | null).useInput("button", {
      label,
      onClick,
    });
  }
}
