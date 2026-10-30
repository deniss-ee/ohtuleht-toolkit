import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Relative base so the contents of dist/ work from any folder on a static host.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  // The picture optimiser (jSquash, WebAssembly) breaks in Vite's dependency optimiser.
  optimizeDeps: { exclude: ["@jsquash/jpeg", "@jsquash/oxipng", "@jsquash/resize"] },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
