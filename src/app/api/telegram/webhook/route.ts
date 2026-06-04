import { NextRequest, NextResponse } from "next/server";

import { bindTelegramChatFromStartMessage } from "@/entities/notification";
import { getTelegramBotToken, getTelegramWebhookSecret } from "@/shared/api/supabase";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number | string };
    from?: {
      id?: number | string;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
  };
};

async function sendTelegramReply(chatId: string, text: string) {
  const token = getTelegramBotToken();

  if (!token) {
    return;
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  }).catch(() => null);
}

export async function POST(request: NextRequest) {
  const secret = getTelegramWebhookSecret();
  const requestSecret = request.headers.get("x-telegram-bot-api-secret-token");

  if (!secret || requestSecret !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const text = update?.message?.text?.trim();
  const chatId = update?.message?.chat?.id;
  const from = update?.message?.from;

  if (!text || chatId == null || from?.id == null) {
    return NextResponse.json({ ok: true });
  }

  const result = await bindTelegramChatFromStartMessage({
    text,
    telegramChatId: String(chatId),
    telegramUserId: String(from.id),
    telegramUsername: from.username ?? null,
    telegramFirstName: from.first_name ?? null,
    telegramLastName: from.last_name ?? null,
  });

  if (text.startsWith("/start")) {
    if (result.ok) {
      await sendTelegramReply(String(chatId), "Telegram-уведомления Bronly подключены. Новые события будут приходить сюда.");
    } else {
      const message =
        result.reason === "chat_already_linked"
          ? "Этот чат уже привязан к другому профилю Bronly."
          : result.reason === "expired_token"
            ? "Ссылка для привязки устарела. Откройте настройки Bronly и запустите привязку заново."
            : "Не удалось привязать Telegram. Запустите привязку заново из настроек Bronly.";
      await sendTelegramReply(String(chatId), message);
    }
  }

  return NextResponse.json({ ok: true });
}
