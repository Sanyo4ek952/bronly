export { cn } from "@/shared/lib/cn";
export {
  buildAgentCollectionsBreadcrumbs,
  buildOwnerCollectionsBreadcrumbs,
  buildOwnerDashboardBreadcrumbs,
  buildOwnerInventoryBreadcrumbs,
} from "@/shared/lib/dashboard-page-nav";
export type { DashboardBreadcrumbItem } from "@/shared/lib/dashboard-page-nav";
export { formatDateLabel, formatDateTimeLabel } from "@/shared/lib/date";
export { getCheckbox, getInteger, getNumber, getString, splitLines } from "@/shared/lib/form-data";
export { buildAgentPublicPath, buildCollectionPublicPath, buildOwnerPublicPath } from "@/shared/lib/public-links";
export { buildCanonicalUrl, createRobots, createSeoMetadata, getSeoBaseUrl, toJsonLd } from "@/shared/lib/seo";
export { slugify, withFallbackSlug } from "@/shared/lib/slug";
