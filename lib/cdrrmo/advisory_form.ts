import { is_advisory_level, type advisory_content, type advisory_input } from "./advisories";

export type advisory_field = "title" | "level" | "coverage" | "message" | "scheduled_for" | "revision_note";

export type advisory_form_state = {
    field_errors?: Partial<Record<advisory_field, string>>;
    form_error?: string;
    // Echoed back so the form keeps what was typed.
    values?: Record<advisory_field, string>;
};

const title_max_length = 120;
const coverage_max_length = 200;
const message_max_length = 1000;

// "2026-11-26T14:30" from a datetime-local input, read as Philippine time (UTC+8, no DST).
export function parse_manila_datetime(value: string): number | null {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
    const timestamp = Date.parse(`${value}:00+08:00`);
    return Number.isNaN(timestamp) ? null : timestamp;
}

export function validate_advisory_form(
    form_data: FormData,
    now: number = Date.now(),
): { input: advisory_input } | { field_errors: NonNullable<advisory_form_state["field_errors"]>; values: Record<advisory_field, string> } {
    const values: Record<advisory_field, string> = {
        title: String(form_data.get("title") ?? "").trim().replace(/\s+/g, " "),
        level: String(form_data.get("level") ?? ""),
        coverage: String(form_data.get("coverage") ?? "").trim().replace(/\s+/g, " "),
        message: String(form_data.get("message") ?? "").trim(),
        scheduled_for: String(form_data.get("scheduled_for") ?? "").trim(),
        revision_note: "",
    };
    const field_errors: NonNullable<advisory_form_state["field_errors"]> = {};

    if (values.title.length < 5) field_errors.title = "Enter a title of at least 5 characters.";
    else if (values.title.length > title_max_length) field_errors.title = "Use 120 characters or fewer.";

    if (!is_advisory_level(values.level)) field_errors.level = "Select the levels covered.";

    if (!values.coverage) field_errors.coverage = "Enter the area covered, e.g. Citywide.";
    else if (values.coverage.length > coverage_max_length) field_errors.coverage = "Use 200 characters or fewer.";

    if (values.message.length < 20) field_errors.message = "Enter a message of at least 20 characters.";
    else if (values.message.length > message_max_length) field_errors.message = "Use 1,000 characters or fewer.";

    let scheduled_for: number | undefined;
    if (values.scheduled_for) {
        const parsed = parse_manila_datetime(values.scheduled_for);
        if (parsed === null) field_errors.scheduled_for = "Enter a valid date and time.";
        else if (parsed <= now) field_errors.scheduled_for = "Pick a time in the future, or leave it empty to keep a draft.";
        else scheduled_for = parsed;
    }

    if (Object.keys(field_errors).length > 0) return { field_errors, values };

    return {
        input: {
            title: values.title,
            level: values.level as advisory_input["level"],
            coverage: values.coverage,
            message: values.message,
            scheduled_for,
        },
    };
}


// Inverse of parse_manila_datetime, for pre-filling a datetime-local input.
export function to_manila_datetime_input(timestamp: number): string {
    return new Date(timestamp + 8 * 3_600_000).toISOString().slice(0, 16);
}

// Where to go after saving. Only our own announcement and dashboard pages are allowed,
// so a crafted link can't send people to another site.
const return_path_pattern = /^\/dashboard(\/announcements(\/[0-9a-f-]{36})?)?$/;

export function safe_return_path(value: unknown): string {
    return typeof value === "string" && return_path_pattern.test(value) ? value : "/dashboard";
}

const revision_note_max_length = 300;

// For updating a published notice: same content rules, no schedule, and a note saying what changed.
export function validate_revision_form(
    form_data: FormData,
): { content: advisory_content; note: string } | { field_errors: NonNullable<advisory_form_state["field_errors"]>; values: Record<advisory_field, string> } {
    const note = String(form_data.get("revision_note") ?? "").trim().replace(/\s+/g, " ");
    const without_schedule = new FormData();
    for (const [key, value] of form_data.entries()) if (key !== "scheduled_for") without_schedule.append(key, value);
    const result = validate_advisory_form(without_schedule);

    const note_error =
        note.length < 5
            ? "Say what changed, e.g. \"Added Burol Main to the coverage\"."
            : note.length > revision_note_max_length
              ? "Use 300 characters or fewer."
              : undefined;

    if ("field_errors" in result || note_error) {
        const field_errors = "field_errors" in result ? result.field_errors : {};
        const values = "values" in result ? result.values : ({} as Record<advisory_field, string>);
        return {
            field_errors: note_error ? { ...field_errors, revision_note: note_error } : field_errors,
            values: { ...values, revision_note: note, scheduled_for: "" },
        };
    }

    const { title, level, coverage, message } = result.input;
    return { content: { title, level, coverage, message }, note };
}
