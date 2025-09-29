import { Application } from "pixi.js";
import { VectorFieldBuffer } from "./VectorField";
import IBFV from "./ibfv";

import { html, render } from "lit-html";
import { LitElement } from "lit";
import { customElement, query } from "lit/decorators.js";
import { property } from "lit/decorators.js";

render(
  html`<ibfv-element></ibfv-element>`,
  document.querySelector("#root") as HTMLElement
);

@customElement("ibfv-element")
export class IBFVElement extends LitElement {
  @property({ type: Number })
  accessor maximumFlow: number = 0.005;

  @property({ type: Number })
  accessor noiseResolution: number = 200;

  private app?: Application;
  private ibfv?: IBFV;

  @query("#glCanvas")
  private accessor canvas: HTMLCanvasElement | null = null;

  render() {
    return html`
      <div style="width: 800px; height: 800px;">
        <div style="margin-bottom: 10px;">
          <label>
            Maximum Flow:
            <input
              type="range"
              min="0.001"
              max="0.05"
              step="0.001"
              .value=${String(this.maximumFlow)}
              @input=${(e: Event) => {
                const target = e.target as HTMLInputElement;
                this.maximumFlow = Number(target.value);
              }}
              style="width: 300px;"
            />
            <span>${this.maximumFlow}</span>
          </label>
          <br />
          <label>
            Noise Resolution:
            <input
              type="range"
              min="32"
              max="512"
              step="1"
              .value=${String(this.noiseResolution)}
              @input=${(e: Event) => {
                const target = e.target as HTMLInputElement;
                this.noiseResolution = Number(target.value);
              }}
              style="width: 300px;"
            />
            <span>${this.noiseResolution}</span>
          </label>
        </div>
        <canvas
          id="glCanvas"
          width="500"
          height="500"
          style="width: 100%; height: 100%;"
        ></canvas>
      </div>
    `;
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    if (this.ibfv) {
      if (changedProperties.has("maximumFlow")) {
        this.ibfv.maximumFlow = this.maximumFlow;
      }
      if (changedProperties.has("noiseResolution")) {
        this.ibfv.noiseResolution = this.noiseResolution;
      }
    }
  }

  async firstUpdated() {
    if (!this.canvas) return;
    let canvas = this.canvas;

    this.app = new Application();
    await this.app.init({
      canvas,
      width: canvas.width,
      height: canvas.height,
      backgroundColor: 0x000000,
      resolution: window.devicePixelRatio || 1,
      multiView: true,
    });

    const vt = vectorFieldTexture();

    this.ibfv = new IBFV(vt);
    this.ibfv.setSize(500, 500);
    console.log(this.maximumFlow, this.noiseResolution);
    this.ibfv.maximumFlow = this.maximumFlow;
    this.ibfv.noiseResolution = this.noiseResolution;

    this.app.stage.addChild(this.ibfv);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ibfv-element": IBFVElement;
  }
}

function vectorFieldTexture() {
  // Create the vector field data (Float32Array example)
  const vectorFieldSize = 1000; // Higher resolution for more detailed vector field
  const vectorFieldData = new Float32Array(
    vectorFieldSize * vectorFieldSize * 2
  ) as VectorFieldBuffer; // RGBA format

  vectorFieldData.width = vectorFieldSize;
  vectorFieldData.height = vectorFieldSize;

  // Populate the vector field with example data
  for (let y = 0; y < vectorFieldSize; y++) {
    for (let x = 0; x < vectorFieldSize; x++) {
      const index = (y * vectorFieldSize + x) * 2;

      // Example vector field: circular pattern
      const normalizedX = x / vectorFieldSize - 0.5;
      const normalizedY = y / vectorFieldSize - 0.5;
      const distance = Math.sqrt(
        normalizedX * normalizedX + normalizedY * normalizedY
      );

      const times = 0.1;

      // Create a complex swirl pattern
      vectorFieldData[index] =
        (-normalizedY * 0.2 + Math.cos(distance * 20) * 0.05) * times; // X component
      vectorFieldData[index + 1] =
        (normalizedX * 0.2 + Math.cos(distance * 20) * 0.05) * times; // Y component
    }
  }
  return vectorFieldData;
}
