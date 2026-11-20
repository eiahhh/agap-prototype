"use client";

import { useFormStatus } from "react-dom";
import { approve_request, reject_request } from "@/app/dashboard/requests/actions";
import { primary_button_class } from "@/components/auth/form_styles";

// Rendered inside the request's <form>. Both buttons are disabled while either one is submitting,
// so a request can't be approved and rejected at the same time.
export function Review_buttons({ full_name }: { full_name: string }) {
    const { pending } = useFormStatus();

    return (
        <div className="flex gap-2">
            <button
                type="submit"
                formAction={reject_request}
                disabled={pending}
                aria-label={`Reject request from ${full_name}`}
                className="h-9 rounded-[10px] border-[0.8px] border-agap-line bg-white px-4 text-[11px] font-semibold text-agap-ink outline-none transition hover:border-red-600 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-agap-700/30 disabled:cursor-not-allowed disabled:opacity-70"
            >
                Reject
            </button>
            <button
                type="submit"
                formAction={approve_request}
                disabled={pending}
                aria-label={`Approve request from ${full_name}`}
                className={`h-9 text-[11px] ${primary_button_class}`}
            >
                Approve
            </button>
        </div>
    );
}
