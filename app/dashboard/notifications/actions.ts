"use server";

import { refresh } from "next/cache";
import { require_cdrrmo } from "@/lib/auth/current_user";
import {
    clear_read_notifications,
    dismiss_notification,
    mark_all_notifications_read,
    mark_notification_read,
    mark_notification_unread,
    restore_notification,
} from "@/lib/cdrrmo/notifications";

// Actions can be called directly with a POST, so each one checks the role again.
// Read state is per officer, so each action only changes it for the signed-in officer.
export async function mark_notification_read_action(form_data: FormData) {
    const user = await require_cdrrmo();
    const notification_id = String(form_data.get("notification_id") ?? "");
    if (!notification_id) return;

    mark_notification_read(notification_id, user.id);
    refresh();
}

export async function mark_notification_unread_action(form_data: FormData) {
    const user = await require_cdrrmo();
    const notification_id = String(form_data.get("notification_id") ?? "");
    if (!notification_id) return;

    mark_notification_unread(notification_id, user.id);
    refresh();
}

export async function mark_all_notifications_read_action() {
    const user = await require_cdrrmo();
    mark_all_notifications_read(user.id);
    refresh();
}

export async function dismiss_notification_action(form_data: FormData) {
    const user = await require_cdrrmo();
    const notification_id = String(form_data.get("notification_id") ?? "");
    if (!notification_id) return;

    dismiss_notification(notification_id, user.id);
    refresh();
}

export async function restore_notification_action(form_data: FormData) {
    const user = await require_cdrrmo();
    const notification_id = String(form_data.get("notification_id") ?? "");
    if (!notification_id) return;

    restore_notification(notification_id, user.id);
    refresh();
}

export async function clear_read_notifications_action() {
    const user = await require_cdrrmo();
    clear_read_notifications(user.id);
    refresh();
}
