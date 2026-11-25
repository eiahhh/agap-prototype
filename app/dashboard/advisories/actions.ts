"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { require_cdrrmo } from "@/lib/auth/current_user";
import { cancel_advisory, publish_advisory, update_advisory } from "@/lib/cdrrmo/advisories";
import { validate_advisory_form, type advisory_form_state } from "@/lib/cdrrmo/advisory_form";

// Actions can be called directly with a POST, not only from the page,
// so each one checks for CDRRMO personnel again instead of trusting the page.
export async function save_advisory(
    advisory_id: string,
    _previous_state: advisory_form_state,
    form_data: FormData,
): Promise<advisory_form_state> {
    const user = await require_cdrrmo();
    const result = validate_advisory_form(form_data);
    if ("field_errors" in result) return result;

    if (!update_advisory(advisory_id, result.input, user.id)) {
        return { form_error: "This advisory was already published or cancelled, so it can't be edited." };
    }
    redirect("/dashboard");
}

export async function publish_advisory_action(form_data: FormData) {
    const user = await require_cdrrmo();
    const advisory_id = String(form_data.get("advisory_id") ?? "");
    if (!advisory_id) return;

    publish_advisory(advisory_id, user.id);
    refresh();
}

export async function cancel_advisory_action(form_data: FormData) {
    const user = await require_cdrrmo();
    const advisory_id = String(form_data.get("advisory_id") ?? "");
    if (!advisory_id) return;

    cancel_advisory(advisory_id, user.id);
    refresh();
}
