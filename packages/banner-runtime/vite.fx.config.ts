import { defineConfig } from "vite";

// The 3D effects (cube and ring) are a separate script (dist/fx.js): only banners that use one carry it.
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: "src/fx.ts",
      formats: ["iife"],
      name: "OlFx",
      fileName: () => "fx.js",
    },
    target: "es2019",
    minify: true,
  },
});
