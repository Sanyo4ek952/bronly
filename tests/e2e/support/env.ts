export type AuthRole = "owner" | "agent" | "admin";

const productionAppHosts = new Set(["bronly-opal.vercel.app"]);
const productionSupabaseProjectRef = "uevwqievuzakcquselku";

function read(name: string) {
  return process.env[name]?.trim() ?? "";
}

export const e2eEnv = {
  baseUrl: read("E2E_BASE_URL") || "http://127.0.0.1:3000",
  owner: {
    email: read("E2E_OWNER_EMAIL"),
    password: read("E2E_OWNER_PASSWORD"),
    publicSlug: read("E2E_OWNER_PUBLIC_SLUG"),
    roomId: read("E2E_OWNER_ROOM_ID"),
    profileQuery: read("E2E_OWNER_PROFILE_QUERY"),
  },
  agent: {
    email: read("E2E_AGENT_EMAIL"),
    password: read("E2E_AGENT_PASSWORD"),
    publicId: read("E2E_AGENT_PUBLIC_ID"),
  },
  admin: {
    email: read("E2E_ADMIN_EMAIL"),
    password: read("E2E_ADMIN_PASSWORD"),
  },
  guest: {
    checkIn: read("E2E_GUEST_CHECK_IN"),
    checkOut: read("E2E_GUEST_CHECK_OUT"),
  },
  testPropertyQuery: read("E2E_TEST_PROPERTY_QUERY"),
  supabaseUrl: read("E2E_SUPABASE_URL"),
  supabaseServiceRoleKey: read("E2E_SUPABASE_SERVICE_ROLE_KEY"),
  allowMutations: read("E2E_ALLOW_MUTATIONS") === "true",
} as const;

export function getRoleCredentials(role: AuthRole) {
  return e2eEnv[role];
}

export function hasRoleCredentials(role: AuthRole) {
  const credentials = getRoleCredentials(role);
  return Boolean(credentials.email && credentials.password);
}

export function hasGuestFixture() {
  return Boolean(
    e2eEnv.owner.publicSlug &&
      e2eEnv.owner.roomId &&
      e2eEnv.guest.checkIn &&
      e2eEnv.guest.checkOut,
  );
}

export function assertSafeMutationTarget() {
  if (!e2eEnv.allowMutations) {
    throw new Error("Set E2E_ALLOW_MUTATIONS=true to run reversible staging mutations.");
  }

  const appHost = new URL(e2eEnv.baseUrl).hostname;

  if (productionAppHosts.has(appHost)) {
    throw new Error(`E2E mutations are forbidden against production host ${appHost}.`);
  }

  if (!e2eEnv.supabaseUrl || !e2eEnv.supabaseServiceRoleKey) {
    throw new Error("E2E_SUPABASE_URL and E2E_SUPABASE_SERVICE_ROLE_KEY are required for cleanup.");
  }

  const supabaseHost = new URL(e2eEnv.supabaseUrl).hostname;

  if (supabaseHost.startsWith(`${productionSupabaseProjectRef}.`)) {
    throw new Error("E2E mutations are forbidden against the production Supabase project.");
  }
}
