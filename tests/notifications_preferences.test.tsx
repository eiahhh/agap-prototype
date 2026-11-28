import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

// vi.hoisted runs before the imports below, so the mocks exist when the modules load.
const { cookie_jar, redirect_mock, refresh_mock } = await vi.hoisted(async () => {
    const { create_cookie_jar, create_redirect_mock } = await import("./helpers/mock_next");
    const { vi } = await import("vitest");
    return { cookie_jar: create_cookie_jar(), redirect_mock: create_redirect_mock(), refresh_mock: vi.fn() };
});

vi.mock("next/headers", () => ({ cookies: async () => cookie_jar.api }));
vi.mock("next/navigation", () => ({ redirect: redirect_mock }));
vi.mock("next/cache", () => ({ refresh: refresh_mock }));

import { save_notification_preferences_action } from "@/app/dashboard/notifications/preference_actions";
import { Notification_settings } from "@/components/notifications/notification_settings";
import type { user_role } from "@/lib/auth/demo_users";
import { session_cookie_name, sign_session } from "@/lib/auth/session_token";
import {
    count_inbox_unread,
    is_muted,
    list_inbox_notifications,
    muted_kinds,
    reset_notification_preferences,
    set_muted_kinds,
} from "@/lib/cdrrmo/notification_preferences";
import { Notification_list } from "@/components/notifications/notification_list";
import { group_by_day } from "@/lib/cdrrmo/notification_page";
import { list_notifications, notification_kinds, reset_notifications } from "@/lib/cdrrmo/notifications";

const now = Date.UTC(2026, 10, 26, 2, 0);

async function sign_in_as(user_id: string, role: user_role = "cdrrmo") {
    const token = await sign_session({ user_id, role, expires_at: Date.now() + 60_000 });
    cookie_jar.store.set(session_cookie_name, { value: token });
}

function preferences_form(notify: string[]) {
    const form_data = new FormData();
    for (const kind of notification_kinds) form_data.append("kind", kind);
    for (const kind of notify) form_data.append("notify", kind);
    return form_data;
}

beforeEach(() => {
    reset_notifications(now);
    reset_notification_preferences();
    cookie_jar.store.clear();
});

afterEach(() => {
    cleanup();
});

describe("muting notification types", () => {
    it("starts with nothing muted", () => {
        expect(muted_kinds("u_cdrrmo")).toEqual([]);
        expect(count_inbox_unread("u_cdrrmo")).toBe(3);
    });

    it("leaves muted types out of the unread badge and dashboard inbox, for that officer only", () => {
        set_muted_kinds("u_cdrrmo", ["weather", "not-a-kind"]);

        expect(muted_kinds("u_cdrrmo")).toEqual(["weather"]);
        expect(is_muted("u_cdrrmo", "weather")).toBe(true);
        expect(count_inbox_unread("u_cdrrmo")).toBe(2);
        expect(list_inbox_notifications("u_cdrrmo", 10).some((item) => item.kind === "weather")).toBe(false);
        expect(count_inbox_unread("u_cdrrmo_head")).toBe(3);
    });

    it("limits the dashboard inbox", () => {
        expect(list_inbox_notifications("u_cdrrmo", 2)).toHaveLength(2);
    });
});

describe("save_notification_preferences_action", () => {
    it("mutes every type that isn't checked", async () => {
        await sign_in_as("u_cdrrmo");

        const state = await save_notification_preferences_action({}, preferences_form(["advisory", "delivery"]));

        expect(state.saved_at).toBeTypeOf("number");
        expect(muted_kinds("u_cdrrmo")).toEqual(["weather", "system"]);
        expect(refresh_mock).toHaveBeenCalled();
    });

    it.each([
        ["u_admin", "super_admin"],
        ["u_it", "it_staff"],
    ] as const)("sends %s to /unauthorized", async (user_id, role) => {
        await sign_in_as(user_id, role);

        await expect(save_notification_preferences_action({}, preferences_form([]))).rejects.toThrow("NEXT_REDIRECT:/unauthorized");
        expect(muted_kinds(user_id)).toEqual([]);
    });
});

describe("muted notifications on the page", () => {
    it("are still listed, with a Muted tag", () => {
        render(<Notification_list days={group_by_day(list_notifications("u_cdrrmo"), now)} empty_label="None" muted={["weather"]} />);

        expect(screen.getAllByText("· Muted")).toHaveLength(list_notifications("u_cdrrmo", { kind: "weather" }).length);
    });
});

describe("Notification_settings", () => {
    it("checks the types that aren't muted", () => {
        render(
            <Notification_settings
                options={[
                    { value: "weather", label: "Weather alert", description: "PAGASA warnings", is_muted: false },
                    { value: "system", label: "System", description: "Maintenance", is_muted: true },
                ]}
            />,
        );

        expect((screen.getByLabelText(/Weather alert/) as HTMLInputElement).checked).toBe(true);
        expect((screen.getByLabelText(/System/) as HTMLInputElement).checked).toBe(false);
        expect(screen.getByRole("button", { name: "Save settings" })).toBeTruthy();
    });
});
