const DEFAULT_DEMO_PROPERTY_SLUG = "dom-u-morya";

export function getSupabaseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabaseAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function getDemoPropertySlug() {
  return process.env.BRONLY_DEMO_PROPERTY_SLUG ?? DEFAULT_DEMO_PROPERTY_SLUG;
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL;
}

export function hasSupabaseServerEnv() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}
