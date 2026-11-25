import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    hookTimeout: 180000,
    globalSetup: ["./tests/globalSetup.js"],
    setupFiles: ["./tests/setup.js"],
  },
});
