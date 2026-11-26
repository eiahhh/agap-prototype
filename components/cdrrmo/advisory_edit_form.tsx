"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { create_advisory_action, save_advisory } from "@/app/dashboard/advisories/actions";
import {
    error_border_class,
    error_text_class,
    input_field_class,
    label_class,
    primary_button_class,
} from "@/components/auth/form_styles";
import { submit_without_reset } from "@/components/auth/submit_without_reset";
import type { advisory_field, advisory_form_state } from "@/lib/cdrrmo/advisory_form";

type level_option = { value: string; label: string };

const initial_state: advisory_form_state = {};

export const empty_advisory_values: Record<advisory_field, string> = {
    title: "",
    level: "all",
    coverage: "Citywide",
    message: "",
    scheduled_for: "",
};

// Without an advisory_id the form creates a new advisory; with one it edits that advisory.
export function Advisory_edit_form({
    advisory_id,
    initial_values = empty_advisory_values,
    level_options,
}: {
    advisory_id?: string;
    initial_values?: Record<advisory_field, string>;
    level_options: level_option[];
}) {
    const is_new = advisory_id === undefined;
    const [state, form_action, is_saving] = useActionState(
        is_new ? create_advisory_action : save_advisory.bind(null, advisory_id),
        initial_state,
    );
    const [values, set_values] = useState(initial_values);
    const errors = state.field_errors ?? {};

    function update(field: advisory_field) {
        return (event: { target: { value: string } }) => set_values((current) => ({ ...current, [field]: event.target.value }));
    }

    function aria(field: advisory_field) {
        return {
            "aria-invalid": errors[field] ? true : undefined,
            "aria-describedby": errors[field] ? `${field}-error` : undefined,
        } as const;
    }

    function error_for(field: advisory_field) {
        return (
            errors[field] && (
                <p id={`${field}-error`} className={error_text_class}>
                    {errors[field]}
                </p>
            )
        );
    }

    return (
        <form
            action={form_action}
            onSubmit={submit_without_reset(form_action)}
            noValidate
            className="mt-8 flex flex-col gap-4 rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-6"
        >
            {state.form_error && (
                <p role="alert" className="rounded-[10px] bg-red-50 p-3 text-xs text-red-800">
                    {state.form_error}
                </p>
            )}

            <div>
                <label htmlFor="title" className={`block ${label_class}`}>
                    Title
                </label>
                <input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="Suspension of classes due to heavy rainfall"
                    value={values.title}
                    onChange={update("title")}
                    {...aria("title")}
                    className={`mt-1.5 ${input_field_class} ${errors.title ? error_border_class : ""}`}
                />
                {error_for("title")}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-3.5">
                <div>
                    <label htmlFor="level" className={`block ${label_class}`}>
                        Levels covered
                    </label>
                    <select
                        id="level"
                        name="level"
                        value={values.level}
                        onChange={update("level")}
                        {...aria("level")}
                        className={`mt-1.5 ${input_field_class} ${errors.level ? error_border_class : ""}`}
                    >
                        {level_options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {error_for("level")}
                </div>
                <div>
                    <label htmlFor="coverage" className={`block ${label_class}`}>
                        Coverage
                    </label>
                    <input
                        id="coverage"
                        name="coverage"
                        type="text"
                        placeholder="Citywide, or a list of barangays"
                        value={values.coverage}
                        onChange={update("coverage")}
                        {...aria("coverage")}
                        className={`mt-1.5 ${input_field_class} ${errors.coverage ? error_border_class : ""}`}
                    />
                    {error_for("coverage")}
                </div>
            </div>

            <div>
                <label htmlFor="message" className={`block ${label_class}`}>
                    Message
                </label>
                <textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Write the advisory exactly as it should be sent to schools and the public."
                    value={values.message}
                    onChange={update("message")}
                    {...aria("message")}
                    className={`mt-1.5 ${input_field_class} h-auto py-3 leading-[18px] ${errors.message ? error_border_class : ""}`}
                />
                {error_for("message")}
            </div>

            <div>
                <label htmlFor="scheduled_for" className={`block ${label_class}`}>
                    Publish at (Philippine time)
                </label>
                <input
                    id="scheduled_for"
                    name="scheduled_for"
                    type="datetime-local"
                    value={values.scheduled_for}
                    onChange={update("scheduled_for")}
                    {...aria("scheduled_for")}
                    className={`mt-1.5 ${input_field_class} ${errors.scheduled_for ? error_border_class : ""}`}
                />
                {error_for("scheduled_for") ?? (
                    <p className="mt-1.5 text-[11px] leading-[16.5px] text-agap-muted">
                        Leave empty to keep this as a draft.
                    </p>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Link
                    href="/dashboard"
                    className="flex h-10 items-center rounded-[10px] border-[0.8px] border-agap-line bg-white px-4 text-xs font-semibold text-agap-ink transition hover:border-agap-700"
                >
                    {is_new ? "Cancel" : "Discard changes"}
                </Link>
                <button type="submit" disabled={is_saving} className={`h-10 text-xs ${primary_button_class}`}>
                    {is_saving ? "Saving…" : is_new ? "Save advisory" : "Save changes"}
                </button>
            </div>
        </form>
    );
}
