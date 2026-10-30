import { defineConfig } from "vite";

// One self-contained script for banners: dist/runtime.js
export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["iife"],
      name: "OlRuntime",
      fileName: () => "runtime.js",
    },
    target: "es2019",
    minify: true,
  },
});
