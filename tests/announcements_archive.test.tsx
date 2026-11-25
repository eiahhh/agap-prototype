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

import { archive_advisory_action, restore_advisory_action } from "@/app/dashboard/advisories/actions";
import { Announcement_list } from "@/components/announcements/announcement_list";
import type { user_role } from "@/lib/auth/demo_users";
import { session_cookie_name, sign_session } from "@/lib/auth/session_token";
import {
    archive_advisory,
    find_advisory,
    list_advisories,
    reset_advisories,
    restore_advisory,
    revise_advisory,
    type advisory,
} from "@/lib/cdrrmo/advisories";
import { announcement_history } from "@/lib/cdrrmo/announcement_history";
import { count_by_tab, filter_announcements } from "@/lib/cdrrmo/announcement_filters";
import { track_recent_announcements } from "@/lib/cdrrmo/announcement_tracker";
import { make_form_data } from "./helpers/mock_next";

const now = Date.UTC(2026, 10, 26, 2, 0);

async function sign_in_as(user_id: string, role: user_role) {
    const token = await sign_session({ user_id, role, expires_at: Date.now() + 60_000 });
    cookie_jar.store.set(session_cookie_name, { value: token });
}

function first_active(status: advisory["status"]): advisory {
    return list_advisories().find((item) => item.status === status && item.archived_at === undefined)!;
}

beforeEach(() => {
    reset_advisories(now);
    cookie_jar.store.clear();
    refresh_mock.mockClear();
});

afterEach(() => {
    cleanup();
});

describe("archive_advisory", () => {
    it.each(["published", "cancelled"] as const)("archives a %s notice and restores it", (status) => {
        const item = first_active(status);

        expect(archive_advisory(item.id, "u_cdrrmo", now)).toBe(true);
        expect(find_advisory(item.id)).toMatchObject({ status, archived_at: now, archived_by: "u_cdrrmo" });
        expect(archive_advisory(item.id, "u_cdrrmo", now)).toBe(false);

        expect(restore_advisory(item.id)).toBe(true);
        expect(find_advisory(item.id)!.archived_at).toBeUndefined();
        expect(restore_advisory(item.id)).toBe(false);
    });

    it.each(["draft", "scheduled"] as const)("refuses to archive a %s notice", (status) => {
        expect(archive_advisory(first_active(status).id, "u_cdrrmo", now)).toBe(false);
    });

    it("doesn't let an archived notice be updated", () => {
        const item = first_active("published");
        archive_advisory(item.id, "u_cdrrmo", now);

        expect(revise_advisory(item.id, { title: "x".repeat(10), level: "all", coverage: "Citywide", message: "y".repeat(30) }, "note", "u_cdrrmo")).toBe(
            false,
        );
    });

    it("adds an Archived entry to the history", () => {
        const item = first_active("cancelled");
        archive_advisory(item.id, "u_cdrrmo", now + 1);

        expect(announcement_history(find_advisory(item.id)!)[0]).toMatchObject({ label: "Archived", by: "CDRRMO Officer" });
    });
});

describe("archived notices in lists", () => {
    it("starts with the older sample notices archived", () => {
        const archived = filter_announcements(list_advisories(), "archived", "");

        expect(archived.length).toBeGreaterThan(0);
        expect(archived.every((item) => now - item.published_at! > 14 * 86_400_000)).toBe(true);
    });

    it("moves a notice from its status tab to the Archived tab", () => {
        const item = first_active("published");
        const before = count_by_tab(list_advisories(), "");
        archive_advisory(item.id, "u_cdrrmo", now);
        const after = count_by_tab(list_advisories(), "");

        expect(after).toMatchObject({ all: before.all - 1, published: before.published - 1, archived: before.archived + 1 });
        expect(filter_announcements(list_advisories(), "archived", "")[0].id).toBe(item.id);
        expect(filter_announcements(list_advisories(), "published", "").map((entry) => entry.id)).not.toContain(item.id);
    });

    it("drops archived notices from the dashboard tracker", () => {
        const [latest] = track_recent_announcements(list_advisories(), now);
        archive_advisory(latest.advisory.id, "u_cdrrmo", now);

        expect(track_recent_announcements(list_advisories(), now).map((entry) => entry.advisory.id)).not.toContain(latest.advisory.id);
    });

    it("shows Archive on finished notices and Restore on archived ones", () => {
        const published = first_active("published");
        const archived = filter_announcements(list_advisories(), "archived", "")[0];
        render(<Announcement_list items={[published, archived]} empty_label="None" />);

        const [first, second] = screen.getAllByRole("listitem");
        expect(within(first).getByRole("button", { name: `Archive ${published.title}` })).toBeTruthy();
        expect(within(second).getByRole("button", { name: `Restore ${archived.title}` })).toBeTruthy();
        expect(within(second).getByText("Archived")).toBeTruthy();
        expect(within(first).getByRole("link", { name: "View" }).getAttribute("href")).toBe(`/dashboard/announcements/${published.id}`);
    });
});

describe("archive actions", () => {
    it("lets CDRRMO personnel archive and restore", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo");
        const item = first_active("published");

        await archive_advisory_action(make_form_data({ advisory_id: item.id }));
        expect(find_advisory(item.id)!.archived_at).toBeDefined();

        await restore_advisory_action(make_form_data({ advisory_id: item.id }));
        expect(find_advisory(item.id)!.archived_at).toBeUndefined();
        expect(refresh_mock).toHaveBeenCalledTimes(2);
    });

    it.each([
        ["u_admin", "super_admin"],
        ["u_it", "it_staff"],
    ] as const)("sends %s to /unauthorized", async (user_id, role) => {
        await sign_in_as(user_id, role);
        const item = first_active("published");

        await expect(archive_advisory_action(make_form_data({ advisory_id: item.id }))).rejects.toThrow("NEXT_REDIRECT:/unauthorized");
        await expect(restore_advisory_action(make_form_data({ advisory_id: item.id }))).rejects.toThrow("NEXT_REDIRECT:/unauthorized");
        expect(find_advisory(item.id)!.archived_at).toBeUndefined();
    });
});
