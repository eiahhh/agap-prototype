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
import { mark_all_notifications_read_action, mark_notification_read_action } from "@/app/dashboard/notifications/actions";
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
    it("lists the newest first and counts unread ones", () => {
        const items = list_notifications();

        expect(items.map((item) => item.created_at)).toEqual([...items.map((item) => item.created_at)].sort((a, b) => b - a));
        expect(count_unread_notifications()).toBe(3);
    });

    it("limits how many are listed", () => {
        expect(list_notifications(2)).toHaveLength(2);
    });

    it("adds new notifications at the top as unread", () => {
        const added = add_notification({ kind: "system", title: "New", body: "Body" }, now + minute);

        expect(list_notifications()[0].id).toBe(added.id);
        expect(count_unread_notifications()).toBe(4);
    });

    it("marks one or all as read", () => {
        const [first] = list_notifications();

        expect(mark_notification_read(first.id, now)).toBe(true);
        expect(mark_notification_read(first.id, now)).toBe(false);
        expect(count_unread_notifications()).toBe(2);
        expect(mark_all_notifications_read(now)).toBe(2);
        expect(count_unread_notifications()).toBe(0);
    });

    it("returns false for unknown ids", () => {
        expect(mark_notification_read("missing")).toBe(false);
    });
});

describe("notification actions", () => {
    it("lets CDRRMO personnel mark notifications as read", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo");
        const [first] = list_notifications();

        await mark_notification_read_action(make_form_data({ notification_id: first.id }));
        expect(count_unread_notifications()).toBe(2);

        await mark_all_notifications_read_action();
        expect(count_unread_notifications()).toBe(0);
        expect(refresh_mock).toHaveBeenCalledTimes(2);
    });

    it.each([
        ["u_admin", "super_admin"],
        ["u_it", "it_staff"],
    ] as const)("sends %s to /unauthorized without changing anything", async (user_id, role) => {
        await sign_in_as(user_id, role);
        const [first] = list_notifications();

        await expect(mark_notification_read_action(make_form_data({ notification_id: first.id }))).rejects.toThrow(
            "NEXT_REDIRECT:/unauthorized",
        );
        await expect(mark_all_notifications_read_action()).rejects.toThrow("NEXT_REDIRECT:/unauthorized");
        expect(count_unread_notifications()).toBe(3);
    });

    it("adds an inbox notification when an advisory is published or cancelled", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo");
        const [first, second] = list_pending_advisories();

        await publish_advisory_action(make_form_data({ advisory_id: first.id }));
        await cancel_advisory_action(make_form_data({ advisory_id: second.id }));
        // Publishing again does nothing, so no extra notification.
        await publish_advisory_action(make_form_data({ advisory_id: first.id }));

        const titles = list_notifications(20).map((item) => item.title);
        expect(titles.filter((title) => title === "Advisory published")).toHaveLength(1);
        expect(titles.filter((title) => title === "Advisory cancelled")).toHaveLength(1);
        expect(count_unread_notifications()).toBe(5);
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
        render(<Inbox_notifications notifications={list_notifications()} unread_count={count_unread_notifications()} now={now} />);

        expect(screen.getByLabelText("3 unread")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Mark all as read" })).toBeTruthy();

        const rows = screen.getAllByRole("listitem");
        expect(rows).toHaveLength(5);
        expect(rows.filter((row) => row.dataset.unread)).toHaveLength(3);
        expect(within(rows[0]).getByText("12 minutes ago")).toBeTruthy();
        expect(
            within(rows[0]).getByRole("button", { name: "Mark “PAGASA raised a Yellow Rainfall Warning” as read" }),
        ).toBeTruthy();
        expect(within(rows[4]).queryByRole("button")).toBeNull();
    });

    it("hides the unread badge and mark-all button when everything is read", () => {
        mark_all_notifications_read(now);
        render(<Inbox_notifications notifications={list_notifications()} unread_count={0} now={now} />);

        expect(screen.queryByLabelText(/unread/)).toBeNull();
        expect(screen.queryByRole("button", { name: "Mark all as read" })).toBeNull();
    });

    it("shows an empty state", () => {
        render(<Inbox_notifications notifications={[]} unread_count={0} now={now} />);

        expect(screen.getByText("You're all caught up.")).toBeTruthy();
    });
});
