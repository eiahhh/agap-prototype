"use server";

import { redirect } from "next/navigation";
import { find_user_by_credentials } from "@/lib/auth/demo_users";
import { create_session, delete_session } from "@/lib/auth/session";

export type login_form_state = {
    field_errors?: {
        email?: string;
        password?: string;
    };
    form_error?: string;
    email?: string;
};

const email_pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(_previous_state: login_form_state, form_data: FormData): Promise<login_form_state> {
    const email = String(form_data.get("email") ?? "").trim();
    const password = String(form_data.get("password") ?? "");
    const is_remembered = form_data.get("remember") === "on";

    const field_errors: login_form_state["field_errors"] = {};
    if (!email) field_errors.email = "Enter your email address.";
    else if (!email_pattern.test(email)) field_errors.email = "Enter a valid email address.";
    if (!password) field_errors.password = "Enter your password.";

    if (field_errors.email || field_errors.password) {
        return { field_errors, email };
    }

    const user = find_user_by_credentials(email, password);
    if (!user) {
        // Same message for unknown email and wrong password, so accounts can't be probed.
        return { form_error: "Incorrect email or password.", email };
    }

    await create_session(user.id, user.role, is_remembered);
    redirect("/dashboard");
}

export async function logout() {
    await delete_session();
    redirect("/login");
}
