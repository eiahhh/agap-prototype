import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted runs before the imports below, so the mocks exist when the modules load.
const { cookie_jar, redirect_mock, refresh_mock } = await vi.hoisted(async () => {
    const { create_cookie_jar, create_redirect_mock } = await import("./helpers/mock_next");
    const { vi } = await import("vitest");
    return { cookie_jar: create_cookie_jar(), redirect_mock: create_redirect_mock(), refresh_mock: vi.fn() };
});

vi.mock("next/headers", () => ({ cookies: async () => cookie_jar.api }));
vi.mock("next/navigation", () => ({ redirect: redirect_mock }));
vi.mock("next/cache", () => ({ refresh: refresh_mock }));

import { revise_advisory_action } from "@/app/dashboard/advisories/actions";
import type { user_role } from "@/lib/auth/demo_users";
import { session_cookie_name, sign_session } from "@/lib/auth/session_token";
import { find_advisory, list_advisories, reset_advisories, revise_advisory, type advisory } from "@/lib/cdrrmo/advisories";
import { validate_revision_form } from "@/lib/cdrrmo/advisory_form";
import { announcement_history } from "@/lib/cdrrmo/announcement_history";
import { channel_deliveries } from "@/lib/cdrrmo/announcement_tracker";
import { list_notifications, reset_notifications } from "@/lib/cdrrmo/notifications";
import { make_form_data } from "./helpers/mock_next";

const now = Date.UTC(2026, 10, 26, 2, 0);
const minute = 60_000;

const content = {
    title: "Suspension of classes, updated",
    level: "all",
    coverage: "Citywide and Burol Main",
    message: "Classes at all levels are suspended. Burol Main is now included.",
} as const;

async function sign_in_as(user_id: string, role: user_role) {
    const token = await sign_session({ user_id, role, expires_at: Date.now() + 60_000 });
    cookie_jar.store.set(session_cookie_name, { value: token });
}

function first_with(status: advisory["status"]): advisory {
    return list_advisories().find((item) => item.status === status)!;
}

beforeEach(() => {
    reset_advisories(now);
    reset_notifications(now);
    cookie_jar.store.clear();
    redirect_mock.mockClear();
});

describe("revise_advisory", () => {
    it("updates a published notice, keeps the old wording and re-sends it", () => {
        const item = first_with("published");
        const old_title = item.title;

        expect(revise_advisory(item.id, content, "Added Burol Main", "u_cdrrmo", now)).toBe(true);

        expect(find_advisory(item.id)).toMatchObject({ ...content, status: "published", last_sent_at: now, updated_by: "u_cdrrmo" });
        expect(find_advisory(item.id)!.revisions).toEqual([
            { at: now, by: "u_cdrrmo", note: "Added Burol Main", previous: expect.objectContaining({ title: old_title }) },
        ]);
    });

    it("restarts delivery and clears failed channels", () => {
        const failed = list_advisories().find((item) => item.failed_channels?.length)!;
        revise_advisory(failed.id, content, "Re-sent after Facebook failed", "u_cdrrmo", now);

        const states = channel_deliveries(find_advisory(failed.id)!, now + minute).map((delivery) => delivery.state);
        expect(states).not.toContain("failed");
        expect(states).toContain("sending");
    });

    it.each(["draft", "scheduled", "cancelled"] as const)("refuses to revise a %s notice", (status) => {
        expect(revise_advisory(first_with(status).id, content, "note", "u_cdrrmo", now)).toBe(false);
    });
});

describe("validate_revision_form", () => {
    it("requires a note and ignores any schedule", () => {
        const result = validate_revision_form(make_form_data({ ...content, scheduled_for: "2020-01-01T00:00", revision_note: "  Added   Burol Main " }));

        expect(result).toEqual({ content, note: "Added Burol Main" });
    });

    it("reports a missing note along with other errors", () => {
        const result = validate_revision_form(make_form_data({ ...content, title: "", revision_note: "" }));

        expect(result).toMatchObject({ field_errors: { title: expect.any(String), revision_note: expect.any(String) } });
    });
});

describe("revise_advisory_action", () => {
    it("saves the update, notifies the inbox and returns to the notice", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo");
        const item = first_with("published");
        const return_to = `/dashboard/announcements/${item.id}`;

        await expect(
            revise_advisory_action(item.id, {}, make_form_data({ ...content, revision_note: "Added Burol Main", return_to })),
        ).rejects.toThrow(`NEXT_REDIRECT:${return_to}`);

        expect(find_advisory(item.id)!.title).toBe(content.title);
        expect(list_notifications("u_cdrrmo").filter((item) => item.title === "Announcement updated")).toHaveLength(1);
    });

    it("explains when the notice can't be updated", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo");

        const state = await revise_advisory_action(first_with("cancelled").id, {}, make_form_data({ ...content, revision_note: "note here" }));

        expect(state.form_error).toMatch(/Only published notices/);
    });

    it.each([
        ["u_admin", "super_admin"],
        ["u_it", "it_staff"],
    ] as const)("sends %s to /unauthorized", async (user_id, role) => {
        await sign_in_as(user_id, role);
        const item = first_with("published");

        await expect(revise_advisory_action(item.id, {}, make_form_data({ ...content, revision_note: "note here" }))).rejects.toThrow(
            "NEXT_REDIRECT:/unauthorized",
        );
        expect(find_advisory(item.id)!.revisions).toBeUndefined();
    });
});

describe("announcement_history", () => {
    it("lists drafted, published and each update, newest first", () => {
        const item = first_with("published");
        revise_advisory(item.id, content, "Added Burol Main", "u_cdrrmo", now + minute);

        const entries = announcement_history(find_advisory(item.id)!);

        expect(entries.map((entry) => entry.label)).toEqual(["Updated and re-sent", "Published", "Drafted"]);
        expect(entries[0]).toMatchObject({ by: "CDRRMO Officer", detail: expect.stringContaining("Added Burol Main") });
    });

    it("shows when a notice was cancelled", () => {
        expect(announcement_history(first_with("cancelled")).map((entry) => entry.label)).toEqual(["Cancelled", "Drafted"]);
    });
});
