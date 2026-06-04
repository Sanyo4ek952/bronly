import { createHash, randomBytes } from "node:crypto";

import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  getCurrentAuthProfile,
  getTelegramBotUsername,
  hasConfiguredTelegramBot,
  type SupabaseNotificationSettingsRow,
  type SupabaseTelegramNotificationConnectionRow,
} from "@/shared/api/supabase";
import { ensureNotificationSettings } from "@/entities/notification/api/notification-settings";

const TELEGRAM_LINK_TTL_MS = 1000 * 60 * 15;

export type TelegramNotificationStatus = {
  isLinked: boolean;
  telegramEnabled: boolean;
  botConfigured: boolean;
  linkedAt: string | null;
  username: string | null;
  chatId: string | null;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getTelegramDeepLink(token: string) {
  const username = getTelegramBotUsername();

  if (!username) {
    return null;
  }

  return `https://t.me/${username}?start=${encodeURIComponent(token)}`;
}

function getSettingsFallback(): TelegramNotificationStatus {
  return {
    isLinked: false,
    telegramEnabled: true,
    botConfigured: hasConfiguredTelegramBot(),
    linkedAt: null,
    username: null,
    chatId: null,
  };
}

export async function getMyTelegramNotificationStatus(): Promise<TelegramNotificationStatus> {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return getSettingsFallback();
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: settingsData }, { data: connectionData }] = await Promise.all([
    supabase.from("notification_settings").select("*").eq("profile_id", profile.id).maybeSingle(),
    supabase.from("telegram_notification_connections").select("*").eq("profile_id", profile.id).maybeSingle(),
  ]);

  const settings = (settingsData as SupabaseNotificationSettingsRow | null) ?? null;
  const connection = (connectionData as SupabaseTelegramNotificationConnectionRow | null) ?? null;

  return {
    isLinked: Boolean(connection?.telegram_chat_id && connection?.linked_at),
    telegramEnabled: settings?.telegram_enabled ?? true,
    botConfigured: hasConfiguredTelegramBot(),
    linkedAt: connection?.linked_at ?? null,
    username: connection?.telegram_username ?? null,
    chatId: connection?.telegram_chat_id ?? null,
  };
}

export async function createTelegramLinkSession() {
  const profile = await getCurrentAuthProfile();

  if (!profile) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  if (!hasConfiguredTelegramBot()) {
    return { ok: false as const, reason: "not_configured" as const };
  }

  await ensureNotificationSettings(profile.id);

  const token = randomBytes(24).toString("base64url");
  const admin = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const expiresAtIso = new Date(Date.now() + TELEGRAM_LINK_TTL_MS).toISOString();

  const { error } = await admin.from("telegram_notification_connections").upsert(
    {
      profile_id: profile.id,
      link_token_hash: hashToken(token),
      link_token_expires_at: expiresAtIso,
      updated_at: nowIso,
    },
    { onConflict: "profile_id" },
  );

  if (error) {
    return { ok: false as const, reason: "save_failed" as const };
  }

  return {
    ok: true as const,
    url: getTelegramDeepLink(token),
  };
}

function normalizeStartToken(text: string) {
  const match = text.match(/^\/start(?:@\w+)?\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

export async function bindTelegramChatFromStartMessage(input: {
  text: string;
  telegramChatId: string;
  telegramUserId: string;
  telegramUsername?: string | null;
  telegramFirstName?: string | null;
  telegramLastName?: string | null;
}) {
  const token = normalizeStartToken(input.text);

  if (!token) {
    return { ok: false as const, reason: "missing_token" as const };
  }

  const admin = createSupabaseAdminClient();
  const tokenHash = hashToken(token);
  const now = new Date();
  const { data: connectionData } = await admin
    .from("telegram_notification_connections")
    .select("*")
    .eq("link_token_hash", tokenHash)
    .maybeSingle();

  const connection = (connectionData as SupabaseTelegramNotificationConnectionRow | null) ?? null;

  if (!connection?.profile_id || !connection.link_token_expires_at) {
    return { ok: false as const, reason: "invalid_token" as const };
  }

  if (new Date(connection.link_token_expires_at).getTime() < now.getTime()) {
    return { ok: false as const, reason: "expired_token" as const };
  }

  const { data: existingChatBinding } = await admin
    .from("telegram_notification_connections")
    .select("profile_id")
    .eq("telegram_chat_id", input.telegramChatId)
    .maybeSingle();

  if (existingChatBinding && existingChatBinding.profile_id !== connection.profile_id) {
    return { ok: false as const, reason: "chat_already_linked" as const };
  }

  const updatedAt = now.toISOString();
  const { error } = await admin.from("telegram_notification_connections").upsert(
    {
      profile_id: connection.profile_id,
      telegram_chat_id: input.telegramChatId,
      telegram_user_id: input.telegramUserId,
      telegram_username: input.telegramUsername ?? null,
      telegram_first_name: input.telegramFirstName ?? null,
      telegram_last_name: input.telegramLastName ?? null,
      link_token_hash: null,
      link_token_expires_at: null,
      linked_at: updatedAt,
      last_seen_at: updatedAt,
      updated_at: updatedAt,
    },
    { onConflict: "profile_id" },
  );

  if (error) {
    return { ok: false as const, reason: "save_failed" as const };
  }

  return { ok: true as const };
}
