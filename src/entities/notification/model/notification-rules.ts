export const NOTIFICATION_EVENT_TYPES = [
  "new_request",
  "request_transferred_to_owner",
  "request_completion_requested",
  "agent_proposal_received",
  "agent_proposal_accepted",
  "agent_proposal_rejected",
  "subscription_reminder",
  "subscription_status_changed",
] as const;

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];
export type NotificationChannel = "push" | "telegram";
export type NotificationRoleContext = "owner" | "agent";

const ALL_EXTERNAL_CHANNELS = ["push", "telegram"] as const satisfies readonly NotificationChannel[];

export function getNotificationDeliveryChannels(_eventType: NotificationEventType): readonly NotificationChannel[] {
  return ALL_EXTERNAL_CHANNELS;
}

export function getNotificationDestinationPath(
  eventType: NotificationEventType,
  roleContext: NotificationRoleContext = "owner",
  storedPath?: string | null,
) {
  switch (eventType) {
    case "new_request":
      return roleContext === "agent" || storedPath === "/agent/dashboard/requests"
        ? "/agent/dashboard/requests"
        : "/dashboard/requests";
    case "request_transferred_to_owner":
    case "request_completion_requested":
      return "/dashboard/requests";
    case "agent_proposal_received":
      return "/dashboard/agent-proposals";
    case "agent_proposal_accepted":
      return "/agent/dashboard/collaborations";
    case "agent_proposal_rejected":
      return "/agent/dashboard/opportunities";
    case "subscription_reminder":
    case "subscription_status_changed":
      return roleContext === "agent" || storedPath === "/agent/dashboard/subscription"
        ? "/agent/dashboard/subscription"
        : "/dashboard/subscription";
  }
}

export function buildNotificationIdempotencyKey(input: {
  eventType: NotificationEventType;
  sourceId: string;
  occurrence?: string | null;
}) {
  const sourceId = input.sourceId.trim();
  const occurrence = input.occurrence?.trim();

  if (!sourceId) {
    throw new Error("Notification source identifier is required.");
  }

  return [input.eventType, sourceId, occurrence].filter(Boolean).join(":");
}

export type NotificationChannelResult = {
  channel: NotificationChannel;
  status: "fulfilled" | "rejected";
  reason?: unknown;
};

export async function settleNotificationFanOut(
  channels: readonly NotificationChannel[],
  deliver: (channel: NotificationChannel) => Promise<void>,
): Promise<NotificationChannelResult[]> {
  return Promise.all(
    channels.map(async (channel) => {
      try {
        await deliver(channel);
        return { channel, status: "fulfilled" as const };
      } catch (reason) {
        return { channel, status: "rejected" as const, reason };
      }
    }),
  );
}
