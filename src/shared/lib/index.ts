export { cn } from "@/shared/lib/cn";
export { toPhoneHref, toTelegramHref, toWhatsAppHref } from "@/shared/lib/contact-links";
export {
  buildAgentCollectionsBreadcrumbs,
  buildOwnerCollectionsBreadcrumbs,
  buildOwnerDashboardBreadcrumbs,
  buildOwnerInventoryBreadcrumbs,
} from "@/shared/lib/dashboard-page-nav";
export type { DashboardBreadcrumbItem } from "@/shared/lib/dashboard-page-nav";
export { formatDateLabel, formatDateTimeLabel } from "@/shared/lib/date";
export { getCheckbox, getInteger, getNumber, getString, splitLines } from "@/shared/lib/form-data";
export { getRussianPluralForm } from "@/shared/lib/pluralize";
export { buildAgentPublicPath, buildCollectionPublicPath, buildOwnerPublicPath } from "@/shared/lib/public-links";
export { buildSearchParams, getSearchString, readFeedbackSearchParams, readSearchParams } from "@/shared/lib/query-params";
export { buildCanonicalUrl, createRobots, createSeoMetadata, getSeoBaseUrl, toJsonLd } from "@/shared/lib/seo";
export { slugify, withFallbackSlug } from "@/shared/lib/slug";
