export type SupabasePropertyRow = {
  id: string;
  owner_id: string;
  slug: string;
  title: string;
  short_title: string;
  property_type: string;
  city: string;
  address: string;
  timezone: string;
  short_description: string | null;
  full_description: string | null;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  published: boolean;
  is_frozen: boolean;
  allow_agent_inquiries: boolean;
  allow_owner_contact_sharing: boolean;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type SupabaseProfileRow = {
  id: string;
  auth_user_id: string | null;
  slug: string | null;
  display_name: string;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  created_at: string;
  updated_at: string;
};

export type SupabaseUserRoleRow = {
  profile_id: string;
  role: "owner" | "agent" | "admin";
  created_at: string;
};

export type SupabaseRoomRow = {
  id: string;
  property_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  capacity: number;
  bedrooms: number;
  area: number;
  price_per_night: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SupabasePropertyFeatureRow = {
  id: string;
  property_id: string;
  label: string;
  sort_order: number;
};

export type SupabasePropertyRuleRow = {
  id: string;
  property_id: string;
  label: string;
  sort_order: number;
};

export type SupabaseRoomAmenityRow = {
  id: string;
  room_id: string;
  label: string;
  sort_order: number;
};

export type SupabaseRoomSeasonalPriceRow = {
  id: string;
  room_id: string;
  starts_on: string;
  ends_on: string;
  price_per_night: number;
  is_active: boolean;
  created_at: string;
};

export type SupabaseRoomBusyRangeRow = {
  id: string;
  room_id: string;
  starts_on: string;
  ends_on: string;
  source: string;
  label: string | null;
  note: string | null;
  created_at: string;
};

export type SupabaseSubscriptionRow = {
  id: string;
  profile_id: string;
  role_context: "owner" | "agent" | "admin";
  status: "trial" | "active" | "grace" | "expired" | "manual";
  plan_name: string;
  active_room_limit: number | null;
  trial_ends_at: string | null;
  grace_ends_at: string | null;
  paid_until: string | null;
  created_at: string;
  updated_at: string;
};

export type SupabaseCollectionRow = {
  id: string;
  creator_id: string;
  role_context: "owner" | "agent";
  slug: string;
  title: string;
  note: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type SupabaseGuestRequestRow = {
  id: string;
  source: "owner" | "agent" | "collection";
  property_id: string;
  room_id: string;
  owner_id: string;
  agent_id: string | null;
  collection_id: string | null;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  guest_comment: string | null;
  adults_count: number;
  children_count: number;
  check_in: string;
  check_out: string;
  status: "new" | "in_progress" | "owner_confirmed" | "declined" | "completed";
  transferred_to_owner_at: string | null;
  owner_confirmed_at: string | null;
  completed_at: string | null;
  total_price: number | null;
  base_price_per_night: number | null;
  agent_markup_percent: number | null;
  pricing_snapshot: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
