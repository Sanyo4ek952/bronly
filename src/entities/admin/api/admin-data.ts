import { cache } from "react";

import { getSubscriptionRuntimeState } from "@/entities/subscription";
import type { AdminDashboardData, AdminPropertyItem, AdminSubscriptionItem, AdminUserItem } from "@/entities/admin/model/types";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase";
import type {
  SupabaseCollectionRow,
  SupabaseGuestRequestRow,
  SupabaseProfileRow,
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

export const getAdminDashboardData = cache(async (): Promise<AdminDashboardData> => {
  if (!canUseSupabase()) {
    return {
      userCount: 0,
      ownerCount: 0,
      agentCount: 0,
      dualRoleCount: 0,
      propertyCount: 0,
      roomCount: 0,
      requestCount: 0,
      ownerRequestCount: 0,
      agentRequestCount: 0,
      transferredRequestCount: 0,
      completedRequestCount: 0,
      collectionCount: 0,
      paidUserCount: 0,
      activeSubscriptionCount: 0,
      expiringSoonCount: 0,
      frozenPropertyCount: 0,
      users: [],
      subscriptions: [],
      properties: [],
    };
  }

  const admin = createSupabaseAdminClient();
  const [
    { data: profileRows },
    { data: roleRows },
    { data: propertyRows },
    { data: roomRows },
    { data: subscriptionRows },
    { data: guestRequestRows },
    { data: collectionRows },
  ] =
    await Promise.all([
      admin.from("profiles").select("*").order("created_at", { ascending: true }),
      admin.from("user_roles").select("*"),
      admin.from("properties").select("*").order("created_at", { ascending: false }),
      admin.from("rooms").select("*"),
      admin.from("subscriptions").select("*").order("updated_at", { ascending: false }),
      admin.from("guest_requests").select("*").order("created_at", { ascending: false }),
      admin.from("collections").select("*"),
    ]);

  const safeProfiles = (profileRows ?? []) as SupabaseProfileRow[];
  const safeRoles = (roleRows ?? []) as SupabaseUserRoleRow[];
  const safeProperties = (propertyRows ?? []) as SupabasePropertyRow[];
  const safeRooms = (roomRows ?? []) as SupabaseRoomRow[];
  const safeSubscriptions = (subscriptionRows ?? []) as SupabaseSubscriptionRow[];
  const safeGuestRequests = (guestRequestRows ?? []) as SupabaseGuestRequestRow[];
  const safeCollections = (collectionRows ?? []) as SupabaseCollectionRow[];

  const rolesByProfile = new Map<string, string[]>();
  for (const role of safeRoles) {
    const current = rolesByProfile.get(role.profile_id) ?? [];
    if (!current.includes(role.role)) {
      current.push(role.role);
    }
    rolesByProfile.set(role.profile_id, current);
  }

  const ownerProfiles = safeProfiles.filter((profile) => (rolesByProfile.get(profile.id) ?? []).includes("owner"));
  const agentProfiles = safeProfiles.filter((profile) => (rolesByProfile.get(profile.id) ?? []).includes("agent"));
  const dualRoleCount = safeProfiles.filter((profile) => {
    const roles = rolesByProfile.get(profile.id) ?? [];
    return roles.includes("owner") && roles.includes("agent");
  }).length;
  const propertiesByOwner = new Map<string, SupabasePropertyRow[]>();
  for (const property of safeProperties) {
    const current = propertiesByOwner.get(property.owner_id) ?? [];
    current.push(property);
    propertiesByOwner.set(property.owner_id, current);
  }

  const roomStatsByProperty = new Map<string, { totalRoomCount: number; activeRoomCount: number }>();
  for (const room of safeRooms) {
    const current = roomStatsByProperty.get(room.property_id) ?? { totalRoomCount: 0, activeRoomCount: 0 };
    current.totalRoomCount += 1;
    if (room.is_active) {
      current.activeRoomCount += 1;
    }
    roomStatsByProperty.set(room.property_id, current);
  }

  const requestIdsByProfile = new Map<string, Set<string>>();
  for (const request of safeGuestRequests) {
    const relatedProfiles = [request.owner_id, request.agent_id].filter((value): value is string => Boolean(value));
    for (const profileId of relatedProfiles) {
      const current = requestIdsByProfile.get(profileId) ?? new Set<string>();
      current.add(request.id);
      requestIdsByProfile.set(profileId, current);
    }
  }

  const ownerRuntimeStates = await Promise.all(ownerProfiles.map((profile) => getSubscriptionRuntimeState(profile.id, "owner")));
  const ownerStateByProfile = new Map(ownerRuntimeStates.map((item) => [item.profileId, item]));

  const users: AdminUserItem[] = safeProfiles.map((profile) => {
    const roles = rolesByProfile.get(profile.id) ?? [];
    const publicPageUrls: string[] = [];

    if (profile.slug && roles.includes("owner")) {
      publicPageUrls.push(`/p/${profile.slug}`);
    }

    if (profile.slug && roles.includes("agent")) {
      publicPageUrls.push(`/a/${profile.slug}`);
    }

    return {
      profileId: profile.id,
      displayName: profile.display_name,
      slug: profile.slug ?? "",
      phone: profile.phone ?? profile.telegram ?? profile.whatsapp ?? "",
      roles,
      isPublicHiddenByAdmin: profile.is_public_hidden_by_admin,
      publicPageUrls,
      propertyCount: (propertiesByOwner.get(profile.id) ?? []).length,
      activeRoomCount: ownerStateByProfile.get(profile.id)?.activeRoomCount ?? 0,
      requestCount: requestIdsByProfile.get(profile.id)?.size ?? 0,
    };
  });

  const subscriptionTargets: Array<{ profileId: string; displayName: string; roleContext: "owner" | "agent" }> = [];
  for (const profile of safeProfiles) {
    const roles = rolesByProfile.get(profile.id) ?? [];
    if (roles.includes("owner")) {
      subscriptionTargets.push({ profileId: profile.id, displayName: profile.display_name, roleContext: "owner" });
    }
    if (roles.includes("agent")) {
      subscriptionTargets.push({ profileId: profile.id, displayName: profile.display_name, roleContext: "agent" });
    }
  }

  const runtimeStates = await Promise.all(
    subscriptionTargets.map((item) => getSubscriptionRuntimeState(item.profileId, item.roleContext)),
  );

  const subscriptionRowLookup = new Map(
    safeSubscriptions.map((row) => [`${row.profile_id}:${row.role_context}`, row] satisfies [string, SupabaseSubscriptionRow]),
  );

  const subscriptions: AdminSubscriptionItem[] = runtimeStates.map((state) => {
    const target = subscriptionTargets.find(
      (item) => item.profileId === state.profileId && item.roleContext === state.roleContext,
    );
    const subscriptionRow = subscriptionRowLookup.get(`${state.profileId}:${state.roleContext}`);

    return {
      profileId: state.profileId,
      displayName: target?.displayName ?? "Пользователь",
      roleContext: state.roleContext,
      status: state.status,
      statusLabel: state.statusLabel,
      planName: state.planName,
      activeRoomCount: state.activeRoomCount,
      activeRoomLimit: subscriptionRow?.active_room_limit ?? state.roomLimit,
      validUntil: state.validUntil,
      paidUntil: state.paidUntil,
      graceEndsAt: state.graceEndsAt,
      hasSubscriptionRow: state.hasSubscriptionRow,
    };
  });

  const profileNameById = new Map(safeProfiles.map((profile) => [profile.id, profile.display_name]));
  const properties: AdminPropertyItem[] = safeProperties.map((property) => {
    const roomStats = roomStatsByProperty.get(property.id) ?? { totalRoomCount: 0, activeRoomCount: 0 };

    return {
      propertyId: property.id,
      ownerId: property.owner_id,
      ownerName: profileNameById.get(property.owner_id) ?? "Владелец",
      title: property.title,
      slug: property.slug,
      published: property.published,
      isFrozen: property.is_frozen,
      totalRoomCount: roomStats.totalRoomCount,
      activeRoomCount: roomStats.activeRoomCount,
    };
  });

  const paidUserCount = new Set(
    subscriptions
      .filter((item) => item.status === "active" || item.status === "manual")
      .map((item) => item.profileId),
  ).size;

  return {
    userCount: safeProfiles.length,
    ownerCount: ownerProfiles.length,
    agentCount: agentProfiles.length,
    dualRoleCount,
    propertyCount: safeProperties.length,
    roomCount: safeRooms.length,
    requestCount: safeGuestRequests.length,
    ownerRequestCount: safeGuestRequests.filter((item) => item.source === "owner").length,
    agentRequestCount: safeGuestRequests.filter((item) => item.source === "agent").length,
    transferredRequestCount: safeGuestRequests.filter((item) => item.transferred_to_owner_at != null).length,
    completedRequestCount: safeGuestRequests.filter((item) => item.status === "completed").length,
    collectionCount: safeCollections.length,
    paidUserCount,
    activeSubscriptionCount: subscriptions.filter((item) => item.status === "active" || item.status === "manual").length,
    expiringSoonCount: subscriptions.filter((item) => isExpiringSoon(item.validUntil)).length,
    frozenPropertyCount: properties.filter((item) => item.isFrozen).length,
    users,
    subscriptions,
    properties,
  };
});
