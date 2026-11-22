import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command:
        "pnpm --filter @lsui/playground run build && pnpm --filter @lsui/playground exec astro preview --port 4322 --ignore-lock",
      url: "http://localhost:4322",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command:
        "pnpm --filter @lsui/docs run build && pnpm --filter @lsui/docs exec astro preview --port 4321 --ignore-lock",
      url: "http://localhost:4321",
      reuseExistingServer: !process.env.CI,
      timeout: 90_000,
    },
  ],
});
