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

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
}

export function getVapidPrivateKey() {
  return process.env.VAPID_PRIVATE_KEY;
}

export function getVapidSubject() {
  return process.env.VAPID_SUBJECT;
}

export function hasConfiguredWebPush() {
  return Boolean(getVapidPublicKey() && getVapidPrivateKey() && getVapidSubject());
}

export function hasSupabaseServerEnv() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}
