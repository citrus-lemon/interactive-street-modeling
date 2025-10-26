import { defineConfig } from "@rsbuild/core";
import { pluginGlsl } from "rsbuild-plugin-glsl";

const entry = {
  index: "./src/index",
  ibfv: "./src/IBFV/example",
  streamlines: "./src/streamlines/example",
  TerrainGeneration: "./src/TerrainGeneration/example",
  reactiveVariable: "./src/reactive-variable/example",
};

export default defineConfig({
  html: {
    tags: [
      {
        tag: "link",
        attrs: {
          rel: "stylesheet",
          href: "https://cdn.jsdelivr.net/npm/water.css@2/out/water.css",
        },
        append: true,
      },
    ],
  },
  plugins: [pluginGlsl()],
  source: {
    entry,
    define: {
      __MPA_ENTRIES__: JSON.stringify(
        Object.keys(entry).filter((k) => k !== "index")
      ),
    },
  },
  output: {
    assetPrefix: "/interactive-street-modeling/",
  },
});
