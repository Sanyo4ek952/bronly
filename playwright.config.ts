import { defineConfig, devices } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadLocalE2EEnv() {
  const envPath = resolve(process.cwd(), ".env.e2e.local");

  if (!existsSync(envPath)) {
    return;
  }

  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");

    if (separator < 1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, "$2");

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadLocalE2EEnv();

const baseURL = process.env.E2E_BASE_URL?.trim() || "http://127.0.0.1:3000";
const target = new URL(baseURL);
const isLocalTarget = target.hostname === "127.0.0.1" || target.hostname === "localhost";
const localPort = target.port || "3000";
const shouldStartLocalServer = isLocalTarget && process.env.E2E_SKIP_WEB_SERVER !== "true";

const localServerEnv = {
  ...process.env,
  ...(process.env.E2E_SUPABASE_URL
    ? { NEXT_PUBLIC_SUPABASE_URL: process.env.E2E_SUPABASE_URL }
    : {}),
  ...(process.env.E2E_SUPABASE_ANON_KEY
    ? { NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.E2E_SUPABASE_ANON_KEY }
    : {}),
  ...(process.env.E2E_SUPABASE_SERVICE_ROLE_KEY
    ? { SUPABASE_SERVICE_ROLE_KEY: process.env.E2E_SUPABASE_SERVICE_ROLE_KEY }
    : {}),
  NEXT_PUBLIC_APP_URL: baseURL,
};

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results/playwright",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["line"], ["html", { outputFolder: "playwright-report", open: "never" }]]
    : [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "ru-RU",
    timezoneId: "Europe/Moscow",
  },
  expect: {
    timeout: 10_000,
  },
  timeout: 45_000,
  webServer: shouldStartLocalServer
    ? {
        command: `npm run dev -- --hostname 127.0.0.1 --port ${localPort}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: localServerEnv,
      }
    : undefined,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
