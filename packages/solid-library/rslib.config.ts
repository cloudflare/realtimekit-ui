import { pluginBabel } from "@rsbuild/plugin-babel";
import { pluginSolid } from "@rsbuild/plugin-solid";
import { defineConfig } from "@rslib/core";

export default defineConfig({
  source: {
    entry: {
      index: ["./src/index.ts"],
    },
  },
  tools: {
    rspack: {
      plugins: [],
    },
  },
  lib: [
    {
      bundle: true,
      dts: true,
      format: "esm",
    },
  ],
  output: {
    target: "web",
  },
  plugins: [
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
    }),
    pluginSolid(),
  ],
});
