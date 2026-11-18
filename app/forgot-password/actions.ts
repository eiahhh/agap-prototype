"use server";

import { submit_password_reset_request } from "@/lib/auth/password_reset_requests";

export type forgot_password_field = "email" | "employee_id";

export type forgot_password_form_state = {
    field_errors?: Partial<Record<forgot_password_field, string>>;
    // Echoed back so the form keeps what was typed.
    values?: {
        email: string;
        employee_id: string;
    };
    is_submitted?: boolean;
};

const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const employee_id_pattern = /^CDRRMO-\d{4}$/;

export async function request_password_reset(
    _previous_state: forgot_password_form_state,
    form_data: FormData,
): Promise<forgot_password_form_state> {
    const email = String(form_data.get("email") ?? "").trim();
    const employee_id = String(form_data.get("employee_id") ?? "").trim().toUpperCase();

    const field_errors: forgot_password_form_state["field_errors"] = {};

    if (!email) field_errors.email = "Enter your email address.";
    else if (!email_pattern.test(email)) field_errors.email = "Enter a valid email address.";

    if (!employee_id) field_errors.employee_id = "Enter your employee ID.";
    else if (!employee_id_pattern.test(employee_id)) field_errors.employee_id = "Use the format CDRRMO-0000.";

    if (Object.keys(field_errors).length > 0) {
        return { field_errors, values: { email, employee_id } };
    }

    // Same result whether or not a request already exists, so accounts can't be probed.
    submit_password_reset_request({ email, employee_id });
    return { is_submitted: true };
}
