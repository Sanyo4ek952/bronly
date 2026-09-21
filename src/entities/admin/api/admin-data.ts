import { cache } from "react";

import { getPendingReferralQueue } from "@/entities/referral";
import { getSubscriptionRuntimeState } from "@/entities/subscription";
import type {
  AdminDashboardData,
  AdminOverviewData,
  AdminSubscriptionDetailData,
  AdminPropertiesPageData,
  AdminPropertyItem,
  AdminReviewsPageData,
  AdminSubscriptionItem,
  AdminUsersPageData,
  AdminUserItem,
  AdminSubscriptionsPageData,
} from "@/entities/admin/model/types";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase";
import type { Database } from "@/shared/api/supabase/database.types";
import { logServerConfigurationError, logServerDataError } from "@/shared/api/supabase/server-diagnostics";
import { buildAgentPublicPath, buildOwnerPublicPath } from "@/shared/lib";
import type {
  SupabaseCollectionRow,
  SupabaseGuestRequestRow,
  SupabaseProfileRow,
  SupabasePaymentRow,
  SupabasePropertyRow,
  SupabaseRoomRow,
  SupabaseSubscriptionRow,
  SupabaseUserRoleRow,
} from "@/shared/api/supabase";

function isExpiringSoon(value: string | null) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);
  return date >= now && date <= nextWeek;
}

type AdminRecords = {
  profiles: SupabaseProfileRow[];
  roles: SupabaseUserRoleRow[];
  properties: SupabasePropertyRow[];
  rooms: SupabaseRoomRow[];
  subscriptions: SupabaseSubscriptionRow[];
  payments: SupabasePaymentRow[];
  guestRequests: SupabaseGuestRequestRow[];
  collections: SupabaseCollectionRow[];
  pendingReferralRewards: Awaited<ReturnType<typeof getPendingReferralQueue>>;
};

type AdminSnapshot = {
  dashboardData: AdminDashboardData;
  overviewData: AdminOverviewData;
  usersPageData: AdminUsersPageData;
  subscriptionsPageData: AdminSubscriptionsPageData;
  propertiesPageData: AdminPropertiesPageData;
  reviewsPageData: AdminReviewsPageData;
};

type DatabaseCollectionRow = Database["public"]["Tables"]["collections"]["Row"];

function isAdminCollectionRow(row: DatabaseCollectionRow): row is SupabaseCollectionRow {
  return row.creator_role === "owner" || row.creator_role === "agent";
}

async function getAdminRecords(): Promise<AdminRecords> {
  const admin = createSupabaseAdminClient();
  const results = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: true }),
    admin.from("user_roles").select("*"),
    admin.from("properties").select("*").order("created_at", { ascending: false }),
    admin.from("rooms").select("*"),
    admin.from("subscriptions").select("*").order("updated_at", { ascending: false }),
    admin.from("payments").select("*").order("paid_at", { ascending: false }),
    admin.from("guest_requests").select("*").order("created_at", { ascending: false }),
    admin.from("collections").select("*"),
    getPendingReferralQueue(),
  ] as const);
  const [profileResult, roleResult, propertyResult, roomResult, subscriptionResult, paymentResult, guestRequestResult, collectionResult] = results;

  for (const result of results.slice(0, 8)) {
    if ("error" in result && result.error) {
      throw result.error;
    }
  }

  const pendingReferralRewards = results[8];
  const collections = collectionResult.data ?? [];

  if (!collections.every(isAdminCollectionRow)) {
    throw new Error("Admin collection data contains an unsupported creator role.");
  }

  return {
    profiles: profileResult.data ?? [],
    roles: roleResult.data ?? [],
    properties: propertyResult.data ?? [],
    rooms: roomResult.data ?? [],
    subscriptions: subscriptionResult.data ?? [],
    payments: (paymentResult.data ?? []) as SupabasePaymentRow[],
    guestRequests: guestRequestResult.data ?? [],
    collections,
    pendingReferralRewards,
  };
}

const getAdminSnapshot = cache(async (): Promise<AdminSnapshot> => {
  if (!canUseSupabase()) {
    logServerConfigurationError("admin_dashboard_supabase_not_configured");
    throw new Error("Admin data source is unavailable.");
  }

  let records: AdminRecords;

  try {
    records = await getAdminRecords();
  } catch (error) {
    logServerDataError("admin_dashboard_load_failed", error);
    throw new Error("Admin data source is unavailable.");
  }
  const rolesByProfile = new Map<string, string[]>();

  for (const role of records.roles) {
    const current = rolesByProfile.get(role.profile_id) ?? [];
    if (!current.includes(role.role)) {
      current.push(role.role);
    }
    rolesByProfile.set(role.profile_id, current);
  }

  const ownerProfiles = records.profiles.filter((profile) => (rolesByProfile.get(profile.id) ?? []).includes("owner"));
  const agentProfiles = records.profiles.filter((profile) => (rolesByProfile.get(profile.id) ?? []).includes("agent"));
  const dualRoleCount = records.profiles.filter((profile) => {
    const roles = rolesByProfile.get(profile.id) ?? [];
    return roles.includes("owner") && roles.includes("agent");
  }).length;

  const propertiesByOwner = new Map<string, SupabasePropertyRow[]>();
  for (const property of records.properties) {
    const current = propertiesByOwner.get(property.owner_id) ?? [];
    current.push(property);
    propertiesByOwner.set(property.owner_id, current);
  }

  const roomStatsByProperty = new Map<string, { totalRoomCount: number; activeRoomCount: number }>();
  for (const room of records.rooms) {
    if (!room.property_id) {
      continue;
    }

    const current = roomStatsByProperty.get(room.property_id) ?? { totalRoomCount: 0, activeRoomCount: 0 };
    current.totalRoomCount += 1;
    if (room.is_active) {
      current.activeRoomCount += 1;
    }
    roomStatsByProperty.set(room.property_id, current);
  }

  const requestIdsByProfile = new Map<string, Set<string>>();
  for (const request of records.guestRequests) {
    const relatedProfiles = [request.owner_id, request.agent_id].filter((value): value is string => Boolean(value));
    for (const profileId of relatedProfiles) {
      const current = requestIdsByProfile.get(profileId) ?? new Set<string>();
      current.add(request.id);
      requestIdsByProfile.set(profileId, current);
    }
  }

  const ownerRuntimeStates = await Promise.all(
    ownerProfiles.map((profile) => getSubscriptionRuntimeState(profile.id, "owner")),
  );
  const ownerStateByProfile = new Map(ownerRuntimeStates.map((item) => [item.profileId, item]));

  const users: AdminUserItem[] = records.profiles.map((profile) => {
    const roles = rolesByProfile.get(profile.id) ?? [];
    const publicPageUrls: string[] = [];

    if (roles.includes("owner")) {
      const ownerPublicPath = buildOwnerPublicPath(profile.slug);
      if (ownerPublicPath) {
        publicPageUrls.push(ownerPublicPath);
      }
    }

    if (roles.includes("agent")) {
      const agentPublicPath = buildAgentPublicPath(profile.agent_public_id);
      if (agentPublicPath) {
        publicPageUrls.push(agentPublicPath);
      }
    }

    return {
      profileId: profile.id,
      displayName: profile.display_name,
      slug: profile.slug ?? "",
      createdAt: profile.created_at,
      phone: profile.phone ?? profile.telegram ?? "",
      roles,
      isPublicHiddenByAdmin: profile.is_public_hidden_by_admin,
      publicPageUrls,
      propertyCount: (propertiesByOwner.get(profile.id) ?? []).length,
      activeRoomCount: ownerStateByProfile.get(profile.id)?.activeRoomCount ?? 0,
      requestCount: requestIdsByProfile.get(profile.id)?.size ?? 0,
    };
  });

  const subscriptionTargets: Array<{
    profileId: string;
    displayName: string;
    slug: string;
    createdAt: string;
    roles: Array<"owner" | "agent">;
    roleContext: "owner" | "agent";
  }> = [];

  for (const profile of records.profiles) {
    const roles = rolesByProfile.get(profile.id) ?? [];

    const subscriptionRoles = roles.filter(
      (role): role is "owner" | "agent" => role === "owner" || role === "agent",
    );

    if (subscriptionRoles.length) {
      subscriptionTargets.push({
        profileId: profile.id,
        displayName: profile.display_name,
        slug: profile.slug ?? "",
        createdAt: profile.created_at,
        roles: subscriptionRoles,
        roleContext: subscriptionRoles.includes("owner") ? "owner" : "agent",
      });
    }
  }

  const runtimeStates = await Promise.all(
    subscriptionTargets.map((item) => getSubscriptionRuntimeState(item.profileId, item.roleContext)),
  );

  const subscriptionRowLookup = new Map(
    records.subscriptions.map((row) => [row.profile_id, row] satisfies [string, SupabaseSubscriptionRow]),
  );

  const subscriptions: AdminSubscriptionItem[] = runtimeStates.map((state) => {
    const target = subscriptionTargets.find((item) => item.profileId === state.profileId);
    const subscriptionRow = subscriptionRowLookup.get(state.profileId);

    return {
      profileId: state.profileId,
      displayName: target?.displayName ?? "Пользователь",
      slug: target?.slug ?? "",
      createdAt: target?.createdAt ?? "",
      roles: target?.roles ?? [],
      status: state.status,
      statusLabel: state.statusLabel,
      activeRoomCount: state.activeRoomCount,
      roomLimit: state.roomLimit,
      roomLimitOverride: subscriptionRow?.room_limit_override ?? null,
      validUntil: state.validUntil,
      paidUntil: state.paidUntil,
      graceEndsAt: state.graceEndsAt,
      hasSubscriptionRow: state.hasSubscriptionRow,
    };
  });

  const profileNameById = new Map(records.profiles.map((profile) => [profile.id, profile.display_name]));
  const profileSlugById = new Map(records.profiles.map((profile) => [profile.id, profile.slug ?? null]));
  const properties: AdminPropertyItem[] = records.properties.map((property) => {
    const roomStats = roomStatsByProperty.get(property.id) ?? { totalRoomCount: 0, activeRoomCount: 0 };

    return {
      propertyId: property.id,
      ownerId: property.owner_id,
      ownerName: profileNameById.get(property.owner_id) ?? "Владелец",
      ownerPublicSlug: profileSlugById.get(property.owner_id) ?? null,
      title: property.title,
      slug: property.slug,
      published: property.published,
      isFrozen: property.is_frozen,
      totalRoomCount: roomStats.totalRoomCount,
      activeRoomCount: roomStats.activeRoomCount,
    };
  });

  const activeSubscriptionCount = subscriptions.filter((item) => item.status === "active").length;
  const paidUserCount = new Set(records.payments.map((item) => item.profile_id)).size;
  const expiringSubscriptions = subscriptions.filter((item) => isExpiringSoon(item.validUntil));
  const frozenProperties = properties.filter((item) => item.isFrozen);
  const hiddenUsers = users.filter((item) => item.isPublicHiddenByAdmin);

  const dashboardData: AdminDashboardData = {
    userCount: records.profiles.length,
    ownerCount: ownerProfiles.length,
    agentCount: agentProfiles.length,
    dualRoleCount,
    propertyCount: records.properties.length,
    roomCount: records.rooms.length,
    requestCount: records.guestRequests.length,
    ownerRequestCount: records.guestRequests.filter((item) => item.source === "owner").length,
    agentRequestCount: records.guestRequests.filter((item) => item.source === "agent").length,
    transferredRequestCount: records.guestRequests.filter((item) => item.transferred_to_owner_at != null).length,
    completedRequestCount: records.guestRequests.filter((item) => item.status === "completed").length,
    collectionCount: records.collections.length,
    paidUserCount,
    activeSubscriptionCount,
    expiringSoonCount: expiringSubscriptions.length,
    frozenPropertyCount: frozenProperties.length,
    users,
    subscriptions,
    properties,
    pendingReferralRewards: records.pendingReferralRewards,
  };

  return {
    dashboardData,
    overviewData: {
      ...dashboardData,
      hiddenProfileCount: hiddenUsers.length,
      pendingReferralCount: records.pendingReferralRewards.length,
      expiringSubscriptions: expiringSubscriptions.slice(0, 4),
      frozenProperties: frozenProperties.slice(0, 4),
      hiddenUsers: hiddenUsers.slice(0, 4),
      pendingReferralRewards: records.pendingReferralRewards.slice(0, 4),
    },
    usersPageData: {
      users,
      hiddenProfileCount: hiddenUsers.length,
    },
    subscriptionsPageData: {
      subscriptions,
      expiringSoonCount: expiringSubscriptions.length,
      activeSubscriptionCount,
    },
    propertiesPageData: {
      properties,
      frozenPropertyCount: frozenProperties.length,
    },
    reviewsPageData: {
      pendingReferralRewards: records.pendingReferralRewards,
    },
  };
});

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const snapshot = await getAdminSnapshot();
  return snapshot.dashboardData;
}

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  const snapshot = await getAdminSnapshot();
  return snapshot.overviewData;
}

export async function getAdminUsersPageData(): Promise<AdminUsersPageData> {
  const snapshot = await getAdminSnapshot();
  return snapshot.usersPageData;
}

export async function getAdminSubscriptionsPageData(): Promise<AdminSubscriptionsPageData> {
  const snapshot = await getAdminSnapshot();
  return snapshot.subscriptionsPageData;
}

export async function getAdminSubscriptionDetailData(profileId: string): Promise<AdminSubscriptionDetailData | null> {
  const snapshot = await getAdminSnapshot();
  const subscription = snapshot.subscriptionsPageData.subscriptions.find((item) => item.profileId === profileId);

  if (!subscription) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const [paymentResult, auditResult] = await Promise.all([
    admin.from("payments").select("*").eq("profile_id", profileId).order("paid_at", { ascending: false }),
    admin.from("subscription_audit_events").select("*").eq("profile_id", profileId).order("created_at", { ascending: false }),
  ]);

  if (paymentResult.error || auditResult.error) {
    logServerDataError("admin_subscription_detail_load_failed", paymentResult.error ?? auditResult.error, { profileId });
    throw new Error("Admin subscription detail is unavailable.");
  }

  const actorIds = new Set<string>();
  for (const payment of paymentResult.data ?? []) actorIds.add(payment.recorded_by_profile_id);
  for (const event of auditResult.data ?? []) actorIds.add(event.actor_profile_id);

  const actorResult = actorIds.size
    ? await admin.from("profiles").select("id, display_name").in("id", [...actorIds])
    : { data: [], error: null };

  if (actorResult.error) {
    logServerDataError("admin_subscription_actor_load_failed", actorResult.error, { profileId });
  }

  const actorNameById = new Map((actorResult.data ?? []).map((profile) => [profile.id, profile.display_name]));

  return {
    subscription,
    payments: (paymentResult.data ?? []).map((payment) => ({
      id: payment.id,
      billingPeriod: payment.billing_period as "month" | "year",
      amountKopecks: payment.amount_kopecks,
      paymentMethod: payment.payment_method as "bank_transfer" | "cash" | "other",
      paidAt: payment.paid_at,
      externalReference: payment.external_reference,
      note: payment.note,
      recordedBy: actorNameById.get(payment.recorded_by_profile_id) ?? "Администратор",
    })),
    auditEvents: (auditResult.data ?? []).map((event) => ({
      id: event.id,
      eventType: event.event_type as AdminSubscriptionDetailData["auditEvents"][number]["eventType"],
      actorName: actorNameById.get(event.actor_profile_id) ?? "Администратор",
      extensionDays: event.extension_days,
      previousPaidUntil: event.previous_paid_until,
      nextPaidUntil: event.next_paid_until,
      details: typeof event.details === "object" && event.details && !Array.isArray(event.details)
        ? event.details as Record<string, unknown>
        : {},
      createdAt: event.created_at,
    })),
  };
}

export async function getAdminPropertiesPageData(): Promise<AdminPropertiesPageData> {
  const snapshot = await getAdminSnapshot();
  return snapshot.propertiesPageData;
}

export async function getAdminReviewsPageData(): Promise<AdminReviewsPageData> {
  const snapshot = await getAdminSnapshot();
  return snapshot.reviewsPageData;
}
