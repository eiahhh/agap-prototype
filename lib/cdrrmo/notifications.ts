// PROTOTYPE ONLY: the CDRRMO inbox is kept in server memory and resets on restart.
// Every CDRRMO officer sees the same notifications, but read state is tracked per officer.
// Replace with a database table before production.

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
    href?: string; // the page the notification is about
    actor_id?: string; // the officer whose action caused it; it starts as read for them
    read_by: Record<string, number>; // user id → when they read it
    dismissed_by?: Record<string, number>; // user id → when they cleared it from their inbox
};

// A notification as one officer sees it.
export type notification_view = Omit<inbox_notification, "read_by" | "dismissed_by"> & { is_read: boolean; is_dismissed: boolean };

const notifications: inbox_notification[] = [];

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;

// Both demo officers start with the same notifications read.
function read_by_all(at: number): Record<string, number> {
    return { u_cdrrmo: at, u_cdrrmo_head: at };
}

function seed(now: number) {
    const samples: Array<Omit<inbox_notification, "id">> = [
        {
            kind: "weather",
            title: "PAGASA raised a Yellow Rainfall Warning",
            body: "Moderate to heavy rain over Cavite in the next 3 hours. Flooding is possible in low-lying areas.",
            created_at: now - 12 * minute,
            href: "/dashboard/weather",
            read_by: {},
        },
        {
            kind: "advisory",
            title: "Advisory scheduled for publishing",
            body: "“Suspension of classes due to heavy rainfall” goes out in 45 minutes unless edited or cancelled.",
            created_at: now - 50 * minute,
            href: "/dashboard/announcements?tab=scheduled",
            read_by: {},
        },
        {
            kind: "delivery",
            title: "Facebook post failed",
            body: "The Sampaloc IV advisory could not be posted to the CDRRMO Facebook page. Post it manually.",
            created_at: now - 2 * hour + 2 * minute,
            href: "/dashboard/announcements?tab=published&q=Sampaloc",
            read_by: {},
        },
        {
            kind: "system",
            title: "SMS gateway maintenance tonight",
            body: "SMS blasts may be delayed from 11:00 PM to 1:00 AM.",
            created_at: now - 6 * hour,
            read_by: read_by_all(now - 5 * hour),
        },
        {
            kind: "weather",
            title: "Wind Signal No. 1 lifted over Cavite",
            body: "PAGASA has lifted Tropical Cyclone Wind Signal No. 1. Classes may resume.",
            created_at: now - 27 * hour,
            href: "/dashboard/weather",
            read_by: read_by_all(now - 26 * hour),
        },
        {
            kind: "delivery",
            title: "SMS blast completed",
            body: "48,500 recipients received yesterday's suspension notice.",
            created_at: now - 30 * hour,
            read_by: read_by_all(now - 29 * hour),
        },
        {
            kind: "weather",
            title: "PAGASA raised a Red Rainfall Warning",
            body: "Torrential rain over Cavite. Serious flooding expected in low-lying areas.",
            created_at: now - 2 * day - 3 * hour,
            href: "/dashboard/weather?range=7#history",
            read_by: read_by_all(now - 2 * day - 2 * hour),
        },
        {
            kind: "system",
            title: "New CDRRMO account approved",
            body: "CDRRMO Head can now sign in and review notices.",
            created_at: now - 4 * day,
            read_by: read_by_all(now - 4 * day + hour),
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

function view(item: inbox_notification, user_id: string): notification_view {
    const { read_by, dismissed_by, ...rest } = item;
    return { ...rest, is_read: read_by[user_id] !== undefined, is_dismissed: dismissed_by?.[user_id] !== undefined };
}

export type notification_filter = {
    kind?: notification_kind;
    unread_only?: boolean;
    dismissed?: boolean; // true lists only cleared notifications; otherwise they're left out
    limit?: number;
};

// Newest first, as the given officer sees them.
export function list_notifications(user_id: string, filter: notification_filter = {}): notification_view[] {
    const items = [...notifications]
        .sort((first, second) => second.created_at - first.created_at)
        .map((item) => view(item, user_id))
        .filter(
            (item) =>
                item.is_dismissed === (filter.dismissed ?? false) &&
                (filter.kind ? item.kind === filter.kind : true) &&
                (filter.unread_only ? !item.is_read : true),
        );
    return filter.limit === undefined ? items : items.slice(0, filter.limit);
}

export function count_unread_notifications(user_id: string): number {
    return notifications.filter((item) => item.read_by[user_id] === undefined && item.dismissed_by?.[user_id] === undefined).length;
}

export function add_notification(
    input: Pick<inbox_notification, "kind" | "title" | "body"> & { href?: string; actor_id?: string },
    now: number = Date.now(),
): inbox_notification {
    const item: inbox_notification = {
        ...input,
        id: randomUUID(),
        created_at: now,
        read_by: input.actor_id ? { [input.actor_id]: now } : {},
    };
    notifications.push(item);
    return item;
}

// Returns false when the id is unknown or the officer already read it.
export function mark_notification_read(id: string, user_id: string, now: number = Date.now()): boolean {
    const item = notifications.find((candidate) => candidate.id === id);
    if (!item || item.read_by[user_id] !== undefined) return false;
    item.read_by[user_id] = now;
    return true;
}

// Returns false when the id is unknown or the officer hasn't read it.
export function mark_notification_unread(id: string, user_id: string): boolean {
    const item = notifications.find((candidate) => candidate.id === id);
    if (!item || item.read_by[user_id] === undefined) return false;
    delete item.read_by[user_id];
    return true;
}

// Returns how many notifications were newly marked as read for this officer.
export function mark_all_notifications_read(user_id: string, now: number = Date.now()): number {
    let marked = 0;
    for (const item of notifications) {
        if (item.read_by[user_id] === undefined) {
            item.read_by[user_id] = now;
            marked += 1;
        }
    }
    return marked;
}

// Clears a notification from this officer's inbox. Clearing also marks it as read.
export function dismiss_notification(id: string, user_id: string, now: number = Date.now()): boolean {
    const item = notifications.find((candidate) => candidate.id === id);
    if (!item || item.dismissed_by?.[user_id] !== undefined) return false;
    item.dismissed_by = { ...item.dismissed_by, [user_id]: now };
    item.read_by[user_id] ??= now;
    return true;
}

// Puts a cleared notification back in this officer's inbox.
export function restore_notification(id: string, user_id: string): boolean {
    const item = notifications.find((candidate) => candidate.id === id);
    if (!item || item.dismissed_by?.[user_id] === undefined) return false;
    delete item.dismissed_by[user_id];
    return true;
}

// Clears every notification this officer has already read. Returns how many were cleared.
export function clear_read_notifications(user_id: string, now: number = Date.now()): number {
    let cleared = 0;
    for (const item of notifications) {
        if (item.read_by[user_id] !== undefined && item.dismissed_by?.[user_id] === undefined) {
            item.dismissed_by = { ...item.dismissed_by, [user_id]: now };
            cleared += 1;
        }
    }
    return cleared;
}
