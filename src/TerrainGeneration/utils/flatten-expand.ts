import { Box } from "@flatten-js/core";
import { PlotOptions } from "@observablehq/plot";

export function box(x1: number, y1: number, x2: number, y2: number) {
  return new Box(x1, y1, x2, y2);
}

declare module "@flatten-js/core" {
  interface Box {
    args_plot(): Partial<PlotOptions>;
  }
}

function box_args_plot(this: Box): Partial<PlotOptions> {
  return {
    x: { domain: [this.xmin, this.xmax] },
    y: { domain: [this.ymin, this.ymax] },
    aspectRatio: 1,
  };
}

Box.prototype.args_plot = box_args_plot;
