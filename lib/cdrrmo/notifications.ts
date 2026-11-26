// PROTOTYPE ONLY: the CDRRMO inbox is kept in server memory and resets on restart.
// It is shared by everyone with the CDRRMO role. Replace with a per-user table before production.

import { randomUUID } from "node:crypto";

export const notification_kinds = ["weather", "advisory", "delivery", "system"] as const;
export type notification_kind = (typeof notification_kinds)[number];

export const notification_kind_labels: Record<notification_kind, string> = {
    weather: "Weather alert",
    advisory: "Advisory",
    delivery: "Delivery",
    system: "System",
};

export type inbox_notification = {
    id: string;
    kind: notification_kind;
    title: string;
    body: string;
    created_at: number;
    read_at?: number;
};

const notifications: inbox_notification[] = [];

const minute = 60_000;
const hour = 60 * minute;

function seed(now: number) {
    const samples: Array<Omit<inbox_notification, "id">> = [
        {
            kind: "weather",
            title: "PAGASA raised a Yellow Rainfall Warning",
            body: "Moderate to heavy rain over Cavite in the next 3 hours. Flooding is possible in low-lying areas.",
            created_at: now - 12 * minute,
        },
        {
            kind: "advisory",
            title: "Advisory scheduled for publishing",
            body: "“Suspension of classes due to heavy rainfall” goes out in 45 minutes unless edited or cancelled.",
            created_at: now - 50 * minute,
        },
        {
            kind: "delivery",
            title: "Facebook post failed",
            body: "The Sampaloc IV advisory could not be posted to the CDRRMO Facebook page. Post it manually.",
            created_at: now - 2 * hour + 2 * minute,
        },
        {
            kind: "system",
            title: "SMS gateway maintenance tonight",
            body: "SMS blasts may be delayed from 11:00 PM to 1:00 AM.",
            created_at: now - 6 * hour,
            read_at: now - 5 * hour,
        },
        {
            kind: "weather",
            title: "Wind Signal No. 1 lifted over Cavite",
            body: "PAGASA has lifted Tropical Cyclone Wind Signal No. 1. Classes may resume.",
            created_at: now - 27 * hour,
            read_at: now - 26 * hour,
        },
    ];
    for (const sample of samples) notifications.push({ ...sample, id: randomUUID() });
}

// Puts the sample notifications back. Used on first load and by tests.
export function reset_notifications(now: number = Date.now()) {
    notifications.length = 0;
    seed(now);
}

reset_notifications();

// Newest first.
export function list_notifications(limit = 6): inbox_notification[] {
    return [...notifications].sort((first, second) => second.created_at - first.created_at).slice(0, limit);
}

export function count_unread_notifications(): number {
    return notifications.filter((item) => item.read_at === undefined).length;
}

export function add_notification(
    input: Pick<inbox_notification, "kind" | "title" | "body">,
    now: number = Date.now(),
): inbox_notification {
    const item: inbox_notification = { ...input, id: randomUUID(), created_at: now };
    notifications.push(item);
    return item;
}

// Returns false when the id is unknown or it was already read.
export function mark_notification_read(id: string, now: number = Date.now()): boolean {
    const item = notifications.find((candidate) => candidate.id === id);
    if (!item || item.read_at !== undefined) return false;
    item.read_at = now;
    return true;
}

// Returns how many notifications were newly marked as read.
export function mark_all_notifications_read(now: number = Date.now()): number {
    let marked = 0;
    for (const item of notifications) {
        if (item.read_at === undefined) {
            item.read_at = now;
            marked += 1;
        }
    }
    return marked;
}
