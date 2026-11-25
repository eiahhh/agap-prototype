"use server";

import { refresh } from "next/cache";
import { require_cdrrmo } from "@/lib/auth/current_user";
import { set_muted_kinds } from "@/lib/cdrrmo/notification_preferences";

export type preferences_form_state = { saved_at?: number };

// The form lists every type as a checkbox named "notify"; unchecked types are muted.
export async function save_notification_preferences_action(
    _previous_state: preferences_form_state,
    form_data: FormData,
): Promise<preferences_form_state> {
    const user = await require_cdrrmo();
    const wanted = new Set(form_data.getAll("notify").map(String));
    const all = form_data.getAll("kind").map(String);

    set_muted_kinds(
        user.id,
        all.filter((kind) => !wanted.has(kind)),
    );
    refresh();
    return { saved_at: Date.now() };
}
