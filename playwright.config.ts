import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }]],
  webServer: {
    command: "npx next start -p 3100",
    port: 3100,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
