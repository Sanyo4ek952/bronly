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

export type SupabasePropertyPhotoRow = {
  id: string;
  property_id: string;
  storage_path: string;
  public_url: string;
  sort_order: number;
  created_at: string;
};

export type SupabaseProfileRow = {
  id: string;
  auth_user_id: string | null;
  slug: string | null;
  agent_public_id: string | null;
  display_name: string;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  is_public_hidden_by_admin: boolean;
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
  property_id: string | null;
  owner_id: string;
  room_kind: "property_room" | "standalone_room";
  slug: string;
  title: string;
  subtitle: string | null;
  property_type: string | null;
  city: string | null;
  address: string | null;
  timezone: string | null;
  short_description: string | null;
  full_description: string | null;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  allow_agent_inquiries: boolean;
  allow_owner_contact_sharing: boolean;
  capacity: number;
  bedrooms: number;
  area: number;
  price_per_night: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SupabaseRoomPhotoRow = {
  id: string;
  room_id: string;
  storage_path: string;
  public_url: string;
  sort_order: number;
  created_at: string;
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

export type SupabaseAgentPropertyLinkRow = {
  id: string;
  property_id: string;
  owner_id: string;
  agent_id: string;
  status: "pending" | "active" | "declined" | "revoked";
  proposal_message: string | null;
  collaboration_terms: string | null;
  owner_contact_visible: boolean;
  proposed_at: string;
  decided_at: string | null;
  created_at: string;
};

export type SupabaseAgentRoomLinkRow = {
  id: string;
  room_id: string;
  owner_id: string;
  agent_id: string;
  status: "pending" | "active" | "declined" | "revoked";
  proposal_message: string | null;
  collaboration_terms: string | null;
  owner_contact_visible: boolean;
  proposed_at: string;
  decided_at: string | null;
  created_at: string;
};

export type SupabaseRoomAgentMarkupRow = {
  id: string;
  room_id: string;
  agent_id: string;
  markup_percent: number;
  created_at: string;
  updated_at: string;
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
  creator_role: "owner" | "agent";
  slug: string;
  title: string;
  guest_label: string | null;
  is_archived: boolean;
  views_count: number;
  first_opened_at: string | null;
  last_opened_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SupabaseCollectionItemRow = {
  id: string;
  collection_id: string;
  property_id: string | null;
  room_id: string | null;
  sort_order: number;
  created_at: string;
};

export type SupabaseGuestRequestRow = {
  id: string;
  source: "owner" | "agent" | "collection";
  property_id: string | null;
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
  rooms_count: number;
  check_in: string;
  check_out: string;
  status: "new" | "accepted_by_owner" | "rejected" | "transferred_to_owner" | "completed";
  transferred_to_owner_at: string | null;
  owner_confirmed_at: string | null;
  completion_requested_at: string | null;
  completed_at: string | null;
  total_price: number | null;
  base_price_per_night: number | null;
  agent_markup_percent: number | null;
  pricing_snapshot: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SupabaseNotificationRow = {
  id: string;
  recipient_id: string;
  channel: string;
  event_type:
    | "new_request"
    | "request_transferred_to_owner"
    | "request_completion_requested"
    | "agent_proposal_received"
    | "agent_proposal_accepted"
    | "agent_proposal_rejected"
    | "subscription_reminder"
    | "subscription_status_changed";
  payload: {
    requestId?: string;
    propertyId?: string;
    propertyTitle?: string;
    roomTitle?: string;
    proposalId?: string;
    subscriptionStatus?: "trial" | "active" | "grace" | "expired" | "manual";
    roleContext?: "owner" | "agent";
    linkPath?: string;
  };
  read_at: string | null;
  created_at: string;
};

export type SupabasePushSubscriptionRow = {
  id: string;
  profile_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  device_label: string | null;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

export type SupabaseNotificationSettingsRow = {
  profile_id: string;
  push_enabled: boolean;
  in_app_enabled: boolean;
  telegram_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type SupabaseTelegramNotificationConnectionRow = {
  profile_id: string;
  telegram_chat_id: string | null;
  telegram_user_id: string | null;
  telegram_username: string | null;
  telegram_first_name: string | null;
  telegram_last_name: string | null;
  link_token_hash: string | null;
  link_token_expires_at: string | null;
  linked_at: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SupabaseNotificationDeliveryRow = {
  id: string;
  notification_id: string;
  recipient_id: string;
  channel: string;
  push_subscription_id: string | null;
  telegram_chat_id: string | null;
  status: string;
  provider_message_id: string | null;
  error_code: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};
