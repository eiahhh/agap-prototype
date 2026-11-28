// Tabs for the Review & Approval page, from the signed-in officer's point of view.

import { is_pending, type advisory } from "./advisories";

export const review_tabs = ["to_review", "mine", "approved"] as const;
export type review_tab = (typeof review_tabs)[number];

export const review_tab_labels: Record<review_tab, string> = {
    to_review: "Needs my review",
    mine: "My submissions",
    approved: "Approved",
};

export function parse_review_tab(value: string | string[] | undefined): review_tab {
    const tab = Array.isArray(value) ? value[0] : value;
    return (review_tabs as readonly string[]).includes(tab ?? "") ? (tab as review_tab) : "to_review";
}

function in_tab(item: advisory, tab: review_tab, user_id: string): boolean {
    if (!is_pending(item) || !item.review) return false;
    if (tab === "to_review") return item.review.state === "in_review" && item.review.submitted_by !== user_id;
    if (tab === "mine") return item.review.submitted_by === user_id;
    return item.review.state === "approved";
}

// Oldest submission first, so nothing waits longer than it has to.
export function review_queue(items: readonly advisory[], tab: review_tab, user_id: string): advisory[] {
    return items
        .filter((item) => in_tab(item, tab, user_id))
        .sort((first, second) => first.review!.submitted_at - second.review!.submitted_at);
}

export function count_review_tabs(items: readonly advisory[], user_id: string): Record<review_tab, number> {
    return {
        to_review: review_queue(items, "to_review", user_id).length,
        mine: review_queue(items, "mine", user_id).length,
        approved: review_queue(items, "approved", user_id).length,
    };
}
