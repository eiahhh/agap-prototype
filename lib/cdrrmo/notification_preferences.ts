// PROTOTYPE ONLY: per-officer notification settings, kept in server memory.
// Muted types still appear on the Notifications page, but they don't count towards the
// unread badge and are left out of the dashboard inbox.

import { list_notifications, notification_kinds, type notification_kind, type notification_view } from "./notifications";

const muted_by_user = new Map<string, Set<notification_kind>>();

export function muted_kinds(user_id: string): notification_kind[] {
    return notification_kinds.filter((kind) => muted_by_user.get(user_id)?.has(kind));
}

export function set_muted_kinds(user_id: string, kinds: readonly string[]) {
    const valid = kinds.filter((kind): kind is notification_kind => (notification_kinds as readonly string[]).includes(kind));
    muted_by_user.set(user_id, new Set(valid));
}

export function is_muted(user_id: string, kind: notification_kind): boolean {
    return muted_by_user.get(user_id)?.has(kind) ?? false;
}

// The dashboard inbox: newest first, without muted types.
export function list_inbox_notifications(user_id: string, limit: number): notification_view[] {
    return list_notifications(user_id)
        .filter((item) => !is_muted(user_id, item.kind))
        .slice(0, limit);
}

// What the unread badges show: unread notifications that aren't muted.
export function count_inbox_unread(user_id: string): number {
    return list_notifications(user_id, { unread_only: true }).filter((item) => !is_muted(user_id, item.kind)).length;
}

// Test helper.
export function reset_notification_preferences() {
    muted_by_user.clear();
}
