import { defineConfig } from "vite";

// The cube transition is a separate script (dist/cube.js): only banners that use it carry it.
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: "src/cube.ts",
      formats: ["iife"],
      name: "OlCube",
      fileName: () => "cube.js",
    },
    target: "es2019",
    minify: true,
  },
});
