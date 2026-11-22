"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { register, type register_field, type register_form_state } from "@/app/register/actions";
import {
    checkbox_input_class,
    error_border_class,
    error_text_class,
    inline_link_class,
    input_field_class,
    label_class,
    primary_button_class,
} from "@/components/auth/form_styles";
import { submit_without_reset } from "@/components/auth/submit_without_reset";

type role_option = { value: string; label: string };

const initial_state: register_form_state = {};

const empty_values = {
    full_name: "",
    email: "",
    role: "",
    employee_id: "",
    password: "",
    confirm_password: "",
};

type field_props = {
    id: register_field;
    label: string;
    error?: string;
    children: (aria: { "aria-invalid"?: true; "aria-describedby"?: string; error_class: string }) => ReactNode;
};

function Field({ id, label, error, children }: field_props) {
    return (
        <div>
            <label htmlFor={id} className={`block ${label_class}`}>
                {label}
            </label>
            <div className="relative mt-1.5">
                {children({
                    "aria-invalid": error ? true : undefined,
                    "aria-describedby": error ? `${id}-error` : undefined,
                    error_class: error ? error_border_class : "",
                })}
            </div>
            {error && (
                <p id={`${id}-error`} className={error_text_class}>
                    {error}
                </p>
            )}
        </div>
    );
}

export function Register_form({ role_options }: { role_options: role_option[] }) {
    const [state, form_action, is_submitting] = useActionState(register, initial_state);
    const [values, set_values] = useState(empty_values);
    const [has_agreed, set_has_agreed] = useState(false);
    const [is_password_visible, set_is_password_visible] = useState(false);

    const errors = state.field_errors ?? {};

    function update(field: keyof typeof empty_values) {
        return (event: { target: { value: string } }) =>
            set_values((current) => ({ ...current, [field]: event.target.value }));
    }

    if (state.is_submitted) return <Request_received />;

    return (
        <div className="w-full max-w-[440px]">
            <p className="text-[10px] font-semibold uppercase leading-[15px] tracking-[1px] text-agap-500">Welcome</p>
            <h1 className="pt-1.5 text-4xl font-normal leading-[43.2px] tracking-[-1.08px] text-agap-ink">
                Create your account
            </h1>
            <p className="pt-2 text-xs leading-[18px] text-agap-muted">
                Accounts are reviewed and activated by a System Administrator.
            </p>

            <form action={form_action} onSubmit={submit_without_reset(form_action)} noValidate className="mt-[26px] flex flex-col gap-4">
                <Field id="full_name" label="Full name" error={errors.full_name}>
                    {({ error_class, ...aria }) => (
                        <input
                            id="full_name"
                            name="full_name"
                            type="text"
                            autoComplete="name"
                            required
                            placeholder="Maria Cruz"
                            value={values.full_name}
                            onChange={update("full_name")}
                            {...aria}
                            className={`${input_field_class} ${error_class}`}
                        />
                    )}
                </Field>

                <Field id="email" label="Email address" error={errors.email}>
                    {({ error_class, ...aria }) => (
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="name@cdrrmo.gov.ph"
                            value={values.email}
                            onChange={update("email")}
                            {...aria}
                            className={`${input_field_class} ${error_class}`}
                        />
                    )}
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-3.5">
                    <Field id="role" label="Requested role" error={errors.role}>
                        {({ error_class, ...aria }) => (
                            <>
                                <select
                                    id="role"
                                    name="role"
                                    required
                                    value={values.role}
                                    onChange={update("role")}
                                    {...aria}
                                    className={`h-11 cursor-pointer appearance-none pl-[17px] pr-9 ${input_field_class} ${error_class}`}
                                >
                                    <option value="" disabled>
                                        Select role
                                    </option>
                                    {role_options.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <Image
                                    src="/register/icon_chevron_down.svg"
                                    alt=""
                                    width={10}
                                    height={6}
                                    className="pointer-events-none absolute right-[13px] top-1/2 -translate-y-1/2"
                                />
                            </>
                        )}
                    </Field>

                    <Field id="employee_id" label="Employee ID" error={errors.employee_id}>
                        {({ error_class, ...aria }) => (
                            <input
                                id="employee_id"
                                name="employee_id"
                                type="text"
                                autoComplete="off"
                                required
                                placeholder="CDRRMO-0000"
                                value={values.employee_id}
                                onChange={update("employee_id")}
                                {...aria}
                                className={`${input_field_class} ${error_class}`}
                            />
                        )}
                    </Field>
                </div>

                <Field id="password" label="Password" error={errors.password}>
                    {({ error_class, ...aria }) => (
                        <>
                            <input
                                id="password"
                                name="password"
                                type={is_password_visible ? "text" : "password"}
                                autoComplete="new-password"
                                required
                                placeholder="At least 8 characters"
                                value={values.password}
                                onChange={update("password")}
                                {...aria}
                                className={`pr-[62px] ${input_field_class} ${error_class}`}
                            />
                            <button
                                type="button"
                                onClick={() => set_is_password_visible((is_visible) => !is_visible)}
                                aria-label={is_password_visible ? "Hide password" : "Show password"}
                                className={`absolute inset-y-0 right-[13px] ${inline_link_class}`}
                            >
                                {is_password_visible ? "Hide" : "Show"}
                            </button>
                        </>
                    )}
                </Field>

                <Field id="confirm_password" label="Confirm password" error={errors.confirm_password}>
                    {({ error_class, ...aria }) => (
                        <input
                            id="confirm_password"
                            name="confirm_password"
                            type={is_password_visible ? "text" : "password"}
                            autoComplete="new-password"
                            required
                            placeholder="Re-enter password"
                            value={values.confirm_password}
                            onChange={update("confirm_password")}
                            {...aria}
                            className={`${input_field_class} ${error_class}`}
                        />
                    )}
                </Field>

                <div>
                    <label className="flex cursor-pointer items-start gap-2.5 text-[11px] font-medium leading-[17.6px] text-agap-muted">
                        <span className="relative mt-0.5 flex size-4 shrink-0">
                            <input
                                type="checkbox"
                                name="agreement"
                                checked={has_agreed}
                                onChange={(event) => set_has_agreed(event.target.checked)}
                                aria-invalid={errors.agreement ? true : undefined}
                                aria-describedby={errors.agreement ? "agreement-error" : undefined}
                                className={`${checkbox_input_class} ${errors.agreement ? "border-red-600" : ""}`}
                            />
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={3.5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-0 m-auto size-3 text-white opacity-0 peer-checked:opacity-100"
                            >
                                <path d="m5 12 5 5L20 7" />
                            </svg>
                        </span>
                        I will use AGAP for official CDRRMO duties and understand it supports, but never replaces,
                        authorized decisions.
                    </label>
                    {errors.agreement && (
                        <p id="agreement-error" className={`pl-[26px] ${error_text_class}`}>
                            {errors.agreement}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={is_submitting}
                    className={`w-full py-3.5 text-xs leading-[18px] ${primary_button_class}`}
                >
                    {is_submitting ? "Submitting…" : "Submit request"}
                    {is_submitting ? (
                        <span aria-hidden="true" className="size-[18px]" />
                    ) : (
                        <Image src="/login/icon_arrow_right.svg" alt="" width={18} height={18} />
                    )}
                </button>
            </form>

            <p className="mt-[94px] text-center text-[11px] leading-[16.5px] text-agap-muted">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-agap-700 underline">
                    Sign in
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
                Your account request was sent to the System Administrator. You will be notified by email once access
                is approved.
            </p>
            <Link href="/login" className={`mt-[22px] h-10 text-[11px] leading-[16.5px] ${primary_button_class}`}>
                Back to sign in
                <Image src="/login/icon_arrow_right.svg" alt="" width={18} height={18} />
            </Link>
        </div>
    );
}
