import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests of the app's own code (zip round trips). They need a browser-like page (DOMParser), so jsdom.
export default defineConfig({
  test: { environment: "jsdom", include: ["test/**/*.test.ts"] },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
