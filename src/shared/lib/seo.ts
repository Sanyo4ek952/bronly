import type { Metadata } from "next";

import { getCanonicalAppUrl } from "@/shared/api/supabase/env";

const DEFAULT_SEO_URL = "https://www.bronly.app";
const DEFAULT_OG_IMAGE_PATH = "/icon";

function isLocalhostUrl(value: string) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function getSeoBaseUrl() {
  const configuredUrl = getCanonicalAppUrl();

  if (!configuredUrl || isLocalhostUrl(configuredUrl)) {
    return new URL(DEFAULT_SEO_URL);
  }

  return new URL(configuredUrl);
}

export function buildCanonicalUrl(path: string) {
  return new URL(path, getSeoBaseUrl()).toString();
}

export function createRobots(index: boolean): NonNullable<Metadata["robots"]> {
  return index
    ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
        },
      }
    : {
        index: false,
        follow: false,
        googleBot: {
          index: false,
          follow: false,
          noimageindex: true,
        },
      };
}

type SeoMetadataOptions = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  imagePath?: string;
  openGraphType?: "website" | "article" | "book" | "profile";
};

export function createSeoMetadata({
  title,
  description,
  path,
  index = true,
  imagePath = DEFAULT_OG_IMAGE_PATH,
  openGraphType = "website",
}: SeoMetadataOptions): Metadata {
  const canonical = buildCanonicalUrl(path);
  const imageUrl = buildCanonicalUrl(imagePath);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: createRobots(index),
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Bronly",
      locale: "ru_RU",
      type: openGraphType,
      images: [
        {
          url: imageUrl,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function toJsonLd(value: Record<string, unknown>) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
