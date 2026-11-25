"use client";

import { useFormStatus } from "react-dom";
import { mark_notification_read_action, mark_notification_unread_action } from "@/app/dashboard/notifications/actions";

function Submit({ label, aria_label }: { label: string; aria_label: string }) {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            aria-label={aria_label}
            className="text-[10px] font-semibold leading-[15px] text-agap-700 underline outline-none hover:text-agap-900 focus-visible:ring-2 focus-visible:ring-agap-700/30 disabled:opacity-60"
        >
            {label}
        </button>
    );
}

// Marks one notification as read, or back to unread, for the signed-in officer.
export function Read_toggle({ notification_id, title, is_read }: { notification_id: string; title: string; is_read: boolean }) {
    return (
        <form action={is_read ? mark_notification_unread_action : mark_notification_read_action}>
            <input type="hidden" name="notification_id" value={notification_id} />
            <Submit
                label={is_read ? "Mark as unread" : "Mark as read"}
                aria_label={`Mark “${title}” as ${is_read ? "unread" : "read"}`}
            />
        </form>
    );
}
