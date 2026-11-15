"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

const input_field_class =
    "h-12 w-full rounded-xl border border-agap-line bg-white/80 px-3.5 text-sm text-agap-ink " +
    "shadow-[0_1px_2px_rgba(23,63,44,0.05)] outline-none transition " +
    "placeholder:text-agap-muted/70 focus:border-agap-700 focus:ring-2 focus:ring-agap-700/15";

export function Login_form() {
    const [email_value, set_email_value] = useState("");
    const [password_value, set_password_value] = useState("");
    const [is_password_visible, set_is_password_visible] = useState(false);
    const [is_remembered, set_is_remembered] = useState(false);
    const [is_submitting, set_is_submitting] = useState(false);

    async function handle_submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        set_is_submitting(true);

        try {
            await new Promise((resolve) => setTimeout(resolve, 800));
        } finally {
            set_is_submitting(false);
        }
    }

    return (
        <div className="w-full max-w-[31rem]">
            <p className="text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-agap-500">
                Welcome back
            </p>
            <h1 className="mt-3 text-[40px] font-medium leading-[1.1] tracking-[-0.02em] text-agap-ink">
                Sign in to AGAP
            </h1>
            <p className="mt-3 text-sm text-agap-muted">Use your CDRRMO-issued email to continue.</p>

            <form onSubmit={handle_submit} className="mt-8">
                <label htmlFor="email" className="block text-[13px] font-medium text-agap-ink/80">
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
                    className={`mt-2 ${input_field_class}`}
                />

                <div className="mt-5 flex items-center justify-between">
                    <label htmlFor="password" className="text-[13px] font-medium text-agap-ink/80">
                        Password
                    </label>
                    <Link href="/forgot-password" className="text-xs font-semibold text-agap-700 underline underline-offset-2">
                        Forgot password?
                    </Link>
                </div>
                <div className="relative mt-2">
                    <input
                        id="password"
                        name="password"
                        type={is_password_visible ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        placeholder="Enter your password"
                        value={password_value}
                        onChange={(event) => set_password_value(event.target.value)}
                        className={`pr-16 ${input_field_class}`}
                    />
                    <button
                        type="button"
                        onClick={() => set_is_password_visible((is_visible) => !is_visible)}
                        aria-pressed={is_password_visible}
                        className="absolute inset-y-0 right-3.5 text-xs font-semibold text-agap-700 underline underline-offset-2"
                    >
                        {is_password_visible ? "Hide" : "Show"}
                    </button>
                </div>

                <label className="mt-5 flex w-fit cursor-pointer items-center gap-2.5 text-[13px] text-agap-ink/70">
                    <span className="relative flex size-[17px] shrink-0">
                        <input
                            type="checkbox"
                            checked={is_remembered}
                            onChange={(event) => set_is_remembered(event.target.checked)}
                            className="peer size-full cursor-pointer appearance-none rounded-[4px] border border-[#b9c8be] bg-white outline-none checked:border-agap-700 checked:bg-agap-700 focus-visible:ring-2 focus-visible:ring-agap-700/30"
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
                    className="mt-5 flex h-[50px] w-full items-center justify-center gap-2.5 rounded-xl bg-agap-700 text-sm font-semibold text-white shadow-[0_10px_20px_-8px_rgba(24,77,52,0.55)] outline-none transition hover:bg-agap-900 focus-visible:ring-2 focus-visible:ring-agap-700/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {is_submitting ? "Signing in…" : "Sign in"}
                    {!is_submitting && (
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                            className="size-4"
                        >
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                        </svg>
                    )}
                </button>
            </form>

            <p className="mt-14 text-center text-[13px] text-agap-muted lg:mt-28">
                New to AGAP?{" "}
                <Link href="/request-account" className="font-bold text-agap-700 underline underline-offset-2">
                    Request an account
                </Link>
            </p>
        </div>
    );
}
