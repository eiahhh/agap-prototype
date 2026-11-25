"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { require_cdrrmo } from "@/lib/auth/current_user";
import {
    cancel_advisory,
    create_advisory,
    find_advisory,
    publish_advisory,
    revise_advisory,
    update_advisory,
} from "@/lib/cdrrmo/advisories";
import {
    safe_return_path,
    validate_advisory_form,
    validate_revision_form,
    type advisory_form_state,
} from "@/lib/cdrrmo/advisory_form";
import { add_notification } from "@/lib/cdrrmo/notifications";

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
    redirect(safe_return_path(form_data.get("return_to")));
}

export async function create_advisory_action(
    _previous_state: advisory_form_state,
    form_data: FormData,
): Promise<advisory_form_state> {
    const user = await require_cdrrmo();
    const result = validate_advisory_form(form_data);
    if ("field_errors" in result) return result;

    create_advisory(result.input, user.id);
    redirect(safe_return_path(form_data.get("return_to")));
}

// Updates a published notice and re-sends it to every channel.
export async function revise_advisory_action(
    advisory_id: string,
    _previous_state: advisory_form_state,
    form_data: FormData,
): Promise<advisory_form_state> {
    const user = await require_cdrrmo();
    const result = validate_revision_form(form_data);
    if ("field_errors" in result) return result;

    if (!revise_advisory(advisory_id, result.content, result.note, user.id)) {
        return { form_error: "Only published notices can be updated. This one may have been archived." };
    }
    add_notification({
        kind: "advisory",
        title: "Announcement updated",
        body: `“${result.content.title}” was updated and re-sent: ${result.note}`,
    });
    redirect(safe_return_path(form_data.get("return_to")));
}

export async function publish_advisory_action(form_data: FormData) {
    const user = await require_cdrrmo();
    const advisory_id = String(form_data.get("advisory_id") ?? "");
    if (!advisory_id) return;

    if (publish_advisory(advisory_id, user.id)) {
        add_notification({
            kind: "advisory",
            title: "Advisory published",
            body: `“${find_advisory(advisory_id)!.title}” is now being sent to the portal, SMS, Facebook and schools.`,
        });
    }
    refresh();
}

export async function cancel_advisory_action(form_data: FormData) {
    const user = await require_cdrrmo();
    const advisory_id = String(form_data.get("advisory_id") ?? "");
    if (!advisory_id) return;

    if (cancel_advisory(advisory_id, user.id)) {
        add_notification({
            kind: "advisory",
            title: "Advisory cancelled",
            body: `“${find_advisory(advisory_id)!.title}” was cancelled and will not be sent.`,
        });
    }
    refresh();
}
