"use client";

import { useEffect } from "react";

const VISITOR_KEY = "bronly:collection-viewer-key";

function getVisitorKey() {
  const stored = window.sessionStorage.getItem(VISITOR_KEY);

  if (stored) {
    return stored;
  }

  const created = window.crypto.randomUUID();
  window.sessionStorage.setItem(VISITOR_KEY, created);
  return created;
}

export function CollectionOpenTracker({ slug }: { slug: string }) {
  useEffect(() => {
    void fetch(`/api/collections/${encodeURIComponent(slug)}/open`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visitorKey: getVisitorKey() }),
      cache: "no-store",
      keepalive: true,
    }).catch(() => undefined);
  }, [slug]);

  return null;
}
