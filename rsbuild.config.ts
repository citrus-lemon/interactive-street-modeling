import { defineConfig } from "@rsbuild/core";
import { pluginGlsl } from "rsbuild-plugin-glsl";

const entry = {
  index: "./src/index",
  ibfv: "./src/IBFV/example",
  streamlines: "./src/streamlines/example",
  TerrainGeneration: "./src/TerrainGeneration/example",
};

export default defineConfig({
  plugins: [pluginGlsl()],
  source: {
    entry,
    define: {
      __MPA_ENTRIES__: JSON.stringify(
        Object.keys(entry).filter((k) => k !== "index")
      ),
    },
  },
});
