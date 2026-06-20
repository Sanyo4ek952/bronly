const DEFAULT_DEMO_PROPERTY_SLUG = "dom-u-morya";
const CANONICAL_PRODUCTION_HOST = "bronly.app";

export function isBronlyProductionHost(hostname: string) {
  return hostname === CANONICAL_PRODUCTION_HOST || hostname === "www.bronly.app";
}

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

function normalizeAppUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.startsWith("localhost") || trimmed.startsWith("127.0.0.1") || trimmed.startsWith("[::1]")) {
    return `http://${trimmed}`;
  }

  return `https://${trimmed}`;
}

function normalizeCanonicalProductionUrl(value: string) {
  try {
    const url = new URL(value);

    if (isBronlyProductionHost(url.hostname)) {
      url.hostname = CANONICAL_PRODUCTION_HOST;
      return url.toString().replace(/\/+$/, "");
    }
  } catch {
    return value;
  }

  return value;
}

function getVercelAppUrl() {
  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (productionUrl) {
    return normalizeAppUrl(productionUrl);
  }

  const deploymentUrl = process.env.VERCEL_URL;

  if (deploymentUrl) {
    return normalizeAppUrl(deploymentUrl);
  }

  return undefined;
}

export function getCanonicalAppUrl() {
  const value = getAppUrl();
  const normalizedValue = value ? normalizeAppUrl(value) : getVercelAppUrl();

  if (!normalizedValue) {
    return undefined;
  }

  return normalizeCanonicalProductionUrl(normalizedValue);
}

export function requireAppUrl() {
  const value = getCanonicalAppUrl();

  if (!value) {
    throw new Error(
      "Missing app URL configuration. Set NEXT_PUBLIC_APP_URL or provide the Vercel deployment URL for invites, auth redirects, and notifications.",
    );
  }

  return value;
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

export function getTelegramBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

export function getTelegramBotUsername() {
  return process.env.TELEGRAM_BOT_USERNAME;
}

export function getTelegramWebhookSecret() {
  return process.env.TELEGRAM_WEBHOOK_SECRET;
}

export function hasConfiguredWebPush() {
  return Boolean(getVapidPublicKey() && getVapidPrivateKey() && getVapidSubject());
}

export function hasConfiguredTelegramBot() {
  return Boolean(getTelegramBotToken() && getTelegramBotUsername() && getTelegramWebhookSecret());
}

export function hasSupabaseServerEnv() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}
