"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
    request_password_reset,
    type forgot_password_field,
    type forgot_password_form_state,
} from "@/app/forgot-password/actions";
import {
    error_border_class,
    error_text_class,
    input_field_class,
    label_class,
    primary_button_class,
} from "@/components/auth/form_styles";
import { submit_without_reset } from "@/components/auth/submit_without_reset";

const initial_state: forgot_password_form_state = {};

type text_field_props = {
    id: forgot_password_field;
    label: string;
    type: "email" | "text";
    auto_complete: string;
    placeholder: string;
    value: string;
    error?: string;
    on_change: (value: string) => void;
};

function Text_field({ id, label, type, auto_complete, placeholder, value, error, on_change }: text_field_props) {
    return (
        <div>
            <label htmlFor={id} className={`block ${label_class}`}>
                {label}
            </label>
            <input
                id={id}
                name={id}
                type={type}
                autoComplete={auto_complete}
                required
                placeholder={placeholder}
                value={value}
                onChange={(event) => on_change(event.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className={`mt-1.5 ${input_field_class} ${error ? error_border_class : ""}`}
            />
            {error && (
                <p id={`${id}-error`} className={error_text_class}>
                    {error}
                </p>
            )}
        </div>
    );
}

export function Forgot_password_form() {
    const [state, form_action, is_submitting] = useActionState(request_password_reset, initial_state);
    const [email, set_email] = useState("");
    const [employee_id, set_employee_id] = useState("");

    const errors = state.field_errors ?? {};

    if (state.is_submitted) return <Request_received />;

    return (
        <div className="w-full max-w-[440px]">
            <p className="text-[10px] font-semibold uppercase leading-[15px] tracking-[1px] text-agap-500">
                Account recovery
            </p>
            <h1 className="pt-1.5 text-4xl font-normal leading-[43.2px] tracking-[-1.08px] text-agap-ink">
                Reset your password
            </h1>
            <p className="pt-2 text-xs leading-[18px] text-agap-muted">
                Password resets are reviewed by IT Staff. Enter the email and employee ID on your account.
            </p>

            <form
                action={form_action}
                onSubmit={submit_without_reset(form_action)}
                noValidate
                className="mt-[26px] flex flex-col gap-4"
            >
                <Text_field
                    id="email"
                    label="Email address"
                    type="email"
                    auto_complete="email"
                    placeholder="name@cdrrmo.gov.ph"
                    value={email}
                    error={errors.email}
                    on_change={set_email}
                />

                <Text_field
                    id="employee_id"
                    label="Employee ID"
                    type="text"
                    auto_complete="off"
                    placeholder="CDRRMO-0000"
                    value={employee_id}
                    error={errors.employee_id}
                    on_change={set_employee_id}
                />

                <button
                    type="submit"
                    disabled={is_submitting}
                    className={`mt-2 w-full py-3.5 text-xs leading-[18px] ${primary_button_class}`}
                >
                    {is_submitting ? "Sending…" : "Request reset"}
                    {is_submitting ? (
                        <span aria-hidden="true" className="size-[18px]" />
                    ) : (
                        <Image src="/login/icon_arrow_right.svg" alt="" width={18} height={18} />
                    )}
                </button>
            </form>

            <p className="mt-[94px] text-center text-[11px] leading-[16.5px] text-agap-muted">
                Remembered it?{" "}
                <Link href="/login" className="font-semibold text-agap-700 underline">
                    Back to sign in
                </Link>
            </p>
        </div>
    );
}

function Request_received() {
    const heading_ref = useRef<HTMLHeadingElement>(null);

    // Move focus to the confirmation so screen readers announce it.
    useEffect(() => {
        heading_ref.current?.focus();
    }, []);

    return (
        <div className="flex w-full max-w-[440px] flex-col items-start">
            <div className="grid size-12 place-items-center rounded-full bg-agap-500">
                <Image src="/register/icon_check_circle_white.svg" alt="" width={18} height={18} />
            </div>
            <h1
                ref={heading_ref}
                tabIndex={-1}
                className="mt-3.5 pt-1.5 text-4xl font-normal leading-[43.2px] tracking-[-1.08px] text-agap-ink outline-none"
            >
                Request received
            </h1>
            <p className="mt-[22px] text-sm leading-[23.8px] text-agap-muted">
                Your password reset request was sent to IT Staff. If the details match an account, you will be
                contacted by email with next steps.
            </p>
            <Link href="/login" className={`mt-[22px] h-10 text-[11px] leading-[16.5px] ${primary_button_class}`}>
                Back to sign in
                <Image src="/login/icon_arrow_right.svg" alt="" width={18} height={18} />
            </Link>
        </div>
    );
}
