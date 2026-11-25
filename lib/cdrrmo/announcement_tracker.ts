// PROTOTYPE ONLY: delivery progress is simulated from the time since publishing.
// Replace with real delivery receipts from the SMS gateway, Facebook and email providers before production.

import type { advisory } from "./advisories";

export const delivery_channels = ["portal", "sms", "facebook", "school_email"] as const;
export type delivery_channel = (typeof delivery_channels)[number];

export const delivery_channel_labels: Record<delivery_channel, string> = {
    portal: "AGAP portal",
    sms: "SMS blast",
    facebook: "Facebook page",
    school_email: "School email",
};

export type delivery_state = "delivered" | "sending" | "failed";

export type channel_delivery = {
    channel: delivery_channel;
    state: delivery_state;
    sent: number;
    total: number;
};

export type announcement_status = "delivered" | "delivering" | "partially_failed" | "cancelled";

export const announcement_status_labels: Record<announcement_status, string> = {
    delivered: "Delivered",
    delivering: "Delivering",
    partially_failed: "Partially failed",
    cancelled: "Cancelled",
};

export type tracked_announcement = {
    advisory: advisory;
    status: announcement_status;
    happened_at: number; // published_at or cancelled_at
    deliveries: channel_delivery[]; // empty for cancelled advisories
};

const minute = 60_000;

// Recipients per channel, and how long each channel takes to finish.
const channel_plan: Record<delivery_channel, { total: number; duration_ms: number }> = {
    portal: { total: 1, duration_ms: 0 },
    facebook: { total: 1, duration_ms: 1 * minute },
    school_email: { total: 214, duration_ms: 5 * minute },
    sms: { total: 48_500, duration_ms: 15 * minute },
};

export function channel_deliveries(item: advisory, now: number = Date.now()): channel_delivery[] {
    if (item.status !== "published" || item.published_at === undefined) return [];
    // An update re-sends the notice, so progress restarts from the latest send.
    const elapsed = Math.max(0, now - (item.last_sent_at ?? item.published_at));

    return delivery_channels.map((channel) => {
        const { total, duration_ms } = channel_plan[channel];
        if (item.failed_channels?.includes(channel)) return { channel, state: "failed", sent: 0, total };

        const progress = duration_ms === 0 ? 1 : Math.min(1, elapsed / duration_ms);
        const sent = Math.floor(total * progress);
        return { channel, state: sent >= total ? "delivered" : "sending", sent, total };
    });
}

export function announcement_status(item: advisory, deliveries: channel_delivery[]): announcement_status {
    if (item.status === "cancelled") return "cancelled";
    if (deliveries.some((delivery) => delivery.state === "failed")) return "partially_failed";
    if (deliveries.some((delivery) => delivery.state === "sending")) return "delivering";
    return "delivered";
}

// Published and cancelled advisories that aren't archived, newest first.
export function track_recent_announcements(
    items: readonly advisory[],
    now: number = Date.now(),
    limit = 5,
): tracked_announcement[] {
    return items
        .filter((item) => (item.status === "published" || item.status === "cancelled") && item.archived_at === undefined)
        .map((item) => {
            const deliveries = channel_deliveries(item, now);
            return {
                advisory: item,
                status: announcement_status(item, deliveries),
                happened_at: (item.status === "published" ? item.published_at : item.cancelled_at) ?? item.updated_at,
                deliveries,
            };
        })
        .sort((first, second) => second.happened_at - first.happened_at)
        .slice(0, limit);
}
