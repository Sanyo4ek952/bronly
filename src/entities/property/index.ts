export {
  getOwnerCalendarInventory,
  getOwnerDashboardSummary,
  getOwnerInventory,
  getOwnerProperties,
  getOwnerPropertyDetail,
  getOwnerPropertySectionBySlug,
  getPublicPropertyPageData,
  resolveOwnerPublicSlug,
} from "@/entities/property/api/property-data";
export { dashboardStats } from "@/entities/property/model/dashboard";
export { property } from "@/entities/property/model/mock";
export { aggregateRoomAmenities, resolvePublicPropertyDetailMode } from "@/entities/property/model/public-property";
export type {
  OwnerCalendarInventoryGroup,
  OwnerCalendarInventoryRoom,
  OwnerDashboardSummary,
  OwnerPropertyDetail,
  OwnerInventoryListItem,
  OwnerPropertyListItem,
  OwnerStandaloneRoomListItem,
  OwnerPublicProfile,
  PropertyPhoto,
  PublicPropertyPageData,
  PublicPropertySection,
  PublicPropertySummary,
} from "@/entities/property/model/types";
export type { PublicPropertyDetailMode } from "@/entities/property/model/public-property";
