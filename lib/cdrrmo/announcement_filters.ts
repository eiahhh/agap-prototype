// Tabs and search for the announcement management page.

import type { advisory, advisory_status } from "./advisories";

export const announcement_tabs = ["all", "draft", "scheduled", "published", "cancelled"] as const;
export type announcement_tab = (typeof announcement_tabs)[number];

export const announcement_tab_labels: Record<announcement_tab, string> = {
    all: "All",
    draft: "Drafts",
    scheduled: "Scheduled",
    published: "Published",
    cancelled: "Cancelled",
};

export function parse_announcement_tab(value: string | string[] | undefined): announcement_tab {
    const tab = Array.isArray(value) ? value[0] : value;
    return (announcement_tabs as readonly string[]).includes(tab ?? "") ? (tab as announcement_tab) : "all";
}

export function parse_search_query(value: string | string[] | undefined): string {
    return (Array.isArray(value) ? value[0] : value ?? "").trim().slice(0, 100);
}

function in_tab(item: advisory, tab: announcement_tab): boolean {
    return tab === "all" || item.status === (tab as advisory_status);
}

function matches(item: advisory, query: string): boolean {
    if (!query) return true;
    const needle = query.toLowerCase();
    return [item.title, item.coverage, item.message].some((text) => text.toLowerCase().includes(needle));
}

// Scheduled notices sort by when they go out (soonest first); everything else by latest activity.
export function filter_announcements(items: readonly advisory[], tab: announcement_tab, query: string): advisory[] {
    return items
        .filter((item) => in_tab(item, tab) && matches(item, query))
        .sort((first, second) => {
            if (tab === "scheduled") return first.scheduled_for! - second.scheduled_for!;
            return second.updated_at - first.updated_at;
        });
}

export function count_by_tab(items: readonly advisory[], query: string): Record<announcement_tab, number> {
    const counts = Object.fromEntries(announcement_tabs.map((tab) => [tab, 0])) as Record<announcement_tab, number>;
    for (const item of items) {
        if (!matches(item, query)) continue;
        counts.all += 1;
        counts[item.status as announcement_tab] += 1;
    }
    return counts;
}
