"use client";

import { useActionState } from "react";
import { decide_review_action, type review_form_state } from "@/app/dashboard/reviews/actions";
import { error_text_class, input_field_class, label_class, primary_button_class } from "@/components/auth/form_styles";

const initial_state: review_form_state = {};

// Approve, or send back with a comment. The comment is optional when approving.
export function Review_decision_form({ advisory_id, title }: { advisory_id: string; title: string }) {
    const [state, form_action, is_saving] = useActionState(decide_review_action, initial_state);
    const comment_id = `comment-${advisory_id}`;

    return (
        <form action={form_action} className="mt-4 border-t-[0.8px] border-agap-line pt-4">
            <input type="hidden" name="advisory_id" value={advisory_id} />
            <label htmlFor={comment_id} className={`block ${label_class}`}>
                Comment
            </label>
            <textarea
                id={comment_id}
                name="comment"
                rows={2}
                placeholder="Optional when approving. Required when requesting changes."
                aria-invalid={state.error ? true : undefined}
                aria-describedby={state.error ? `${comment_id}-error` : undefined}
                className={`mt-1.5 ${input_field_class} h-auto py-2.5 leading-[18px]`}
            />
            {state.error && (
                <p id={`${comment_id}-error`} role="alert" className={error_text_class}>
                    {state.error}
                </p>
            )}
            <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button
                    type="submit"
                    name="decision"
                    value="changes_requested"
                    disabled={is_saving}
                    aria-label={`Request changes to ${title}`}
                    className="h-9 rounded-[10px] border-[0.8px] border-agap-line bg-white px-4 text-[11px] font-semibold text-agap-ink outline-none transition hover:border-orange-600 hover:text-orange-800 focus-visible:ring-2 focus-visible:ring-agap-700/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    Request changes
                </button>
                <button
                    type="submit"
                    name="decision"
                    value="approved"
                    disabled={is_saving}
                    aria-label={`Approve ${title}`}
                    className={`h-9 text-[11px] ${primary_button_class}`}
                >
                    Approve
                </button>
            </div>
        </form>
    );
}
