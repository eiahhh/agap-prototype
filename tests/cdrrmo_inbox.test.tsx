import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

// vi.hoisted runs before the imports below, so the mocks exist when the modules load.
const { cookie_jar, redirect_mock, refresh_mock } = await vi.hoisted(async () => {
    const { create_cookie_jar, create_redirect_mock } = await import("./helpers/mock_next");
    const { vi } = await import("vitest");
    return { cookie_jar: create_cookie_jar(), redirect_mock: create_redirect_mock(), refresh_mock: vi.fn() };
});

vi.mock("next/headers", () => ({ cookies: async () => cookie_jar.api }));
vi.mock("next/navigation", () => ({ redirect: redirect_mock }));
vi.mock("next/cache", () => ({ refresh: refresh_mock }));

import { cancel_advisory_action, publish_advisory_action } from "@/app/dashboard/advisories/actions";
import {
    mark_all_notifications_read_action,
    mark_notification_read_action,
    mark_notification_unread_action,
} from "@/app/dashboard/notifications/actions";
import { format_time_ago, Inbox_notifications } from "@/components/cdrrmo/inbox_notifications";
import type { user_role } from "@/lib/auth/demo_users";
import { session_cookie_name, sign_session } from "@/lib/auth/session_token";
import { list_pending_advisories, reset_advisories } from "@/lib/cdrrmo/advisories";
import {
    add_notification,
    count_unread_notifications,
    list_notifications,
    mark_all_notifications_read,
    mark_notification_read,
    mark_notification_unread,
    reset_notifications,
} from "@/lib/cdrrmo/notifications";
import { make_form_data } from "./helpers/mock_next";

const now = Date.UTC(2026, 10, 26, 2, 0);
const minute = 60_000;

async function sign_in_as(user_id: string, role: user_role) {
    const token = await sign_session({ user_id, role, expires_at: Date.now() + 60_000 });
    cookie_jar.store.set(session_cookie_name, { value: token });
}

beforeEach(() => {
    reset_notifications(now);
    reset_advisories(now);
    cookie_jar.store.clear();
    redirect_mock.mockClear();
    refresh_mock.mockClear();
});

afterEach(() => {
    cleanup();
});

describe("notification store", () => {
    it("lists the newest first and counts unread ones per officer", () => {
        const items = list_notifications("u_cdrrmo");

        expect(items.map((item) => item.created_at)).toEqual([...items.map((item) => item.created_at)].sort((a, b) => b - a));
        expect(count_unread_notifications("u_cdrrmo")).toBe(3);
        expect(count_unread_notifications("u_cdrrmo_head")).toBe(3);
    });

    it("filters by kind, unread and limit", () => {
        expect(list_notifications("u_cdrrmo", { limit: 2 })).toHaveLength(2);
        expect(list_notifications("u_cdrrmo", { kind: "weather" }).every((item) => item.kind === "weather")).toBe(true);
        expect(list_notifications("u_cdrrmo", { unread_only: true })).toHaveLength(3);
    });

    it("adds new notifications at the top, already read for the officer who caused them", () => {
        const added = add_notification({ kind: "system", title: "New", body: "Body", actor_id: "u_cdrrmo" }, now + minute);

        expect(list_notifications("u_cdrrmo")[0]).toMatchObject({ id: added.id, is_read: true });
        expect(list_notifications("u_cdrrmo_head")[0]).toMatchObject({ id: added.id, is_read: false });
        expect(count_unread_notifications("u_cdrrmo")).toBe(3);
        expect(count_unread_notifications("u_cdrrmo_head")).toBe(4);
    });

    it("marks read and unread for one officer only", () => {
        const [first] = list_notifications("u_cdrrmo");

        expect(mark_notification_read(first.id, "u_cdrrmo", now)).toBe(true);
        expect(mark_notification_read(first.id, "u_cdrrmo", now)).toBe(false);
        expect(count_unread_notifications("u_cdrrmo")).toBe(2);
        expect(count_unread_notifications("u_cdrrmo_head")).toBe(3);

        expect(mark_notification_unread(first.id, "u_cdrrmo")).toBe(true);
        expect(mark_notification_unread(first.id, "u_cdrrmo")).toBe(false);
        expect(count_unread_notifications("u_cdrrmo")).toBe(3);
    });

    it("marks all as read for one officer", () => {
        expect(mark_all_notifications_read("u_cdrrmo", now)).toBe(3);
        expect(count_unread_notifications("u_cdrrmo")).toBe(0);
        expect(count_unread_notifications("u_cdrrmo_head")).toBe(3);
    });

    it("returns false for unknown ids", () => {
        expect(mark_notification_read("missing", "u_cdrrmo")).toBe(false);
        expect(mark_notification_unread("missing", "u_cdrrmo")).toBe(false);
    });
});

describe("notification actions", () => {
    it("lets CDRRMO personnel mark their own notifications as read and unread", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo");
        const [first] = list_notifications("u_cdrrmo");

        await mark_notification_read_action(make_form_data({ notification_id: first.id }));
        expect(count_unread_notifications("u_cdrrmo")).toBe(2);

        await mark_notification_unread_action(make_form_data({ notification_id: first.id }));
        expect(count_unread_notifications("u_cdrrmo")).toBe(3);

        await mark_all_notifications_read_action();
        expect(count_unread_notifications("u_cdrrmo")).toBe(0);
        expect(count_unread_notifications("u_cdrrmo_head")).toBe(3);
        expect(refresh_mock).toHaveBeenCalledTimes(3);
    });

    it.each([
        ["u_admin", "super_admin"],
        ["u_it", "it_staff"],
    ] as const)("sends %s to /unauthorized without changing anything", async (user_id, role) => {
        await sign_in_as(user_id, role);
        const [first] = list_notifications("u_cdrrmo");

        await expect(mark_notification_read_action(make_form_data({ notification_id: first.id }))).rejects.toThrow(
            "NEXT_REDIRECT:/unauthorized",
        );
        await expect(mark_notification_unread_action(make_form_data({ notification_id: first.id }))).rejects.toThrow(
            "NEXT_REDIRECT:/unauthorized",
        );
        await expect(mark_all_notifications_read_action()).rejects.toThrow("NEXT_REDIRECT:/unauthorized");
        expect(count_unread_notifications("u_cdrrmo")).toBe(3);
    });

    it("adds a notification linked to the advisory when it is published or cancelled", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo");
        const [first, second] = list_pending_advisories();

        await publish_advisory_action(make_form_data({ advisory_id: first.id }));
        await cancel_advisory_action(make_form_data({ advisory_id: second.id }));
        // Publishing again does nothing, so no extra notification.
        await publish_advisory_action(make_form_data({ advisory_id: first.id }));

        const items = list_notifications("u_cdrrmo_head");
        expect(items.filter((item) => item.title === "Advisory published").map((item) => item.href)).toEqual([
            `/dashboard/announcements/${first.id}`,
        ]);
        expect(items.filter((item) => item.title === "Advisory cancelled")).toHaveLength(1);
        // Unread for the other officer, already read for the one who did it.
        expect(count_unread_notifications("u_cdrrmo_head")).toBe(5);
        expect(count_unread_notifications("u_cdrrmo")).toBe(3);
    });
});

describe("format_time_ago", () => {
    it.each([
        [0, "just now"],
        [5 * minute, "5 minutes ago"],
        [60 * minute, "1 hour ago"],
        [27 * 60 * minute, "yesterday"],
        [3 * 24 * 60 * minute, "3 days ago"],
    ])("formats %s ms ago as %s", (age, expected) => {
        expect(format_time_ago(now - age, now)).toBe(expected);
    });
});

describe("Inbox_notifications widget", () => {
    it("shows the unread count and highlights unread notifications", () => {
        render(
            <Inbox_notifications
                notifications={list_notifications("u_cdrrmo", { limit: 6 })}
                unread_count={count_unread_notifications("u_cdrrmo")}
                now={now}
            />,
        );

        expect(screen.getByLabelText("3 unread")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Mark all as read" })).toBeTruthy();
        expect(screen.getByRole("link", { name: "View all" }).getAttribute("href")).toBe("/dashboard/notifications");

        const rows = screen.getAllByRole("listitem");
        expect(rows).toHaveLength(6);
        expect(rows.filter((row) => row.dataset.unread)).toHaveLength(3);
        expect(within(rows[0]).getByText("12 minutes ago")).toBeTruthy();
        expect(
            within(rows[0]).getByRole("button", { name: "Mark “PAGASA raised a Yellow Rainfall Warning” as read" }),
        ).toBeTruthy();
        expect(within(rows[4]).queryByRole("button")).toBeNull();
        expect(within(rows[0]).getByRole("link", { name: "PAGASA raised a Yellow Rainfall Warning" }).getAttribute("href")).toBe(
            "/dashboard/weather",
        );
    });

    it("hides the unread badge and mark-all button when everything is read", () => {
        mark_all_notifications_read("u_cdrrmo", now);
        render(<Inbox_notifications notifications={list_notifications("u_cdrrmo", { limit: 6 })} unread_count={0} now={now} />);

        expect(screen.queryByLabelText(/unread/)).toBeNull();
        expect(screen.queryByRole("button", { name: "Mark all as read" })).toBeNull();
    });

    it("shows an empty state", () => {
        render(<Inbox_notifications notifications={[]} unread_count={0} now={now} />);

        expect(screen.getByText("You're all caught up.")).toBeTruthy();
    });
});
