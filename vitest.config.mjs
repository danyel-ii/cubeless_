import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "tests/unit/**/*.spec.mjs",
      "tests/component/**/*.spec.mjs",
      "tests/api/**/*.spec.mjs",
    ],
    environment: "jsdom",
    environmentMatchGlobs: [["tests/api/**", "node"]],
    setupFiles: ["tests/setup.mjs"],
  },
});
