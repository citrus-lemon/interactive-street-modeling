import { html, render } from "lit";
import { poisson } from "./utils/poisson";
import { box } from "./utils/flatten-expand";
import * as Plot from "@observablehq/plot";
import SeedRandom from "seed-random";
import { hexagonGrid } from "./grids/HexagonGrid";
import { plot_board } from "./plot";
import { boardLayer } from "./grids/BoardGrid";
import { squareGrid } from "./grids/SquareGrid";
import { voronoiGrid } from "./grids/VoronoiGrid";

let random = SeedRandom();
let bound = box(-100, -100, 100, 100);

let points = poisson({ bound, n: 100, random });
let board = voronoiGrid({ points, bound });
let layer1 = boardLayer({
  board,
  initializer(cell, board) {
    const { x, y } = board.getCellCenter(cell);
    return x + y;
  },
});
let layer2 = boardLayer({
  board: board.delaunayGrid,
});
(top as any).board = board;

let p = Plot.plot({
  aspectRatio: 1,
  // ...{
  //   x: { domain: [bound.xmin - 10, bound.xmax + 10] },
  //   y: { domain: [bound.ymin - 10, bound.ymax + 10] },
  // },
  marks: [
    plot_board(layer1),
    plot_board(layer2, { stroke: "blue" }),
    // Plot.dot(
    //   board.getAllCells().map((cell) => board.getCellCenter(cell)),
    //   { x: "x", y: "y" }
    // ),
    // Plot.text(
    //   board.getAllCells().map((cell) => {
    //     const { x, y } = board.getCellCenter(cell);
    //     return { x, y, cell };
    //   }),
    //   { x: "x", y: "y", text: "cell" }
    // ),
    Plot.rect([[-100, -100, 100, 100]], {
      x1: "0", // or ([x1]) => x1
      y1: "1", // or ([, y1]) => y1
      x2: "2", // or ([,, x2]) => x2
      y2: "3", // or ([,,, y2]) => y2
      stroke: "currentColor",
    }),
    Plot.dot(points, { x: "x", y: "y" }),
  ],
});

render(
  html`
    <h1>Terrain Generation</h1>
    <div>${p}</div>
    <p>${points.length}</p>
  `,
  document.querySelector("#root") as HTMLElement
);
