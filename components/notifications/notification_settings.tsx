"use client";

import { useActionState } from "react";
import { save_notification_preferences_action, type preferences_form_state } from "@/app/dashboard/notifications/preference_actions";
import { checkbox_input_class, primary_button_class } from "@/components/auth/form_styles";

const initial_state: preferences_form_state = {};

type kind_option = { value: string; label: string; description: string; is_muted: boolean };

// Which notification types count towards the unread badge and show on the dashboard inbox.
export function Notification_settings({ options }: { options: kind_option[] }) {
    const [state, form_action, is_saving] = useActionState(save_notification_preferences_action, initial_state);

    return (
        <form action={form_action} className="rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-5">
            <fieldset>
                <legend className="text-sm font-medium text-agap-ink">Notification settings</legend>
                <p className="mt-1 text-[11px] leading-[16.5px] text-agap-muted">
                    Unchecked types stay on this page, but they don&apos;t count towards your unread badge or show on the dashboard.
                </p>
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {options.map((option) => (
                        <li key={option.value} className="flex gap-3">
                            <input type="hidden" name="kind" value={option.value} />
                            <span className="relative mt-0.5 flex size-4 shrink-0">
                                <input
                                    id={`notify-${option.value}`}
                                    type="checkbox"
                                    name="notify"
                                    value={option.value}
                                    defaultChecked={!option.is_muted}
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
                            <label htmlFor={`notify-${option.value}`} className="text-xs">
                                <span className="block font-medium text-agap-ink">{option.label}</span>
                                <span className="block text-[11px] leading-[16.5px] text-agap-muted">{option.description}</span>
                            </label>
                        </li>
                    ))}
                </ul>
            </fieldset>
            <div className="mt-4 flex items-center justify-end gap-3">
                {state.saved_at && !is_saving && (
                    <p role="status" className="text-[11px] font-medium text-agap-700">
                        Settings saved.
                    </p>
                )}
                <button type="submit" disabled={is_saving} className={`h-9 text-[11px] ${primary_button_class}`}>
                    {is_saving ? "Saving…" : "Save settings"}
                </button>
            </div>
        </form>
    );
}
