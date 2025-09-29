import { html, render } from "lit";
import { block, variable } from ".";

const a = variable(3);
const b = a.apply((k) => `lit: ${k}`);
const d = variable("qeqw");
const c = block({ d, b, e: 3 }).lit(({ d, b, e }) => html`d@${d} b${b} e ${e}`);

render(
  html` ${a.input({ label: "as", min: "3", max: "15", step: "2" })}
    <div>${c}</div>`,
  document.querySelector("#root") as HTMLElement
);
