"use server";

import { refresh } from "next/cache";
import { require_cdrrmo } from "@/lib/auth/current_user";
import { decide_review, find_advisory, submit_for_review } from "@/lib/cdrrmo/advisories";
import { add_notification } from "@/lib/cdrrmo/notifications";

export type review_form_state = { error?: string; decided?: "approved" | "changes_requested" };

const comment_max_length = 500;

const decision_errors = {
    not_found: "This notice doesn't exist.",
    not_in_review: "This notice is no longer waiting for review.",
    own_submission: "You submitted this notice, so another officer has to review it.",
    comment_required: "Say what needs to change before sending it back.",
} as const;

// Actions can be called directly with a POST, so each one checks the role again.
export async function submit_for_review_action(form_data: FormData) {
    const user = await require_cdrrmo();
    const advisory_id = String(form_data.get("advisory_id") ?? "");
    if (!advisory_id) return;

    if (submit_for_review(advisory_id, user.id)) {
        add_notification({
            kind: "advisory",
            title: "Review requested",
            body: `${user.name} submitted “${find_advisory(advisory_id)!.title}” for approval.`,
        });
    }
    refresh();
}

export async function decide_review_action(_previous_state: review_form_state, form_data: FormData): Promise<review_form_state> {
    const user = await require_cdrrmo();
    const advisory_id = String(form_data.get("advisory_id") ?? "");
    const decision = form_data.get("decision") === "approved" ? "approved" : "changes_requested";
    const comment = String(form_data.get("comment") ?? "").trim().replace(/\s+/g, " ");
    if (comment.length > comment_max_length) return { error: "Use 500 characters or fewer." };

    const result = decide_review(advisory_id, decision, user.id, comment);
    if (result !== "ok") return { error: decision_errors[result] };

    const title = find_advisory(advisory_id)!.title;
    add_notification(
        decision === "approved"
            ? { kind: "advisory", title: "Notice approved", body: `${user.name} approved “${title}”. It can now be published.` }
            : { kind: "advisory", title: "Changes requested", body: `${user.name} sent back “${title}”: ${comment}` },
    );
    refresh();
    return { decided: decision };
}
