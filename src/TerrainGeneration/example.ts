import { html, render } from "lit";
import { poisson } from "./utils/poisson";
import { box } from "./utils/flatten-expand";
import * as Plot from "@observablehq/plot";
import SeedRandom from "seed-random";

let random = SeedRandom();
let bound = box(-100, -100, 100, 100);

let points = poisson({ bound, n: 30, random });

let p = Plot.plot({
  ...bound.args_plot(),
  marks: [Plot.dot(points, { x: "x", y: "y" })],
});

render(
  html`
    <h1>Terrain Generation</h1>
    <div>${p}</div>
    <p>${points.length}</p>
  `,
  document.querySelector("#root") as HTMLElement
);
