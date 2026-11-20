"use server";

import { is_requestable_role, submit_account_request } from "@/lib/auth/account_requests";

export type register_field = "full_name" | "email" | "role" | "employee_id" | "password" | "confirm_password" | "agreement";

export type register_form_state = {
    field_errors?: Partial<Record<register_field, string>>;
    // Echoed back so the form keeps what was typed. Passwords are never sent back.
    values?: {
        full_name: string;
        email: string;
        role: string;
        employee_id: string;
    };
    is_submitted?: boolean;
};

const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const employee_id_pattern = /^CDRRMO-\d{4}$/;
const password_min_length = 8;
const password_max_length = 128;
const full_name_max_length = 100;

export async function register(
    _previous_state: register_form_state,
    form_data: FormData,
): Promise<register_form_state> {
    const full_name = String(form_data.get("full_name") ?? "").trim().replace(/\s+/g, " ");
    const email = String(form_data.get("email") ?? "").trim();
    const role = String(form_data.get("role") ?? "");
    const employee_id = String(form_data.get("employee_id") ?? "").trim().toUpperCase();
    const password = String(form_data.get("password") ?? "");
    const confirm_password = String(form_data.get("confirm_password") ?? "");
    const has_agreed = form_data.get("agreement") === "on";

    const field_errors: register_form_state["field_errors"] = {};

    if (full_name.length < 2) field_errors.full_name = "Enter your full name.";
    else if (full_name.length > full_name_max_length) field_errors.full_name = "Full name is too long.";

    if (!email) field_errors.email = "Enter your email address.";
    else if (!email_pattern.test(email)) field_errors.email = "Enter a valid email address.";

    if (!role) field_errors.role = "Select a role.";
    else if (!is_requestable_role(role)) field_errors.role = "Select a valid role.";

    if (!employee_id) field_errors.employee_id = "Enter your employee ID.";
    else if (!employee_id_pattern.test(employee_id)) field_errors.employee_id = "Use the format CDRRMO-0000.";

    if (!password) field_errors.password = "Enter a password.";
    else if (password.length < password_min_length) field_errors.password = "Use at least 8 characters.";
    else if (password.length > password_max_length) field_errors.password = "Use 128 characters or fewer.";

    if (!confirm_password) field_errors.confirm_password = "Re-enter your password.";
    else if (password && confirm_password !== password) field_errors.confirm_password = "Passwords do not match.";

    if (!has_agreed) field_errors.agreement = "Confirm this to continue.";

    const values = { full_name, email, role, employee_id };

    if (Object.keys(field_errors).length > 0 || !is_requestable_role(role)) {
        return { field_errors, values };
    }

    // Same result whether or not the email is already in use, so accounts can't be probed.
    await submit_account_request({ full_name, email, role, employee_id, password });
    return { is_submitted: true };
}
