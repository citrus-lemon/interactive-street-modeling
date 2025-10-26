import { html, render } from "lit";
import { poisson } from "./utils/poisson";
import { box } from "./utils/flatten-expand";
import * as Plot from "@observablehq/plot";
import SeedRandom from "seed-random";
import { hexagonGrid } from "./grids/HexagonGrid";
import { plot_board } from "./plot";
import {
  BoardGrid,
  BoardLayer,
  boardLayer,
  BoardLayerReader,
  Cell,
} from "./grids/BoardGrid";
import { squareGrid } from "./grids/SquareGrid";
import { voronoiGrid } from "./grids/VoronoiGrid";
import { PixiCanvas } from "./utils/pixi-expand";
import { Container, Graphics } from "pixi.js";
import { unzip } from "lodash";
import { interpolateSpectral, scaleSequential } from "d3";

let random = SeedRandom("a");
let bound = box(-100, -100, 100, 100);

let hexagon = hexagonGrid({ bound, cellSize: 1 });
let square = squareGrid({ bound, cellSize: 2 });

let points = poisson({ bound, n: 10000, random });
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

const delaunay = board.delaunayGrid;

const qq = delaunay.getAllCells().flatMap((t) => {
  const { x, y } = delaunay.getCellCenter(t);
  return delaunay.getNeighbors(t).map((t2) => {
    const { x: x2, y: y2 } = delaunay.getCellCenter(t2);
    return { id: t, x, y, x2, y2 };
  });
});

const canvas = new PixiCanvas().withConfig({
  width: 200,
  height: 200,
  backgroundColor: 0x1099bb,
  resolution: 4,
});
(top as any).c = canvas;
canvas.stage.position.set(100, 100);

function boardContainer(board: BoardGrid<any>) {
  const container = new Container();
  container.label = `Board ${board}`;

  const [graphicses, arrows] = unzip([
    ...board.getAllCells().map((cell) => {
      const graphics = new Graphics();
      graphics.poly(board.getCellBoundary(cell).vertices);
      graphics.stroke("white").fill("grey");
      graphics.strokeStyle.width = 0.2;
      const arrowsContainer = new Container();
      const arrows = board.getNeighbors(cell).map((cellTo) => {
        const { x: x1, y: y1 } = board.getCellCenter(cell);
        const { x: x2, y: y2 } = board.getCellCenter(cellTo);
        const arrow = new Graphics()
          .moveTo(x1, y1)
          .lineTo(x2, y2)
          .stroke({ width: 0.3, color: "blue" });
        return arrow;
      });
      arrowsContainer.addChild(...arrows);
      arrowsContainer.visible = false;
      graphics.eventMode = "dynamic";
      graphics.label = `cell ${cell}`;
      graphics.onmouseover = () => (arrowsContainer.visible = true);
      graphics.onmouseout = () => (arrowsContainer.visible = false);
      return [graphics, arrowsContainer];
    }),
  ]);

  container.addChild(
    new Container({ children: graphicses, label: "Cells" }),
    new Container({ children: arrows, label: "Arrows" })
  );
  return container;
}

function altitudeGraph(layer: BoardLayerReader<number>) {
  const container = new Container({ label: `altitude ${layer}` });
  const { board } = layer;
  const color = scaleSequential(interpolateSpectral);

  const cells = board.getAllCells().map((cell) => {
    const graphics = new Graphics({ label: `Cell ${cell}` })
      .poly(board.getCellBoundary(cell).vertices)
      .fill(color(1 - layer.get(cell)));
    graphics.onclick = () => addFeature(cell);
    graphics.onpointerover = () => (graphics.tint = 0xaaaaaa);
    graphics.onpointerout = () => (graphics.tint = 0xffffff);
    graphics.interactive = true;
    graphics.eventMode = "dynamic";
    return graphics;
  });

  container.addChild(...cells);

  return container;
}

const layerA = boardLayer({
  board: board.delaunayGrid,
  value: 0,
  layerName: "LayerA",
});

let refreshContainer = new Container();
function renderAltitude() {
  refreshContainer.removeChildren();
  refreshContainer.addChild(altitudeGraph(layerA));
}
renderAltitude();

canvas.stage.addChild(refreshContainer);

let sharpness = 0.2;
let type = "island";
function addFeature(start: Cell, height: number = 0.9, radius: number = 0.9) {
  console.log(start);

  let cc = start;
  const queue = [];
  const used = new Set([cc]);
  layerA.set(cc, Math.min(layerA.get(cc) + height, 1.0));
  queue.push(cc);

  for (let i = 0; i < queue.length && height > 0.01; i++) {
    cc = queue[i];
    if (type === "island") {
      height = layerA.get(cc) * radius;
    } else {
      height = height * radius;
    }

    layerA.board.getNeighbors(cc).forEach((e) => {
      cc = e;
      if (!used.has(cc)) {
        let mod = Math.random() * sharpness + 1.1 - sharpness;
        if (sharpness == 0) {
          mod = 1;
        }
        layerA.set(cc, Math.min(Math.max(layerA.get(cc), height * mod), 1.0));
        if (layerA.get(cc) < 0.2) {
          layerA.set(cc, 0);
        }
        queue.push(cc);
        used.add(cc);
      }
    });
  }

  // type = "";

  renderAltitude();
}

render(
  html`
    <h1>Terrain Generation</h1>

    <p>${points.length}</p>
    <div style="width: 100%">${canvas}</div>
  `,
  document.querySelector("#root") as HTMLElement
);
