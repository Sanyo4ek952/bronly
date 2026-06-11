import type { AuthProfile } from "@/shared/api/supabase";
import { createSupabaseAdminClient, getAppUrl } from "@/shared/api/supabase";
import type {
  SupabaseReferralInviteRow,
  SupabaseReferralRewardRow,
  SupabaseSubscriptionRow,
  SupabaseUserRoleRow,
} from "@/shared/api/supabase";
import { formatDateTimeLabel } from "@/shared/lib";

import type {
  ReferralApprovalStatus,
  ReferralInviteIntent,
  ReferralInvitePageData,
  ReferralInviteRole,
  ReferralInviteSummary,
  ReferralMilestoneType,
  ReferralQueueItem,
} from "../model/types";

function getBaseUrl() {
  return getAppUrl() ?? "http://localhost:3000";
}

function buildInviteUrl(token: string) {
  return `${getBaseUrl()}/invite/${token}`;
}

function getInviteIntent(inviteeRole: ReferralInviteRole) {
  if (inviteeRole === "owner") {
    return {
      intent: "join_app" as const,
    };
  }

  return {
    intent: "collaboration" as const,
  };
}

export function getReferralInviteContent(input: {
  inviterRole: ReferralInviteRole;
  inviteeRole: ReferralInviteRole;
  inviteUrl?: string;
}) {
  const inviteTitle = input.inviteeRole === "agent" ? "Пригласить агента" : "Пригласить владельца";
  const intent = getInviteIntent(input.inviteeRole).intent;
  const linkSuffix = input.inviteUrl ? `: ${input.inviteUrl}` : ".";

  if (input.inviteeRole === "agent") {
    return {
      title: inviteTitle,
      description:
        "Отправьте персональную ссылку агенту. После регистрации он сможет открыть объекты для сотрудничества и отправить предложение владельцу.",
      nextStepText:
        "После регистрации вы сможете перейти к объектам для сотрудничества и отправить предложение владельцу.",
      shareMessage: `Приглашаю вас в Bronly как агента. Подключайтесь по ссылке, чтобы начать сотрудничество${linkSuffix}`,
      targetHref: "/agent/dashboard/opportunities?invite=accepted",
      targetLabel: "Открыть объекты для сотрудничества",
      intent,
    };
  }

  return {
    title: inviteTitle,
    description:
      "Отправьте персональную ссылку владельцу. После регистрации он сможет настроить кабинет и добавить первый объект или отдельный номер.",
    nextStepText:
      "После регистрации вы сможете настроить кабинет владельца и добавить первый объект или отдельный номер.",
    shareMessage: `Приглашаю вас в Bronly как владельца. Зарегистрируйтесь по ссылке, чтобы настроить кабинет и начать работу${linkSuffix}`,
    targetHref: "/dashboard?invite=accepted",
    targetLabel: "Открыть кабинет владельца",
    intent,
  };
}

function buildShareMessage(input: {
  inviterRole: ReferralInviteRole;
  inviteeRole: ReferralInviteRole;
  inviteUrl: string;
}) {
  return getReferralInviteContent(input).shareMessage;
}

function getMilestoneLabel(milestoneType: ReferralMilestoneType) {
  switch (milestoneType) {
    case "agent_first_active_collaboration":
      return "Первое активное сотрудничество агента";
    default:
      return "Первый объект или отдельный номер владельца";
  }
}

function getReferralTarget(role: ReferralInviteRole) {
  const content = getReferralInviteContent({
    inviterRole: role === "agent" ? "owner" : "agent",
    inviteeRole: role,
  });

  return {
    href: content.targetHref,
    label: content.targetLabel,
  };
}

function mapInviteRow(
  row: SupabaseReferralInviteRow,
  inviterName: string,
  inviterRole: ReferralInviteRole,
  inviteeRole: ReferralInviteRole,
  intent: ReferralInviteIntent,
): ReferralInviteSummary {
  const inviteUrl = buildInviteUrl(row.token);
  const content = getReferralInviteContent({
    inviterRole,
    inviteeRole,
    inviteUrl,
  });

  return {
    id: row.id,
    token: row.token,
    inviterProfileId: row.inviter_profile_id,
    inviterName,
    inviterRole,
    inviteeRole,
    intent,
    status: row.status,
    usedByProfileId: row.used_by_profile_id,
    usedAt: row.used_at,
    createdAt: row.created_at,
    inviteUrl,
    title: content.title,
    description: content.description,
    nextStepText: content.nextStepText,
    shareMessage: buildShareMessage({
      inviterRole,
      inviteeRole,
      inviteUrl,
    }),
  };
}

export async function getOrCreateReferralInvite(input: {
  profile: AuthProfile;
  inviterRole: ReferralInviteRole;
  inviteeRole: ReferralInviteRole;
}): Promise<ReferralInviteSummary | null> {
  const admin = createSupabaseAdminClient();
  const { intent } = getInviteIntent(input.inviteeRole);
  const { data: existingData } = await admin
    .from("referral_invites")
    .select("*")
    .eq("inviter_profile_id", input.profile.id)
    .eq("inviter_role", input.inviterRole)
    .eq("invitee_role", input.inviteeRole)
    .eq("intent", intent)
    .eq("status", "active")
    .is("used_by_profile_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const existing = (existingData ?? null) as SupabaseReferralInviteRow | null;

  if (existing) {
    return mapInviteRow(existing, input.profile.displayName, input.inviterRole, input.inviteeRole, intent);
  }

  const nowIso = new Date().toISOString();
  const { data } = await admin
    .from("referral_invites")
    .insert({
      token: crypto.randomUUID().replace(/-/g, ""),
      inviter_profile_id: input.profile.id,
      inviter_role: input.inviterRole,
      invitee_role: input.inviteeRole,
      intent,
      status: "active",
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select("*")
    .single();

  const created = (data ?? null) as SupabaseReferralInviteRow | null;
  if (!created) {
    return null;
  }

  return mapInviteRow(created, input.profile.displayName, input.inviterRole, input.inviteeRole, intent);
}

export async function getReferralInvitePageData(token: string): Promise<ReferralInvitePageData> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("referral_invites")
    .select("*, profiles!referral_invites_inviter_profile_id_fkey(display_name)")
    .eq("token", token)
    .maybeSingle();

  const row = (data ?? null) as
    | (SupabaseReferralInviteRow & {
        profiles?: {
          display_name?: string | null;
        } | null;
      })
    | null;

  if (!row || row.inviter_role === "admin" || row.invitee_role === "admin") {
    return {
      invite: null,
      canRegister: false,
      targetHref: "/register",
      targetLabel: "Создать аккаунт",
    };
  }

  const invite = mapInviteRow(
    row,
    row.profiles?.display_name ?? "Пользователь",
    row.inviter_role,
    row.invitee_role,
    row.intent,
  );
  const target = getReferralTarget(row.invitee_role);

  return {
    invite,
    canRegister: row.status === "active" && !row.used_by_profile_id,
    targetHref: target.href,
    targetLabel: target.label,
  };
}

export async function consumeReferralInviteForProfile(input: {
  inviteToken: string;
  invitedProfileId: string;
  inviteeRole: ReferralInviteRole;
}) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("referral_invites")
    .select("*")
    .eq("token", input.inviteToken)
    .maybeSingle();
  const invite = (data ?? null) as SupabaseReferralInviteRow | null;

  if (!invite || invite.inviter_role === "admin" || invite.invitee_role === "admin") {
    return false;
  }

  if (invite.invitee_role !== input.inviteeRole) {
    return false;
  }

  if (invite.inviter_profile_id === input.invitedProfileId) {
    return false;
  }

  if (invite.used_by_profile_id && invite.used_by_profile_id !== input.invitedProfileId) {
    return false;
  }

  const nowIso = new Date().toISOString();
  const { error } = await admin
    .from("referral_invites")
    .update({
      status: "used",
      used_by_profile_id: input.invitedProfileId,
      used_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", invite.id);

  return !error;
}

async function createPendingReferralReward(input: {
  invitedProfileId: string;
  milestoneType: ReferralMilestoneType;
}) {
  const admin = createSupabaseAdminClient();
  const { data: existingRewardData } = await admin
    .from("referral_rewards")
    .select("id")
    .eq("invited_profile_id", input.invitedProfileId)
    .maybeSingle();

  if (existingRewardData?.id) {
    return false;
  }

  const { data: inviteData } = await admin
    .from("referral_invites")
    .select("*")
    .eq("used_by_profile_id", input.invitedProfileId)
    .eq("status", "used")
    .order("used_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const invite = (inviteData ?? null) as SupabaseReferralInviteRow | null;

  if (!invite) {
    return false;
  }

  const nowIso = new Date().toISOString();
  const { error } = await admin.from("referral_rewards").insert({
    invite_id: invite.id,
    inviter_profile_id: invite.inviter_profile_id,
    invited_profile_id: input.invitedProfileId,
    milestone_type: input.milestoneType,
    milestone_reached_at: nowIso,
    approval_status: "pending",
    reward_days: 10,
    applied_role_contexts: [],
    created_at: nowIso,
    updated_at: nowIso,
  });

  return !error;
}

export async function markOwnerReferralMilestone(profileId: string) {
  return createPendingReferralReward({
    invitedProfileId: profileId,
    milestoneType: "owner_inventory_created",
  });
}

export async function markAgentReferralMilestone(profileId: string) {
  return createPendingReferralReward({
    invitedProfileId: profileId,
    milestoneType: "agent_first_active_collaboration",
  });
}

export async function getPendingReferralQueue(): Promise<ReferralQueueItem[]> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("referral_rewards")
    .select("*, referral_invites(token), inviter:profiles!referral_rewards_inviter_profile_id_fkey(display_name), invited:profiles!referral_rewards_invited_profile_id_fkey(display_name)")
    .eq("approval_status", "pending")
    .order("milestone_reached_at", { ascending: false });

  const rows = (data ?? []) as Array<
    SupabaseReferralRewardRow & {
      referral_invites?: { token?: string | null } | null;
      inviter?: { display_name?: string | null } | null;
      invited?: { display_name?: string | null } | null;
    }
  >;

  if (!rows.length) {
    return [];
  }

  const inviterIds = Array.from(new Set(rows.map((row) => row.inviter_profile_id)));
  const { data: roleRowsData } = await admin.from("user_roles").select("*").in("profile_id", inviterIds);
  const roleRows = (roleRowsData ?? []) as SupabaseUserRoleRow[];
  const rolesByProfile = new Map<string, Array<"owner" | "agent">>();

  for (const row of roleRows) {
    if (row.role === "admin") {
      continue;
    }
    const current = rolesByProfile.get(row.profile_id) ?? [];
    if (!current.includes(row.role)) {
      current.push(row.role);
    }
    rolesByProfile.set(row.profile_id, current);
  }

  return rows.map((row) => ({
    rewardId: row.id,
    inviterProfileId: row.inviter_profile_id,
    inviterName: row.inviter?.display_name ?? "Пользователь",
    invitedProfileId: row.invited_profile_id,
    invitedName: row.invited?.display_name ?? "Новый пользователь",
    inviterRoles: rolesByProfile.get(row.inviter_profile_id) ?? [],
    milestoneType: row.milestone_type,
    milestoneLabel: getMilestoneLabel(row.milestone_type),
    milestoneReachedAt: formatDateTimeLabel(row.milestone_reached_at),
    rewardDays: row.reward_days,
    inviteToken: row.referral_invites?.token ?? "",
  }));
}

async function extendSubscriptionsForProfile(profileId: string, roleContexts: Array<"owner" | "agent">, rewardDays: number) {
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const { data } = await admin
    .from("subscriptions")
    .select("*")
    .eq("profile_id", profileId)
    .in("role_context", roleContexts);

  const rows = (data ?? []) as SupabaseSubscriptionRow[];
  const rowByRole = new Map(rows.map((row) => [row.role_context, row] as const));
  const appliedRoleContexts: Array<"owner" | "agent"> = [];

  for (const roleContext of roleContexts) {
    const existing = rowByRole.get(roleContext);
    const baseDate = existing?.paid_until ? new Date(existing.paid_until) : now;
    const nextPaidUntil = new Date(Math.max(baseDate.getTime(), now.getTime()));
    nextPaidUntil.setDate(nextPaidUntil.getDate() + rewardDays);

    const payload = {
      profile_id: profileId,
      role_context: roleContext,
      status: "active",
      plan_name: existing?.plan_name ?? "MVP",
      active_room_limit: existing?.active_room_limit ?? null,
      trial_ends_at: existing?.trial_ends_at ?? null,
      grace_ends_at: null,
      paid_until: nextPaidUntil.toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await admin.from("subscriptions").upsert(payload, { onConflict: "profile_id,role_context" });
    if (!error) {
      appliedRoleContexts.push(roleContext);
    }
  }

  return appliedRoleContexts;
}

export async function reviewReferralReward(input: {
  rewardId: string;
  decision: Exclude<ReferralApprovalStatus, "pending">;
  adminProfileId: string;
}) {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("referral_rewards")
    .select("*")
    .eq("id", input.rewardId)
    .maybeSingle();
  const reward = (data ?? null) as SupabaseReferralRewardRow | null;

  if (!reward || reward.approval_status !== "pending") {
    return false;
  }

  const nowIso = new Date().toISOString();

  if (input.decision === "rejected") {
    const { error } = await admin
      .from("referral_rewards")
      .update({
        approval_status: "rejected",
        rejected_at: nowIso,
        approved_by_admin_id: input.adminProfileId,
        updated_at: nowIso,
      })
      .eq("id", reward.id);

    return !error;
  }

  const { data: roleRowsData } = await admin
    .from("user_roles")
    .select("role")
    .eq("profile_id", reward.inviter_profile_id)
    .in("role", ["owner", "agent"]);
  const roleRows = (roleRowsData ?? []) as Array<{ role: "owner" | "agent" }>;
  const roleContexts = Array.from(new Set(roleRows.map((row) => row.role)));
  const appliedRoleContexts = await extendSubscriptionsForProfile(reward.inviter_profile_id, roleContexts, reward.reward_days);

  const { error } = await admin
    .from("referral_rewards")
    .update({
      approval_status: "approved",
      approved_by_admin_id: input.adminProfileId,
      approved_at: nowIso,
      applied_role_contexts: appliedRoleContexts,
      updated_at: nowIso,
    })
    .eq("id", reward.id);

  return !error;
}
