"use client";

import { useFormStatus } from "react-dom";
import { cancel_advisory_action, publish_advisory_action } from "@/app/dashboard/advisories/actions";
import { primary_button_class } from "@/components/auth/form_styles";

// Rendered inside the advisory's <form>. Both buttons are disabled while either one is submitting,
// so an advisory can't be published and cancelled at the same time.
export function Advisory_action_buttons({ title }: { title: string }) {
    const { pending } = useFormStatus();

    return (
        <div className="flex gap-2">
            <button
                type="submit"
                formAction={cancel_advisory_action}
                disabled={pending}
                aria-label={`Cancel ${title}`}
                className="h-9 rounded-[10px] border-[0.8px] border-agap-line bg-white px-4 text-[11px] font-semibold text-agap-ink outline-none transition hover:border-red-600 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-agap-700/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
                Cancel
            </button>
            <button
                type="submit"
                formAction={publish_advisory_action}
                disabled={pending}
                aria-label={`Publish ${title} now`}
                className={`h-9 text-[11px] ${primary_button_class}`}
            >
                Publish now
            </button>
        </div>
    );
}
