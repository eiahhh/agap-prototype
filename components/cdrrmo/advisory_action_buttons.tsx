"use client";

import { useFormStatus } from "react-dom";
import { cancel_advisory_action, publish_advisory_action } from "@/app/dashboard/advisories/actions";
import { submit_for_review_action } from "@/app/dashboard/reviews/actions";
import { primary_button_class } from "@/components/auth/form_styles";
import type { review_state } from "@/lib/cdrrmo/advisories";

const secondary_button_class =
    "h-9 rounded-[10px] border-[0.8px] border-agap-line bg-white px-4 text-[11px] font-semibold text-agap-ink outline-none transition focus-visible:ring-2 focus-visible:ring-agap-700/30 disabled:cursor-not-allowed disabled:opacity-70";

// Rendered inside the advisory's <form>. All buttons are disabled while one is submitting,
// so an advisory can't be published and cancelled at the same time.
// Publishing needs approval: until then the main button submits the notice for review.
export function Advisory_action_buttons({ title, review_state }: { title: string; review_state?: review_state }) {
    const { pending } = useFormStatus();

    return (
        <div className="flex flex-wrap items-center gap-2">
            <button
                type="submit"
                formAction={cancel_advisory_action}
                disabled={pending}
                aria-label={`Cancel ${title}`}
                className={`${secondary_button_class} hover:border-red-600 hover:text-red-700`}
            >
                Cancel
            </button>
            {review_state === "approved" ? (
                <button
                    type="submit"
                    formAction={publish_advisory_action}
                    disabled={pending}
                    aria-label={`Publish ${title} now`}
                    className={`h-9 text-[11px] ${primary_button_class}`}
                >
                    Publish now
                </button>
            ) : review_state === "in_review" ? (
                <span className="px-1 text-[11px] font-medium text-agap-muted">Waiting for approval</span>
            ) : (
                <button
                    type="submit"
                    formAction={submit_for_review_action}
                    disabled={pending}
                    aria-label={`Submit ${title} for review`}
                    className={`h-9 text-[11px] ${primary_button_class}`}
                >
                    {review_state === "changes_requested" ? "Resubmit for review" : "Submit for review"}
                </button>
            )}
        </div>
    );
}
