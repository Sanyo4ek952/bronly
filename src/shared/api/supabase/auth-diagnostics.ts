import { headers } from "next/headers";

import { getCanonicalAppUrl } from "@/shared/api/supabase/env";

type AuthDiagnosticLevel = "info" | "warn" | "error";

type AuthDiagnosticDetails = Record<string, string | number | boolean | null | undefined>;

function redactEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const [localPart, domain] = normalized.split("@");

  if (!localPart || !domain) {
    return normalized || "unknown";
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? "*"}***@${domain}`;
  }

  return `${localPart.slice(0, 2)}***@${domain}`;
}

export async function getAuthDiagnosticContext() {
  const headerStore = await headers();

  return {
    appUrl: getCanonicalAppUrl() ?? null,
    host: headerStore.get("host"),
    origin: headerStore.get("origin"),
    forwardedHost: headerStore.get("x-forwarded-host"),
    forwardedProto: headerStore.get("x-forwarded-proto"),
    userAgent: headerStore.get("user-agent"),
  };
}

export function logAuthDiagnostic(level: AuthDiagnosticLevel, event: string, details: AuthDiagnosticDetails) {
  const payload = {
    scope: "auth",
    event,
    ...details,
  };

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.info(payload);
}

export function redactAuthEmail(email: string) {
  return redactEmail(email);
}
