import { NextResponse } from "next/server";

import { isCollectionVisitorKey, recordPublicCollectionOpen } from "@/entities/collection";

type CollectionOpenRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function POST(request: Request, { params }: CollectionOpenRouteProps) {
  const { slug } = await params;
  const body = await request.json().catch(() => null) as { visitorKey?: unknown } | null;
  const visitorKey = typeof body?.visitorKey === "string" ? body.visitorKey : "";

  if (!slug || !isCollectionVisitorKey(visitorKey)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await recordPublicCollectionOpen(slug, visitorKey);
  return new NextResponse(null, { status: 204 });
}
