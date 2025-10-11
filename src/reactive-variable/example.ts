import { html, render } from "lit";
import { block, Inputs, InputVariable, variable } from ".";

const numberVar = variable(3);
const mapToStringVar = numberVar.apply((k) => `lit: ${k}`);
const stringVar = variable("qeqw");
const htmlTemplateVar = block({ d: stringVar, b: mapToStringVar, e: 3 }).apply(
  ({ d, b, e }) => html`d@${d} b${b} e ${e}`
);
const booleanVar = variable(false);
const selectionVar: InputVariable<"bfs" | "dfs"> = variable("bfs");
const cachedVar = block({ numberVar, stringVar })
  .apply(({ numberVar, stringVar }) => `${stringVar} + ${numberVar}`)
  .cached();

// Inputs
const rangeInput = Inputs.range([0, 100], { label: "qs" });
const radioInput = Inputs.radio(["a", "b"], { label: "radio", value: "a" });

render(
  html` <div>
      ${numberVar.input({ label: "as", min: "3", max: "15", step: "2" })}
    </div>
    <div>${stringVar.input({ label: "asdf" })}</div>
    <div>${booleanVar.input({ label: "qq" })}</div>
    <div>${selectionVar.input({ selection: ["bfs", "dfs"] })}</div>
    ${rangeInput.input()} ${rangeInput} ${radioInput.input()} ${radioInput}
    <div>${cachedVar}</div>
    <div>${htmlTemplateVar} - - ${selectionVar}</div>`,
  document.querySelector("#root") as HTMLElement
);
