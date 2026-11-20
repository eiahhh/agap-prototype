"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { login, type login_form_state } from "@/app/login/actions";
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

const initial_state: login_form_state = {};

export function Login_form() {
    const [state, form_action, is_submitting] = useActionState(login, initial_state);
    const [email_value, set_email_value] = useState("");
    const [password_value, set_password_value] = useState("");
    const [is_password_visible, set_is_password_visible] = useState(false);
    const [is_remembered, set_is_remembered] = useState(false);

    const email_error = state.field_errors?.email;
    const password_error = state.field_errors?.password;

    return (
        <div className="w-full max-w-[440px]">
            <p className="text-[10px] font-semibold uppercase leading-[15px] tracking-[1px] text-agap-500">
                Welcome back
            </p>
            <h1 className="pt-1.5 text-4xl font-normal leading-[43.2px] tracking-[-1.08px] text-agap-ink">
                Sign in to AGAP
            </h1>
            <p className="pt-2 text-xs leading-[18px] text-agap-muted">Use your CDRRMO-issued email to continue.</p>

            <form action={form_action} onSubmit={submit_without_reset(form_action)} noValidate className="mt-[26px] flex flex-col gap-4">
                {state.form_error && (
                    <p
                        role="alert"
                        className="rounded-[10px] border-[0.8px] border-red-200 bg-red-50 px-[13px] py-2.5 text-[11px] font-medium leading-[16.5px] text-red-700"
                    >
                        {state.form_error}
                    </p>
                )}

                <div>
                    <label htmlFor="email" className={`block ${label_class}`}>
                        Email address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="name@cdrrmo.gov.ph"
                        value={email_value}
                        onChange={(event) => set_email_value(event.target.value)}
                        aria-invalid={email_error ? true : undefined}
                        aria-describedby={email_error ? "email-error" : undefined}
                        className={`mt-1.5 ${input_field_class} ${email_error ? error_border_class : ""}`}
                    />
                    {email_error && (
                        <p id="email-error" className={error_text_class}>
                            {email_error}
                        </p>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="password" className={label_class}>
                            Password
                        </label>
                        <Link href="/forgot-password" className={inline_link_class}>
                            Forgot password?
                        </Link>
                    </div>
                    <div className="relative mt-1.5">
                        <input
                            id="password"
                            name="password"
                            type={is_password_visible ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            placeholder="Enter your password"
                            value={password_value}
                            onChange={(event) => set_password_value(event.target.value)}
                            aria-invalid={password_error ? true : undefined}
                            aria-describedby={password_error ? "password-error" : undefined}
                            className={`pr-[62px] ${input_field_class} ${password_error ? error_border_class : ""}`}
                        />
                        <button
                            type="button"
                            onClick={() => set_is_password_visible((is_visible) => !is_visible)}
                            aria-label={is_password_visible ? "Hide password" : "Show password"}
                            className={`absolute inset-y-0 right-[13px] ${inline_link_class}`}
                        >
                            {is_password_visible ? "Hide" : "Show"}
                        </button>
                    </div>
                    {password_error && (
                        <p id="password-error" className={error_text_class}>
                            {password_error}
                        </p>
                    )}
                </div>

                <label className="flex w-fit cursor-pointer items-start gap-2.5 text-[11px] font-medium leading-[17.6px] text-agap-muted">
                    <span className="relative mt-0.5 flex size-4 shrink-0">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={is_remembered}
                            onChange={(event) => set_is_remembered(event.target.checked)}
                            className={checkbox_input_class}
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
                    Keep me signed in on this device
                </label>

                <button
                    type="submit"
                    disabled={is_submitting}
                    className={`w-full py-3.5 text-xs leading-[18px] ${primary_button_class}`}
                >
                    {is_submitting ? "Signing in…" : "Sign in"}
                    {is_submitting ? (
                        <span aria-hidden="true" className="size-[18px]" />
                    ) : (
                        <Image src="/login/icon_arrow_right.svg" alt="" width={18} height={18} />
                    )}
                </button>
            </form>

            <p className="mt-[90px] text-center text-[11px] leading-[16.5px] text-agap-muted">
                New to AGAP?{" "}
                <Link href="/register" className="font-semibold text-agap-700 underline">
                    Request an account
                </Link>
            </p>
        </div>
    );
}
