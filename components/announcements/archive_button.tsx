"use client";

import { useFormStatus } from "react-dom";
import { archive_advisory_action, restore_advisory_action } from "@/app/dashboard/advisories/actions";

function Submit({ label, aria_label }: { label: string; aria_label: string }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            aria-label={aria_label}
            className="h-9 rounded-[10px] border-[0.8px] border-agap-line bg-white px-4 text-[11px] font-semibold text-agap-ink outline-none transition hover:border-agap-700 hover:text-agap-700 focus-visible:ring-2 focus-visible:ring-agap-700/30 disabled:cursor-not-allowed disabled:opacity-70"
        >
            {pending ? "Saving…" : label}
        </button>
    );
}

// Archives a published or cancelled notice, or restores an archived one.
export function Archive_button({ advisory_id, title, is_archived }: { advisory_id: string; title: string; is_archived: boolean }) {
    return (
        <form action={is_archived ? restore_advisory_action : archive_advisory_action} className="flex">
            <input type="hidden" name="advisory_id" value={advisory_id} />
            <Submit label={is_archived ? "Restore" : "Archive"} aria_label={`${is_archived ? "Restore" : "Archive"} ${title}`} />
        </form>
    );
}
