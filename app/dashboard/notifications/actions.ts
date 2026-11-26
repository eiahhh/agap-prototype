"use server";

import { refresh } from "next/cache";
import { require_cdrrmo } from "@/lib/auth/current_user";
import { mark_all_notifications_read, mark_notification_read } from "@/lib/cdrrmo/notifications";

// Actions can be called directly with a POST, so each one checks the role again.
export async function mark_notification_read_action(form_data: FormData) {
    await require_cdrrmo();
    const notification_id = String(form_data.get("notification_id") ?? "");
    if (!notification_id) return;

    mark_notification_read(notification_id);
    refresh();
}

export async function mark_all_notifications_read_action() {
    await require_cdrrmo();
    mark_all_notifications_read();
    refresh();
}
