// Filters and day grouping for the Notifications page.

import { notification_kinds, type notification_kind, type notification_view } from "./notifications";
import { manila_date } from "./weather_history";

// cleared: show the notifications the officer cleared from their inbox instead of the inbox itself.
export type notification_page_filter = { kind: notification_kind | null; unread_only: boolean; cleared: boolean };

export function parse_notification_filter(params: Record<string, string | string[] | undefined>): notification_page_filter {
    const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
    const kind = first(params.kind);
    return {
        kind: (notification_kinds as readonly string[]).includes(kind ?? "") ? (kind as notification_kind) : null,
        unread_only: first(params.unread) === "1",
        cleared: first(params.cleared) === "1",
    };
}

export function notification_page_href(filter: notification_page_filter): string {
    const params = new URLSearchParams();
    if (filter.kind) params.set("kind", filter.kind);
    if (filter.unread_only) params.set("unread", "1");
    if (filter.cleared) params.set("cleared", "1");
    const search = params.toString();
    return search ? `/dashboard/notifications?${search}` : "/dashboard/notifications";
}

export type notification_day = { date: string; label: string; items: notification_view[] };

const day_label = new Intl.DateTimeFormat("en-PH", { weekday: "long", month: "short", day: "numeric", timeZone: "Asia/Manila" });

// Groups newest-first notifications by Manila date: Today, Yesterday, then the date.
export function group_by_day(items: notification_view[], now: number): notification_day[] {
    const today = manila_date(now);
    const yesterday = manila_date(now - 86_400_000);
    const days: notification_day[] = [];

    for (const item of items) {
        const date = manila_date(item.created_at);
        let group = days.at(-1);
        if (!group || group.date !== date) {
            const label = date === today ? "Today" : date === yesterday ? "Yesterday" : day_label.format(item.created_at);
            group = { date, label, items: [] };
            days.push(group);
        }
        group.items.push(item);
    }
    return days;
}
