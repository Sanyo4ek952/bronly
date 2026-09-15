import type { AuthProfile } from "@/shared/api/supabase";
import { createSupabaseAdminClient, requireAppUrl } from "@/shared/api/supabase";
import type {
  SupabaseReferralInviteRow,
  SupabaseReferralRewardRow,
  SupabaseUserRoleRow,
} from "@/shared/api/supabase";
import { logServerDataError } from "@/shared/api/supabase/server-diagnostics";
import { formatDateTimeLabel } from "@/shared/lib";

import { isReferralInviteAvailable } from "../model/rules";
import type {
  ReferralApprovalStatus,
  ReferralInviteIntent,
  ReferralInvitePageData,
  ReferralInviteRole,
  ReferralInviteSummary,
  ReferralMilestoneType,
  ReferralQueueItem,
  ReferralRegistrationIntent,
  ReferralReviewResult,
} from "../model/types";

function getBaseUrl() {
  return requireAppUrl();
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
  row: Pick<
    SupabaseReferralInviteRow,
    "id" | "token" | "inviter_profile_id" | "status" | "used_by_profile_id" | "used_at" | "created_at"
  >,
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
  if (!input.profile.roles.includes(input.inviterRole)) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { intent } = getInviteIntent(input.inviteeRole);
  const findExistingInvite = () => admin
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

  const { data: existingData, error: existingError } = await findExistingInvite();

  if (existingError) {
    logServerDataError("referral_invite_lookup_failed", existingError);
    return null;
  }

  const existing = existingData ?? null;

  if (existing && isReferralInviteAvailable({
    status: existing.status,
    usedByProfileId: existing.used_by_profile_id,
    expiresAt: existing.expires_at,
  })) {
    return mapInviteRow(existing, input.profile.displayName, input.inviterRole, input.inviteeRole, intent);
  }

  if (existing) {
    const { error: expireError } = await admin
      .from("referral_invites")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .eq("status", "active");

    if (expireError) {
      logServerDataError("referral_invite_expire_failed", expireError, { inviteId: existing.id });
      return null;
    }
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await admin
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

  if (error) {
    if (error.code === "23505") {
      const { data: concurrentData, error: concurrentError } = await findExistingInvite();
      const concurrent = concurrentData ?? null;

      if (!concurrentError && concurrent) {
        return mapInviteRow(concurrent, input.profile.displayName, input.inviterRole, input.inviteeRole, intent);
      }
    }

    logServerDataError("referral_invite_create_failed", error, {
      inviterProfileId: input.profile.id,
      inviterRole: input.inviterRole,
      inviteeRole: input.inviteeRole,
    });
    return null;
  }

  const created = data ?? null;
  if (!created) {
    return null;
  }

  return mapInviteRow(created, input.profile.displayName, input.inviterRole, input.inviteeRole, intent);
}

export async function getReferralInvitePageData(token: string): Promise<ReferralInvitePageData> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("referral_invites")
    .select("*, profiles!referral_invites_inviter_profile_id_fkey(display_name)")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    logServerDataError("referral_invite_page_lookup_failed", error);
    throw new Error("Referral invite data is unavailable.");
  }

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
  const canRegister = isReferralInviteAvailable({
    status: row.status,
    usedByProfileId: row.used_by_profile_id,
    expiresAt: row.expires_at,
  });

  if (!canRegister && row.status !== "used") {
    return {
      invite: null,
      canRegister: false,
      targetHref: "/register",
      targetLabel: "Создать аккаунт",
    };
  }

  return {
    invite,
    canRegister,
    targetHref: target.href,
    targetLabel: target.label,
  };
}

export async function getReferralRegistrationIntent(token: string): Promise<ReferralRegistrationIntent | null> {
  if (!token) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("referral_invites")
    .select("token, invitee_role, status, used_by_profile_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    logServerDataError("referral_registration_intent_lookup_failed", error);
    return null;
  }

  if (
    !data
    || (data.invitee_role !== "owner" && data.invitee_role !== "agent")
    || !isReferralInviteAvailable({
      status: data.status,
      usedByProfileId: data.used_by_profile_id,
      expiresAt: data.expires_at,
    })
  ) {
    return null;
  }

  return {
    inviteToken: data.token,
    inviteeRole: data.invitee_role,
  };
}

export async function consumeReferralInviteForProfile(input: {
  inviteToken: string;
  invitedProfileId: string;
  inviteeRole: ReferralInviteRole;
}) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("consume_referral_invite", {
    p_invite_token: input.inviteToken,
    p_invited_profile_id: input.invitedProfileId,
    p_invitee_role: input.inviteeRole,
  });

  if (error) {
    logServerDataError("referral_invite_consume_failed", error, {
      invitedProfileId: input.invitedProfileId,
      inviteeRole: input.inviteeRole,
    });
    return false;
  }

  return data === true;
}

async function createPendingReferralReward(input: {
  invitedProfileId: string;
  milestoneType: ReferralMilestoneType;
}) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("record_referral_milestone", {
    p_invited_profile_id: input.invitedProfileId,
    p_milestone_type: input.milestoneType,
  });

  if (error) {
    logServerDataError("referral_milestone_record_failed", error, {
      invitedProfileId: input.invitedProfileId,
      milestoneType: input.milestoneType,
    });
    return false;
  }

  return data === true;
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
  const { data, error } = await admin
    .from("referral_rewards")
    .select("*, referral_invites(token), inviter:profiles!referral_rewards_inviter_profile_id_fkey(display_name), invited:profiles!referral_rewards_invited_profile_id_fkey(display_name)")
    .eq("approval_status", "pending")
    .order("milestone_reached_at", { ascending: false });

  if (error) {
    throw error;
  }

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
  const { data: roleRowsData, error: roleRowsError } = await admin.from("user_roles").select("*").in("profile_id", inviterIds);

  if (roleRowsError) {
    throw roleRowsError;
  }
  const roleRows = roleRowsData ?? [];
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

export async function reviewReferralReward(input: {
  rewardId: string;
  decision: Exclude<ReferralApprovalStatus, "pending">;
  adminProfileId: string;
}): Promise<ReferralReviewResult | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("admin_review_referral_reward", {
    p_reward_id: input.rewardId,
    p_decision: input.decision,
    p_actor_profile_id: input.adminProfileId,
  });

  if (error) {
    logServerDataError("referral_reward_review_failed", error, {
      rewardId: input.rewardId,
      decision: input.decision,
      adminProfileId: input.adminProfileId,
    });
    return null;
  }

  const allowedResults = new Set<ReferralReviewResult>([
    "approved",
    "rejected",
    "already_approved",
    "already_rejected",
    "conflict_approved",
    "conflict_rejected",
    "not_found",
  ]);

  return allowedResults.has(data as ReferralReviewResult) ? data as ReferralReviewResult : null;
}
