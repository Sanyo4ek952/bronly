import { buildNotificationIdempotencyKey, createNotificationEvent } from "@/entities/notification";
import { markAgentReferralMilestone } from "@/entities/referral";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import { logServerConfigurationError, logServerDataError } from "@/shared/api/supabase/server-diagnostics";
import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import { canAccessAgentMutations, canAccessOwnerMutations } from "@/shared/api/supabase/access-rules";
import type {
  SupabaseAgentPropertyLinkRow,
  SupabaseAgentRoomLinkRow,
} from "@/shared/api/supabase/types";
import type { AgentCollaborationTargetType } from "@/entities/collaboration/model/types";
import { normalizeAgentMarkupPercent } from "@/entities/collaboration/model/rules";

import { getAccessibleRoomForAgent, resolveProposalTarget } from "./collaboration-access";

export async function upsertAgentRoomMarkup(input: { roomId: string; markupPercent: number }) {
  if (!canUseSupabase()) {
    logServerConfigurationError("agent_room_markup_supabase_not_configured");
    return { ok: false as const, reason: "service_unavailable" as const };
  }

  const profile = await getCurrentAuthProfile();

  if (!profile || !profile.roles.includes("agent")) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  if (!input.roomId) {
    return { ok: false as const, reason: "validation" as const };
  }

  const accessibleRoom = await getAccessibleRoomForAgent(profile.id, input.roomId);

  if (!accessibleRoom) {
    return { ok: false as const, reason: "not_allowed" as const };
  }

  const markupPercent = normalizeAgentMarkupPercent(input.markupPercent);

  if (markupPercent == null) {
    return { ok: false as const, reason: "validation" as const };
  }

  const supabase = await createSupabaseServerClient();

  if (markupPercent === 0) {
    const { error } = await supabase
      .from("room_agent_markups")
      .delete()
      .eq("room_id", input.roomId)
      .eq("agent_id", profile.id);

    if (error) {
      logServerDataError("agent_room_markup_delete_failed", error);
      return { ok: false as const, reason: "save_failed" as const };
    }

    return { ok: true as const };
  }

  const { error } = await supabase.from("room_agent_markups").upsert(
    {
      room_id: input.roomId,
      agent_id: profile.id,
      markup_percent: markupPercent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "room_id,agent_id" },
  );

  if (error) {
    logServerDataError("agent_room_markup_upsert_failed", error);
    return { ok: false as const, reason: "save_failed" as const };
  }

  return { ok: true as const };
}

export async function submitAgentProposal(input: {
  targetType: AgentCollaborationTargetType;
  propertyId?: string;
  roomId?: string;
  message: string;
}) {
  if (!canUseSupabase()) {
    logServerConfigurationError("agent_proposal_supabase_not_configured");
    return { ok: false as const, reason: "service_unavailable" as const };
  }

  const profile = await getCurrentAuthProfile();

  if (!profile || !canAccessAgentMutations(profile)) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  const target = await resolveProposalTarget({
    profileId: profile.id,
    targetType: input.targetType,
    propertyId: input.propertyId,
    roomId: input.roomId,
  });

  if (!target) {
    return { ok: false as const, reason: "not_available" as const };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const proposedAt = new Date().toISOString();
    let proposalId: string;
    const payload = {
      owner_id: target.ownerId,
      agent_id: profile.id,
      status: "pending" as const,
      proposal_message: input.message.trim() || null,
      proposed_at: proposedAt,
      decided_at: null,
      owner_contact_visible: false,
      collaboration_terms: null,
    };

    if (target.targetType === "property") {
      const { data: existingData } = await supabase
        .from("agent_property_links")
        .select("*")
        .eq("property_id", target.targetId)
        .eq("agent_id", profile.id)
        .maybeSingle();
      const existing = existingData;

      if (existing?.status === "pending" || existing?.status === "active") {
        return { ok: false as const, reason: "duplicate" as const };
      }

      const result = existing
        ? await supabase
            .from("agent_property_links")
            .update({ ...payload, property_id: target.targetId })
            .eq("id", existing.id)
            .select("id")
            .single()
        : await supabase
            .from("agent_property_links")
            .insert({ ...payload, property_id: target.targetId })
            .select("id")
            .single();

      if (result.error || !result.data?.id) {
        logServerDataError("agent_property_proposal_save_failed", result.error ?? new Error("Missing proposal id."));
        return { ok: false as const, reason: "save_failed" as const };
      }

      proposalId = result.data.id;
    } else {
      const { data: existingData } = await supabase
        .from("agent_room_links")
        .select("*")
        .eq("room_id", target.targetId)
        .eq("agent_id", profile.id)
        .maybeSingle();
      const existing = existingData;

      if (existing?.status === "pending" || existing?.status === "active") {
        return { ok: false as const, reason: "duplicate" as const };
      }

      const result = existing
        ? await supabase
            .from("agent_room_links")
            .update({ ...payload, room_id: target.targetId })
            .eq("id", existing.id)
            .select("id")
            .single()
        : await supabase
            .from("agent_room_links")
            .insert({ ...payload, room_id: target.targetId })
            .select("id")
            .single();

      if (result.error || !result.data?.id) {
        logServerDataError("agent_room_proposal_save_failed", result.error ?? new Error("Missing proposal id."));
        return { ok: false as const, reason: "save_failed" as const };
      }

      proposalId = result.data.id;
    }

    await createNotificationEvent({
      recipientId: target.ownerId,
      eventType: "agent_proposal_received",
      idempotencyKey: buildNotificationIdempotencyKey({
        eventType: "agent_proposal_received",
        sourceId: proposalId,
        occurrence: proposedAt,
      }),
      payload: {
        proposalId,
        propertyId: target.targetType === "property" ? target.targetId : undefined,
        propertyTitle: target.targetType === "property" ? target.title : undefined,
        roomTitle: target.targetType === "standalone_room" ? target.title : undefined,
        roleContext: "owner",
      },
    });

    return { ok: true as const };
  } catch (error) {
    logServerDataError("agent_proposal_unhandled_error", error);
    return { ok: false as const, reason: "save_failed" as const };
  }
}

export async function reviewAgentProposal(input: {
  proposalId: string;
  targetType: AgentCollaborationTargetType;
  decision: "active" | "declined";
}) {
  if (!canUseSupabase()) {
    logServerConfigurationError("agent_proposal_review_supabase_not_configured");
    return { ok: false as const, reason: "service_unavailable" as const };
  }

  const profile = await getCurrentAuthProfile();

  if (!profile || !canAccessOwnerMutations(profile) || !input.proposalId) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  try {
    const supabase = createSupabaseAdminClient();

    if (input.targetType === "property") {
      const { data: proposalData } = await supabase
        .from("agent_property_links")
        .select("*")
        .eq("id", input.proposalId)
        .maybeSingle();
      const proposal = proposalData;

      if (!proposal || proposal.owner_id !== profile.id || proposal.status !== "pending") {
        return { ok: false as const, reason: "not_found" as const };
      }

      const decidedAt = new Date().toISOString();
      let ownerContactVisible = false;

      if (input.decision === "active") {
        const { data: propertyData } = await supabase
          .from("properties")
          .select("allow_owner_contact_sharing")
          .eq("id", proposal.property_id)
          .maybeSingle();

        ownerContactVisible = Boolean(propertyData?.allow_owner_contact_sharing);
      }

      const { error } = await supabase
        .from("agent_property_links")
        .update({
          status: input.decision,
          decided_at: decidedAt,
          owner_contact_visible: ownerContactVisible,
          collaboration_terms: proposal.collaboration_terms ?? proposal.proposal_message,
        })
        .eq("id", proposal.id);

      if (error) {
        logServerDataError("agent_property_proposal_review_save_failed", error);
        return { ok: false as const, reason: "save_failed" as const };
      }

      const { data: propertyDetails } = await supabase.from("properties").select("title").eq("id", proposal.property_id).maybeSingle();

      await createNotificationEvent({
        recipientId: proposal.agent_id,
        eventType: input.decision === "active" ? "agent_proposal_accepted" : "agent_proposal_rejected",
        idempotencyKey: buildNotificationIdempotencyKey({
          eventType: input.decision === "active" ? "agent_proposal_accepted" : "agent_proposal_rejected",
          sourceId: proposal.id,
          occurrence: decidedAt,
        }),
        payload: {
          proposalId: proposal.id,
          propertyId: proposal.property_id,
          propertyTitle: (propertyDetails?.title as string | null) ?? undefined,
          roleContext: "agent",
        },
      });

      if (input.decision === "active") {
        await markAgentReferralMilestone(proposal.agent_id);
      }

      return { ok: true as const };
    }

    const { data: proposalData } = await supabase
      .from("agent_room_links")
      .select("*")
      .eq("id", input.proposalId)
      .maybeSingle();
    const proposal = proposalData;

    if (!proposal || proposal.owner_id !== profile.id || proposal.status !== "pending") {
      return { ok: false as const, reason: "not_found" as const };
    }

    const decidedAt = new Date().toISOString();
    let ownerContactVisible = false;

    if (input.decision === "active") {
      const { data: roomData } = await supabase
        .from("rooms")
        .select("allow_owner_contact_sharing")
        .eq("id", proposal.room_id)
        .maybeSingle();

      ownerContactVisible = Boolean(roomData?.allow_owner_contact_sharing);
    }

    const { error } = await supabase
      .from("agent_room_links")
      .update({
        status: input.decision,
        decided_at: decidedAt,
        owner_contact_visible: ownerContactVisible,
        collaboration_terms: proposal.collaboration_terms ?? proposal.proposal_message,
      })
      .eq("id", proposal.id);

    if (error) {
      logServerDataError("agent_room_proposal_review_save_failed", error);
      return { ok: false as const, reason: "save_failed" as const };
    }

    const { data: roomDetails } = await supabase.from("rooms").select("title").eq("id", proposal.room_id).maybeSingle();

    await createNotificationEvent({
      recipientId: proposal.agent_id,
      eventType: input.decision === "active" ? "agent_proposal_accepted" : "agent_proposal_rejected",
      idempotencyKey: buildNotificationIdempotencyKey({
        eventType: input.decision === "active" ? "agent_proposal_accepted" : "agent_proposal_rejected",
        sourceId: proposal.id,
        occurrence: decidedAt,
      }),
      payload: {
        proposalId: proposal.id,
        roomTitle: (roomDetails?.title as string | null) ?? undefined,
        roleContext: "agent",
      },
    });

    if (input.decision === "active") {
      await markAgentReferralMilestone(proposal.agent_id);
    }

    return { ok: true as const };
  } catch (error) {
    logServerDataError("agent_proposal_review_unhandled_error", error);
    return { ok: false as const, reason: "save_failed" as const };
  }
}
