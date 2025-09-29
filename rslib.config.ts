import { defineConfig } from "@rslib/core";

export default defineConfig({
  lib: [
    { format: "esm", dts: true, bundle: true, outBase: "dist/esm" },
    { format: "cjs", dts: false, bundle: true, outBase: "dist/cjs" },
  ],
  source: {
    entry: {
      ibfv: "./src/IBFV/ibfv.ts",
    },
  },
});
