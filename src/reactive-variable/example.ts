import { html, render } from "lit";
import { block, InputVariable, Variable, variable } from ".";

const a = variable(3);
const b = a.apply((k) => `lit: ${k}`);
const d = variable("qeqw");
const c = block({ d, b, e: 3 }).lit(({ d, b, e }) => html`d@${d} b${b} e ${e}`);
const q = variable(false);
const sel: InputVariable<"bfs" | "dfs"> = variable("bfs");

render(
  html` <div>${a.input({ label: "as", min: "3", max: "15", step: "2" })}</div>
    <div>${d.input({ label: "asdf" })}</div>
    <div>${q.input({ label: "qq" })}</div>
    <div>${sel.input({ selection: ["bfs", "dfs"] })}</div>

    <div>${c} - - ${sel.view}</div>`,
  document.querySelector("#root") as HTMLElement
);
