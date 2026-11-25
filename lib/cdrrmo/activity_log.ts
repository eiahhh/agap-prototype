// Every recorded step across all notices, newest first: who did what, and when.

import type { advisory } from "./advisories";
import { announcement_history } from "./announcement_history";

export type activity_entry = {
    at: number;
    action: string; // e.g. "Published", "Approved"
    by?: string; // officer name, when known
    detail?: string;
    advisory_id: string;
    advisory_title: string;
};

export function activity_log(items: readonly advisory[]): activity_entry[] {
    return items
        .flatMap((item) =>
            announcement_history(item).map((entry) => ({
                at: entry.at,
                action: entry.label,
                by: entry.by,
                detail: entry.detail,
                advisory_id: item.id,
                advisory_title: item.title,
            })),
        )
        .sort((first, second) => second.at - first.at);
}

// The actions that can be filtered on, in the order a notice goes through them.
export const activity_actions = [
    "Drafted",
    "Submitted for review",
    "Approved",
    "Changes requested",
    "Published",
    "Updated and re-sent",
    "Cancelled",
    "Archived",
] as const;

export function parse_activity_action(value: string | string[] | undefined): string | null {
    const action = Array.isArray(value) ? value[0] : value;
    return (activity_actions as readonly string[]).includes(action ?? "") ? action! : null;
}
