import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const localEnvPath = resolve(process.cwd(), ".env.e2e.local");

if (existsSync(localEnvPath)) {
  for (const rawLine of readFileSync(localEnvPath, "utf8").split(/\r?\n/)) {
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

const requiredVariables = [
  "E2E_BASE_URL",
  "E2E_OWNER_EMAIL",
  "E2E_OWNER_PASSWORD",
  "E2E_OWNER_PUBLIC_SLUG",
  "E2E_OWNER_ROOM_ID",
  "E2E_OWNER_PROFILE_QUERY",
  "E2E_TEST_PROPERTY_QUERY",
  "E2E_GUEST_CHECK_IN",
  "E2E_GUEST_CHECK_OUT",
  "E2E_AGENT_EMAIL",
  "E2E_AGENT_PASSWORD",
  "E2E_AGENT_PUBLIC_ID",
  "E2E_ADMIN_EMAIL",
  "E2E_ADMIN_PASSWORD",
  "E2E_SUPABASE_URL",
  "E2E_SUPABASE_SERVICE_ROLE_KEY",
];

const missingVariables = requiredVariables.filter((name) => !process.env[name]?.trim());

if (process.env.E2E_ALLOW_MUTATIONS !== "true") {
  missingVariables.push("E2E_ALLOW_MUTATIONS=true");
}

if (missingVariables.length) {
  console.error(`E2E staging configuration is incomplete: ${missingVariables.join(", ")}`);
  process.exit(1);
}

const baseUrl = new URL(process.env.E2E_BASE_URL);
const supabaseUrl = new URL(process.env.E2E_SUPABASE_URL);

if (baseUrl.hostname === "bronly-opal.vercel.app") {
  console.error("E2E mutations are forbidden against the Bronly production application.");
  process.exit(1);
}

if (supabaseUrl.hostname.startsWith("uevwqievuzakcquselku.")) {
  console.error("E2E mutations are forbidden against the Bronly production Supabase project.");
  process.exit(1);
}

console.log(`E2E staging target verified: ${baseUrl.origin}`);
