import { initDevtools } from "@pixi/devtools";
import { html, render } from "lit";
import { Application, ApplicationOptions } from "pixi.js";

export class PixiCanvas extends Application {
  private fragment = new DocumentFragment();

  constructor() {
    super();
    initDevtools({ app: this });
    render(html`<p>PIXI Canvas Loading</p>`, this.fragment);
  }

  withConfig(options?: Partial<ApplicationOptions>): this {
    console.log(options);
    this.init(options).then(() => {
      this.canvas.style = "width: 100%";
      render(html`${this.canvas}`, this.fragment);
    });
    return this;
  }

  *[Symbol.iterator]() {
    yield this.fragment;
  }
}
