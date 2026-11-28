import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// vi.hoisted runs before the imports below, so the mocks exist when the modules load.
const { cookie_jar, redirect_mock, refresh_mock } = await vi.hoisted(async () => {
    const { create_cookie_jar, create_redirect_mock } = await import("./helpers/mock_next");
    const { vi } = await import("vitest");
    return { cookie_jar: create_cookie_jar(), redirect_mock: create_redirect_mock(), refresh_mock: vi.fn() };
});

vi.mock("next/headers", () => ({ cookies: async () => cookie_jar.api }));
vi.mock("next/navigation", () => ({ redirect: redirect_mock }));
vi.mock("next/cache", () => ({ refresh: refresh_mock }));

import {
    clear_read_notifications_action,
    dismiss_notification_action,
    restore_notification_action,
} from "@/app/dashboard/notifications/actions";
import type { user_role } from "@/lib/auth/demo_users";
import { session_cookie_name, sign_session } from "@/lib/auth/session_token";
import {
    clear_read_notifications,
    count_unread_notifications,
    dismiss_notification,
    list_notifications,
    reset_notifications,
    restore_notification,
} from "@/lib/cdrrmo/notifications";
import { make_form_data } from "./helpers/mock_next";

const now = Date.UTC(2026, 10, 26, 2, 0);

async function sign_in_as(user_id: string, role: user_role = "cdrrmo") {
    const token = await sign_session({ user_id, role, expires_at: Date.now() + 60_000 });
    cookie_jar.store.set(session_cookie_name, { value: token });
}

beforeEach(() => {
    reset_notifications(now);
    cookie_jar.store.clear();
    refresh_mock.mockClear();
});

afterEach(() => {
    cleanup();
});

describe("dismissing notifications", () => {
    it("hides a notification for one officer, marks it read, and can bring it back", () => {
        const [first] = list_notifications("u_cdrrmo");

        expect(dismiss_notification(first.id, "u_cdrrmo", now)).toBe(true);
        expect(dismiss_notification(first.id, "u_cdrrmo", now)).toBe(false);
        expect(list_notifications("u_cdrrmo").map((item) => item.id)).not.toContain(first.id);
        expect(list_notifications("u_cdrrmo", { dismissed: true }).map((item) => item.id)).toEqual([first.id]);
        expect(count_unread_notifications("u_cdrrmo")).toBe(2);
        // The other officer still has it.
        expect(list_notifications("u_cdrrmo_head").map((item) => item.id)).toContain(first.id);

        expect(restore_notification(first.id, "u_cdrrmo")).toBe(true);
        expect(restore_notification(first.id, "u_cdrrmo")).toBe(false);
        expect(list_notifications("u_cdrrmo")[0]).toMatchObject({ id: first.id, is_read: true });
    });

    it("clears every read notification at once", () => {
        const read_before = list_notifications("u_cdrrmo").filter((item) => item.is_read).length;

        expect(clear_read_notifications("u_cdrrmo", now)).toBe(read_before);
        expect(list_notifications("u_cdrrmo").every((item) => !item.is_read)).toBe(true);
        expect(count_unread_notifications("u_cdrrmo")).toBe(3);
        expect(clear_read_notifications("u_cdrrmo", now)).toBe(0);
    });

    it("returns false for unknown ids", () => {
        expect(dismiss_notification("missing", "u_cdrrmo")).toBe(false);
        expect(restore_notification("missing", "u_cdrrmo")).toBe(false);
    });
});

describe("dismiss actions", () => {
    it("dismiss, restore and clear read for the signed-in officer", async () => {
        await sign_in_as("u_cdrrmo");
        const [first] = list_notifications("u_cdrrmo");

        await dismiss_notification_action(make_form_data({ notification_id: first.id }));
        expect(list_notifications("u_cdrrmo", { dismissed: true })).toHaveLength(1);

        await restore_notification_action(make_form_data({ notification_id: first.id }));
        expect(list_notifications("u_cdrrmo", { dismissed: true })).toHaveLength(0);

        await clear_read_notifications_action();
        expect(list_notifications("u_cdrrmo").every((item) => !item.is_read)).toBe(true);
        expect(list_notifications("u_cdrrmo_head", { dismissed: true })).toHaveLength(0);
        expect(refresh_mock).toHaveBeenCalledTimes(3);
    });

    it.each([
        ["u_admin", "super_admin"],
        ["u_it", "it_staff"],
    ] as const)("sends %s to /unauthorized", async (user_id, role) => {
        await sign_in_as(user_id, role);
        const [first] = list_notifications("u_cdrrmo");
        const form_data = make_form_data({ notification_id: first.id });

        await expect(dismiss_notification_action(form_data)).rejects.toThrow("NEXT_REDIRECT:/unauthorized");
        await expect(restore_notification_action(form_data)).rejects.toThrow("NEXT_REDIRECT:/unauthorized");
        await expect(clear_read_notifications_action()).rejects.toThrow("NEXT_REDIRECT:/unauthorized");
        expect(list_notifications("u_cdrrmo", { dismissed: true })).toHaveLength(0);
    });
});
