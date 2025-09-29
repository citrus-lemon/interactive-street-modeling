import { html, render } from "lit-html";
import { LitElement } from "lit";
import { customElement, query } from "lit/decorators.js";
import { property } from "lit/decorators.js";
import { computeStreamlines } from "./Streamlines";
import Vector from "./Vector";
import * as Plot from "@observablehq/plot";
import PoissonDiskSampling from "poisson-disk-sampling";

render(
  html`<streamlines-element></streamlines-element>`,
  document.querySelector("#root") as HTMLElement
);

interface StreamlinePoint {
  x: number;
  y: number;
}

interface Streamline {
  points: StreamlinePoint[];
  seedPoint: StreamlinePoint;
}

interface AnimationState {
  line: number;
  grow: number;
  seed: number;
  finish?: boolean;
}

@customElement("streamlines-element")
export class StreamlinesElement extends LitElement {
  @property({ type: Number })
  accessor seedX: number = 0.5;

  @property({ type: Number })
  accessor seedY: number = 0.5;

  @property({ type: Number })
  accessor dSep: number = 0.1;

  @property({ type: Number })
  accessor dTest: number = 0.05;

  @property({ type: Number })
  accessor timeStep: number = 0.01;

  @property({ type: String })
  accessor seedDirection: "center" | "flow" = "flow";

  @property({ type: String })
  accessor seedStreamlinePolicy: "bfs" | "dfs" = "bfs";

  @property({ type: Boolean })
  accessor fixVectorField: boolean = false;

  @property({ type: Boolean })
  accessor switchingFields: boolean = false;

  @property({ type: Number })
  accessor randomSeed: number = 42;

  private canvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;
  private streamlines: Streamline[] = [];
  private animationState: AnimationState = { line: 0, grow: 0, seed: 0 };
  private animationId?: number;
  private isAnimating: boolean = false;

  @query("#streamlinesCanvas")
  private accessor canvasElement: HTMLCanvasElement | null = null;

  render() {
    return html`
      <div style="width: 800px; height: 800px; font-family: Arial, sans-serif;">
        <div style="margin-bottom: 20px;">
          <h1 style="margin: 0 0 10px 0; color: #333;">
            Evenly-Spaced Streamlines
          </h1>
          <div style="font-size: 14px; color: #666; margin-bottom: 15px;">
            <p style="margin: 0 0 5px 0;">
              <strong>Paper:</strong>
              <a
                href="https://web.cs.ucdavis.edu/~ma/SIGGRAPH02/course23/notes/papers/Jobard.pdf"
                target="_blank"
                style="color: #0066cc;"
              >
                Creating Evenly-Spaced Streamlines of Arbitrary Density
              </a>
            </p>
            <p style="margin: 0 0 5px 0;">
              <strong>Matlab example:</strong>
              <a
                href="https://www.allnans.com/evenly_spaced_streamlines/even_stream_demo.html"
                target="_blank"
                style="color: #0066cc;"
              >
                Demo
              </a>
              -
              <a
                href="https://github.com/keithfma/evenly_spaced_streamlines"
                target="_blank"
                style="color: #0066cc;"
              >
                Code
              </a>
            </p>
            <p style="margin: 0;">
              <strong>Implementation:</strong>
              <a
                href="https://github.com/anvaka/streamlines"
                target="_blank"
                style="color: #0066cc;"
              >
                anvaka/streamlines
              </a>
            </p>
          </div>
        </div>

        <div
          style="margin-bottom: 10px; display: flex; flex-wrap: wrap; gap: 10px;"
        >
          <label style="display: flex; align-items: center; gap: 5px;">
            Seed X:
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              .value=${String(this.seedX)}
              @input=${(e: Event) => {
                this.seedX = Number((e.target as HTMLInputElement).value);
              }}
              style="width: 100px;"
            />
            <span>${this.seedX.toFixed(2)}</span>
          </label>

          <label style="display: flex; align-items: center; gap: 5px;">
            Seed Y:
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              .value=${String(this.seedY)}
              @input=${(e: Event) => {
                this.seedY = Number((e.target as HTMLInputElement).value);
              }}
              style="width: 100px;"
            />
            <span>${this.seedY.toFixed(2)}</span>
          </label>

          <label style="display: flex; align-items: center; gap: 5px;">
            Separation Distance:
            <input
              type="range"
              min="0.01"
              max="0.3"
              step="0.01"
              .value=${String(this.dSep)}
              @input=${(e: Event) => {
                this.dSep = Number((e.target as HTMLInputElement).value);
              }}
              style="width: 100px;"
            />
            <span>${this.dSep.toFixed(2)}</span>
          </label>

          <label style="display: flex; align-items: center; gap: 5px;">
            Test Distance:
            <input
              type="range"
              min="0.01"
              max="0.2"
              step="0.005"
              .value=${String(this.dTest)}
              @input=${(e: Event) => {
                this.dTest = Number((e.target as HTMLInputElement).value);
              }}
              style="width: 100px;"
            />
            <span>${this.dTest.toFixed(3)}</span>
          </label>

          <label style="display: flex; align-items: center; gap: 5px;">
            Time Step:
            <input
              type="range"
              min="0.001"
              max="0.05"
              step="0.001"
              .value=${String(this.timeStep)}
              @input=${(e: Event) => {
                this.timeStep = Number((e.target as HTMLInputElement).value);
              }}
              style="width: 100px;"
            />
            <span>${this.timeStep.toFixed(3)}</span>
          </label>

          <label style="display: flex; align-items: center; gap: 5px;">
            Seeding Direction:
            <select
              .value=${this.seedDirection}
              @change=${(e: Event) => {
                this.seedDirection = (e.target as HTMLSelectElement).value as
                  | "center"
                  | "flow";
              }}
            >
              <option value="flow">Flow</option>
              <option value="center">Center</option>
            </select>
          </label>

          <label style="display: flex; align-items: center; gap: 5px;">
            Streamline Order:
            <select
              .value=${this.seedStreamlinePolicy}
              @change=${(e: Event) => {
                this.seedStreamlinePolicy = (e.target as HTMLSelectElement)
                  .value as "bfs" | "dfs";
              }}
            >
              <option value="bfs">BFS</option>
              <option value="dfs">DFS</option>
            </select>
          </label>

          <label style="display: flex; align-items: center; gap: 5px;">
            <input
              type="checkbox"
              .checked=${this.fixVectorField}
              @change=${(e: Event) => {
                this.fixVectorField = (e.target as HTMLInputElement).checked;
              }}
            />
            Fix Vector Field
          </label>

          <label style="display: flex; align-items: center; gap: 5px;">
            <input
              type="checkbox"
              .checked=${this.switchingFields}
              @change=${(e: Event) => {
                this.switchingFields = (e.target as HTMLInputElement).checked;
              }}
            />
            Switching Fields
          </label>

          <label style="display: flex; align-items: center; gap: 5px;">
            Random Seed:
            <input
              type="number"
              .value=${String(this.randomSeed)}
              @input=${(e: Event) => {
                this.randomSeed = Number((e.target as HTMLInputElement).value);
              }}
              style="width: 80px;"
            />
          </label>
        </div>

        <div style="margin-bottom: 10px;">
          <button
            @click=${this.generateStreamlines}
            style="margin-right: 10px;"
          >
            Generate Streamlines
          </button>
          <button @click=${this.toggleAnimation} style="margin-right: 10px;">
            ${this.isAnimating ? "Stop" : "Start"} Animation
          </button>
          <button @click=${this.resetAnimation}>Reset Animation</button>
        </div>

        <canvas
          id="streamlinesCanvas"
          width="600"
          height="600"
          style="border: 1px solid #ccc; display: block;"
        ></canvas>
        ${this.plot()}
      </div>
    `;
  }

  plot() {
    return Plot.plot({
      inset: 6,
      width: Math.min(this.canvasElement?.width ?? 600, 600),
      aspectRatio: 1,
      // axis: null,
      marks: [
        // PlotSampler(sampler, {
        //   stroke: "#eee",
        //   shape: "sword" as Plot.VectorShapeName,
        // }),
        Plot.dot(
          lines.slice(0, state.line + 1).map((line) => line.seedPoint),
          { x: "x", y: "y" }
        ),
        Plot.text(
          lines.slice(0, state.line + 1).map((line) => line.seedPoint),
          { x: "x", y: "y", dy: -8 }
        ),
        // PlotSampler(rotate(sampler), { stroke: "#eee" }),
        // Plot.line(trace(sampler, [0, 0.5], { scale: 0.01 }), { curve: "natural" }),
        Plot.line(
          lines
            .slice(0, state.line)
            .flatMap((line, index) =>
              line.map((point) => ({ index, ...point }))
            ),
          {
            x: "x",
            y: "y",
            z: "index",
            curve: "natural",
          }
        ),
        state.finish
          ? undefined
          : Plot.line(
              lines[state.line].slice(
                ...(state.grow > lines[state.line].length - state.seed
                  ? [lines[state.line].length - state.grow]
                  : [state.seed, state.seed + state.grow])
              ),
              {
                x: "x",
                y: "y",
                curve: "natural",
                strokeWidth: 3,
              }
            ),
        Plot.tip(
          lines.slice(0, state.line + 1).map((line) => line.seedPoint),
          Plot.pointer({ x: "x", y: "y", title: (a, i) => `${i}` })
        ),
        Plot.arrow(
          lines.slice(1, state.line + 1),
          Plot.pointer({
            x1: (a) => a.seedPoint.originPoint.x,
            y1: (a) => a.seedPoint.originPoint.y,
            x2: (a) => a.seedPoint.x,
            y2: (a) => a.seedPoint.y,
            stroke: "#aaa",
          })
        ),
      ],
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "streamlines-element": StreamlinesElement;
  }
}

type Sampler = (x: number, y: number) => [number, number];
function PlotSampler(sampler: Sampler, options?: Plot.VectorOptions) {
  const swordShape = {
    draw(context: CanvasRenderingContext2D, l: number, _r: number) {
      context.moveTo(0, 0);
      context.lineTo(0, -l);
      context.moveTo(-l / 4, -l / 2);
      context.lineTo(+l / 4, -l / 2);
    },
  };
  function getLength(x: number, y: number) {
    const [dx, dy] = sampler(x, y);
    return Math.sqrt(dx * dx + dy * dy);
  }
  function getRotate(x: number, y: number) {
    const [dx, dy] = sampler(x, y);
    return (Math.atan2(dx, dy) / Math.PI) * 180;
  }
  if ((options?.shape as string) === "sword") {
    options!.shape = swordShape;
  }
  return Plot.vector(poisson([0, 0, 1, 1], { n: 1000 }), {
    length: ([x, y]) => getLength(x, y),
    rotate: ([x, y]) => getRotate(x, y),
    ...options,
  });
}

// Utility function: Poisson disk sampling using PoissonDiskSampling
type PoissonOptions = { n?: number };
function poisson(
  bounds: [number, number, number, number],
  { n = 1000 }: PoissonOptions = {}
): [number, number][] {
  const [x0, y0, x1, y1] = bounds;
  const width = x1 - x0;
  const height = y1 - y0;
  // Estimate minDistance to get about n points
  const area = width * height;
  const minDistance = Math.sqrt(area / n / Math.PI) * 2;
  const pds = new PoissonDiskSampling({
    shape: [width, height],
    minDistance,
    tries: 30,
  });
  const points = pds.fill();
  // Shift points to [x0, y0] origin
  return points.map(([x, y]) => [x + x0, y + y0]);
}
