import { createNotificationEvent } from "@/entities/notification";
import { markAgentReferralMilestone } from "@/entities/referral";
import { canUseSupabase, createSupabaseAdminClient } from "@/shared/api/supabase/server";
import { createSupabaseServerClient, getCurrentAuthProfile } from "@/shared/api/supabase/server-auth";
import type {
  SupabaseAgentPropertyLinkRow,
  SupabaseAgentRoomLinkRow,
} from "@/shared/api/supabase/types";
import type { AgentCollaborationTargetType } from "@/entities/collaboration/model/types";

import { getAccessibleRoomForAgent, resolveProposalTarget } from "./collaboration-access";
import { normalizeMarkupPercent } from "./collaboration-formatters";

export async function upsertAgentRoomMarkup(input: { roomId: string; markupPercent: number }) {
  if (!canUseSupabase()) {
    return { ok: true as const };
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

  const markupPercent = normalizeMarkupPercent(input.markupPercent);
  const supabase = await createSupabaseServerClient();

  if (markupPercent === 0) {
    const { error } = await supabase
      .from("room_agent_markups")
      .delete()
      .eq("room_id", input.roomId)
      .eq("agent_id", profile.id);

    if (error) {
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
    return { ok: true as const };
  }

  const profile = await getCurrentAuthProfile();

  if (!profile) {
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
    const payload = {
      owner_id: target.ownerId,
      agent_id: profile.id,
      status: "pending",
      proposal_message: input.message.trim() || null,
      proposed_at: new Date().toISOString(),
      decided_at: null,
      owner_contact_visible: false,
    };

    if (target.targetType === "property") {
      const { data: existingData } = await supabase
        .from("agent_property_links")
        .select("*")
        .eq("property_id", target.targetId)
        .eq("agent_id", profile.id)
        .maybeSingle();
      const existing = existingData as SupabaseAgentPropertyLinkRow | null;

      if (existing?.status === "pending" || existing?.status === "active") {
        return { ok: false as const, reason: "duplicate" as const };
      }

      const { error } = existing
        ? await supabase.from("agent_property_links").update({ ...payload, property_id: target.targetId }).eq("id", existing.id)
        : await supabase.from("agent_property_links").insert({ ...payload, property_id: target.targetId });

      if (error) {
        return { ok: false as const, reason: "save_failed" as const };
      }
    } else {
      const { data: existingData } = await supabase
        .from("agent_room_links")
        .select("*")
        .eq("room_id", target.targetId)
        .eq("agent_id", profile.id)
        .maybeSingle();
      const existing = existingData as SupabaseAgentRoomLinkRow | null;

      if (existing?.status === "pending" || existing?.status === "active") {
        return { ok: false as const, reason: "duplicate" as const };
      }

      const { error } = existing
        ? await supabase.from("agent_room_links").update({ ...payload, room_id: target.targetId }).eq("id", existing.id)
        : await supabase.from("agent_room_links").insert({ ...payload, room_id: target.targetId });

      if (error) {
        return { ok: false as const, reason: "save_failed" as const };
      }
    }

    await createNotificationEvent({
      recipientId: target.ownerId,
      eventType: "agent_proposal_received",
      payload: {
        propertyId: target.targetType === "property" ? target.targetId : undefined,
        propertyTitle: target.targetType === "property" ? target.title : undefined,
        roomTitle: target.targetType === "standalone_room" ? target.title : undefined,
        linkPath: "/dashboard/agent-proposals",
      },
    });

    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "save_failed" as const };
  }
}

export async function reviewAgentProposal(input: {
  proposalId: string;
  targetType: AgentCollaborationTargetType;
  decision: "active" | "declined";
}) {
  if (!canUseSupabase()) {
    return { ok: true as const };
  }

  const profile = await getCurrentAuthProfile();

  if (!profile || !input.proposalId) {
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
      const proposal = proposalData as SupabaseAgentPropertyLinkRow | null;

      if (!proposal || proposal.owner_id !== profile.id || proposal.status !== "pending") {
        return { ok: false as const, reason: "not_found" as const };
      }

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
          decided_at: new Date().toISOString(),
          owner_contact_visible: ownerContactVisible,
          collaboration_terms: proposal.collaboration_terms ?? proposal.proposal_message,
        })
        .eq("id", proposal.id);

      if (error) {
        return { ok: false as const, reason: "save_failed" as const };
      }

      const { data: propertyDetails } = await supabase.from("properties").select("title").eq("id", proposal.property_id).maybeSingle();

      await createNotificationEvent({
        recipientId: proposal.agent_id,
        eventType: input.decision === "active" ? "agent_proposal_accepted" : "agent_proposal_rejected",
        payload: {
          proposalId: proposal.id,
          propertyId: proposal.property_id,
          propertyTitle: (propertyDetails?.title as string | null) ?? undefined,
          linkPath: input.decision === "active" ? "/agent/dashboard/collaborations" : "/agent/dashboard/opportunities",
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
    const proposal = proposalData as SupabaseAgentRoomLinkRow | null;

    if (!proposal || proposal.owner_id !== profile.id || proposal.status !== "pending") {
      return { ok: false as const, reason: "not_found" as const };
    }

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
        decided_at: new Date().toISOString(),
        owner_contact_visible: ownerContactVisible,
        collaboration_terms: proposal.collaboration_terms ?? proposal.proposal_message,
      })
      .eq("id", proposal.id);

    if (error) {
      return { ok: false as const, reason: "save_failed" as const };
    }

    const { data: roomDetails } = await supabase.from("rooms").select("title").eq("id", proposal.room_id).maybeSingle();

    await createNotificationEvent({
      recipientId: proposal.agent_id,
      eventType: input.decision === "active" ? "agent_proposal_accepted" : "agent_proposal_rejected",
      payload: {
        proposalId: proposal.id,
        roomTitle: (roomDetails?.title as string | null) ?? undefined,
        linkPath: input.decision === "active" ? "/agent/dashboard/collaborations" : "/agent/dashboard/opportunities",
      },
    });

    if (input.decision === "active") {
      await markAgentReferralMilestone(proposal.agent_id);
    }

    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "save_failed" as const };
  }
}
