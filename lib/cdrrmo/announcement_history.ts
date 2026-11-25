// The timeline shown on an announcement's page.

import { find_user_by_id } from "@/lib/auth/demo_users";
import type { advisory } from "./advisories";

export type history_entry = { at: number; label: string; by?: string; detail?: string };

// Newest first.
export function announcement_history(item: advisory): history_entry[] {
    const name = (user_id?: string) => (user_id ? (find_user_by_id(user_id)?.name ?? "Unknown user") : undefined);
    const entries: history_entry[] = [{ at: item.created_at, label: "Drafted" }];
    if (item.published_at !== undefined) entries.push({ at: item.published_at, label: "Published" });
    for (const revision of item.revisions ?? []) {
        entries.push({
            at: revision.at,
            label: "Updated and re-sent",
            by: name(revision.by),
            detail: `${revision.note} (was “${revision.previous.title}”)`,
        });
    }
    if (item.cancelled_at !== undefined) entries.push({ at: item.cancelled_at, label: "Cancelled", by: name(item.updated_by) });
    return entries.sort((first, second) => second.at - first.at);
}
