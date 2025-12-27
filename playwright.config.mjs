import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const webServer =
  process.env.PLAYWRIGHT_NO_SERVER === "1"
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      };

export default defineConfig({
  testDir: "./tests",
  testMatch: ["smoke.spec.mjs", "e2e/**/*.spec.mjs"],
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL,
    headless: true,
  },
  webServer,
});
