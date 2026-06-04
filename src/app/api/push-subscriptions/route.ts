import { NextResponse } from "next/server";

import {
  deletePushSubscription,
  getMyPushSubscriptionStatus,
  savePushSubscription,
} from "@/entities/notification";

type PushSubscriptionRequestBody = {
  endpoint?: string;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
  userAgent?: string | null;
  deviceLabel?: string | null;
};

export async function GET() {
  const status = await getMyPushSubscriptionStatus();
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  const body = (await request.json()) as PushSubscriptionRequestBody;
  const result = await savePushSubscription({
    endpoint: body.endpoint ?? "",
    keys: {
      p256dh: body.keys?.p256dh ?? "",
      auth: body.keys?.auth ?? "",
    },
    userAgent: body.userAgent ?? null,
    deviceLabel: body.deviceLabel ?? null,
  });

  if (!result.ok) {
    const status = result.reason === "unauthorized" ? 401 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { endpoint?: string };
  const result = await deletePushSubscription(body.endpoint ?? "");

  if (!result.ok) {
    const status = result.reason === "unauthorized" ? 401 : 400;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
