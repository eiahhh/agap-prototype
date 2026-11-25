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

import {
    cancel_advisory_action,
    create_advisory_action,
    publish_advisory_action,
    save_advisory,
} from "@/app/dashboard/advisories/actions";
import { Pending_advisories } from "@/components/cdrrmo/pending_advisories";
import type { user_role } from "@/lib/auth/demo_users";
import { session_cookie_name, sign_session } from "@/lib/auth/session_token";
import {
    cancel_advisory,
    create_advisory,
    find_advisory,
    list_pending_advisories,
    publish_advisory,
    reset_advisories,
    update_advisory,
    type advisory_input,
} from "@/lib/cdrrmo/advisories";
import { parse_manila_datetime, to_manila_datetime_input, validate_advisory_form } from "@/lib/cdrrmo/advisory_form";
import { make_form_data } from "./helpers/mock_next";

const now = Date.UTC(2026, 10, 26, 2, 0); // 10:00 AM in Manila

const valid_input: advisory_input = {
    title: "Suspension of classes",
    level: "all",
    coverage: "Citywide",
    message: "Classes at all levels are suspended due to heavy rain.",
};

const valid_fields = {
    title: valid_input.title,
    level: valid_input.level,
    coverage: valid_input.coverage,
    message: valid_input.message,
    scheduled_for: "",
};

async function sign_in_as(user_id: string, role: user_role) {
    const token = await sign_session({ user_id, role, expires_at: Date.now() + 60_000 });
    cookie_jar.store.set(session_cookie_name, { value: token });
}

beforeEach(() => {
    reset_advisories(now);
    cookie_jar.store.clear();
    redirect_mock.mockClear();
    refresh_mock.mockClear();
});

afterEach(() => {
    cleanup();
});

describe("advisory store", () => {
    it("lists scheduled advisories first (soonest first), then drafts (latest edit first)", () => {
        const later = create_advisory({ ...valid_input, title: "Later", scheduled_for: now + 5 * 3_600_000 }, "u_cdrrmo", now);
        const pending = list_pending_advisories();

        expect(pending.map((item) => item.status)).toEqual(["scheduled", "scheduled", "draft", "draft"]);
        expect(pending[1].id).toBe(later.id);
        expect(pending[2].updated_at).toBeGreaterThan(pending[3].updated_at);
    });

    it("creates a draft without a time and a scheduled advisory with one", () => {
        expect(create_advisory(valid_input, "u_cdrrmo", now).status).toBe("draft");
        expect(create_advisory({ ...valid_input, scheduled_for: now + 60_000 }, "u_cdrrmo", now).status).toBe("scheduled");
    });

    it("turns a scheduled advisory back into a draft when the time is cleared", () => {
        const item = create_advisory({ ...valid_input, scheduled_for: now + 60_000 }, "u_cdrrmo", now);

        expect(update_advisory(item.id, valid_input, "u_cdrrmo", now + 1)).toBe(true);
        expect(find_advisory(item.id)).toMatchObject({ status: "draft", scheduled_for: undefined, updated_at: now + 1 });
    });

    it("publishes and cancels pending advisories, and removes them from the pending list", () => {
        const [first, second] = list_pending_advisories();

        expect(publish_advisory(first.id, "u_cdrrmo", now)).toBe(true);
        expect(cancel_advisory(second.id, "u_cdrrmo", now)).toBe(true);
        expect(find_advisory(first.id)).toMatchObject({ status: "published", published_at: now });
        expect(find_advisory(second.id)).toMatchObject({ status: "cancelled", cancelled_at: now });
        expect(list_pending_advisories().map((item) => item.id)).not.toContain(first.id);
        expect(list_pending_advisories().map((item) => item.id)).not.toContain(second.id);
    });

    it("refuses to edit, publish or cancel an advisory that was already sent or cancelled", () => {
        const [first, second] = list_pending_advisories();
        publish_advisory(first.id, "u_cdrrmo", now);
        cancel_advisory(second.id, "u_cdrrmo", now);

        for (const id of [first.id, second.id]) {
            expect(update_advisory(id, valid_input, "u_cdrrmo")).toBe(false);
            expect(publish_advisory(id, "u_cdrrmo")).toBe(false);
            expect(cancel_advisory(id, "u_cdrrmo")).toBe(false);
        }
        expect(find_advisory(second.id)!.status).toBe("cancelled");
    });

    it("returns false for unknown ids", () => {
        expect(publish_advisory("missing", "u_cdrrmo")).toBe(false);
        expect(cancel_advisory("missing", "u_cdrrmo")).toBe(false);
        expect(update_advisory("missing", valid_input, "u_cdrrmo")).toBe(false);
    });
});

describe("advisory form validation", () => {
    it("reads datetime-local values as Philippine time", () => {
        expect(parse_manila_datetime("2026-11-26T14:30")).toBe(Date.UTC(2026, 10, 26, 6, 30));
        expect(to_manila_datetime_input(Date.UTC(2026, 10, 26, 6, 30))).toBe("2026-11-26T14:30");
        expect(parse_manila_datetime("tomorrow")).toBeNull();
    });

    it("accepts a valid draft and a valid scheduled advisory", () => {
        expect(validate_advisory_form(make_form_data(valid_fields), now)).toEqual({ input: { ...valid_input, scheduled_for: undefined } });
        expect(validate_advisory_form(make_form_data({ ...valid_fields, scheduled_for: "2026-11-26T14:30" }), now)).toEqual({
            input: { ...valid_input, scheduled_for: Date.UTC(2026, 10, 26, 6, 30) },
        });
    });

    it("reports every invalid field and keeps what was typed", () => {
        const result = validate_advisory_form(
            make_form_data({ title: "Hi", level: "everyone", coverage: " ", message: "Too short", scheduled_for: "2026-11-26T09:00" }),
            now,
        );

        expect(result).toMatchObject({
            field_errors: {
                title: expect.any(String),
                level: expect.any(String),
                coverage: expect.any(String),
                message: expect.any(String),
                scheduled_for: "Pick a time in the future, or leave it empty to keep a draft.",
            },
            values: { title: "Hi", level: "everyone" },
        });
    });
});

describe("advisory actions", () => {
    it("lets CDRRMO personnel publish and cancel", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo");
        const [first, second] = list_pending_advisories();

        await publish_advisory_action(make_form_data({ advisory_id: first.id }));
        await cancel_advisory_action(make_form_data({ advisory_id: second.id }));

        expect(find_advisory(first.id)!.status).toBe("published");
        expect(find_advisory(second.id)!.status).toBe("cancelled");
        expect(refresh_mock).toHaveBeenCalledTimes(2);
    });

    it("saves edits and goes back to the dashboard", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo");
        const [first] = list_pending_advisories();

        await expect(save_advisory(first.id, {}, make_form_data({ ...valid_fields, title: "Updated title" }))).rejects.toThrow(
            "NEXT_REDIRECT:/dashboard",
        );
        expect(find_advisory(first.id)).toMatchObject({ title: "Updated title", status: "draft", updated_by: "u_cdrrmo" });
    });

    it("creates a new draft and goes back to the dashboard", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo");

        await expect(create_advisory_action({}, make_form_data({ ...valid_fields, title: "Brand new advisory" }))).rejects.toThrow(
            "NEXT_REDIRECT:/dashboard",
        );
        expect(list_pending_advisories().find((item) => item.title === "Brand new advisory")).toMatchObject({
            status: "draft",
            updated_by: "u_cdrrmo",
        });
    });

    it("does not create an advisory when the form is invalid", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo");
        const before = list_pending_advisories().length;

        const state = await create_advisory_action({}, make_form_data({ ...valid_fields, message: "short" }));

        expect(state.field_errors?.message).toBeTruthy();
        expect(list_pending_advisories()).toHaveLength(before);
    });

    it("returns field errors without saving", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo");
        const [first] = list_pending_advisories();

        const state = await save_advisory(first.id, {}, make_form_data({ ...valid_fields, title: "" }));

        expect(state.field_errors?.title).toBeTruthy();
        expect(find_advisory(first.id)!.title).toBe(first.title);
    });

    it("explains when the advisory can no longer be edited", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo");
        const [first] = list_pending_advisories();
        publish_advisory(first.id, "u_cdrrmo");

        const state = await save_advisory(first.id, {}, make_form_data(valid_fields));

        expect(state.form_error).toMatch(/already published or cancelled/);
    });

    it.each([
        ["u_admin", "super_admin"],
        ["u_it", "it_staff"],
    ] as const)("sends %s to /unauthorized without changing anything", async (user_id, role) => {
        await sign_in_as(user_id, role);
        const [first] = list_pending_advisories();
        const form_data = make_form_data({ advisory_id: first.id });

        await expect(publish_advisory_action(form_data)).rejects.toThrow("NEXT_REDIRECT:/unauthorized");
        await expect(cancel_advisory_action(form_data)).rejects.toThrow("NEXT_REDIRECT:/unauthorized");
        await expect(save_advisory(first.id, {}, make_form_data(valid_fields))).rejects.toThrow("NEXT_REDIRECT:/unauthorized");
        await expect(create_advisory_action({}, make_form_data(valid_fields))).rejects.toThrow("NEXT_REDIRECT:/unauthorized");
        expect(find_advisory(first.id)!.status).toBe(first.status);
        expect(list_pending_advisories()).toHaveLength(3);
    });

    it("sends signed-out visitors to /login", async () => {
        const [first] = list_pending_advisories();

        await expect(publish_advisory_action(make_form_data({ advisory_id: first.id }))).rejects.toThrow("NEXT_REDIRECT:/login");
    });
});

describe("Pending_advisories widget", () => {
    it("shows each pending advisory with edit, publish and cancel actions", () => {
        const pending = list_pending_advisories();
        render(<Pending_advisories advisories={pending} />);

        expect(screen.getByText(/^3 advisories pending/)).toBeTruthy();
        expect(screen.getByRole("link", { name: "Manage all" }).getAttribute("href")).toBe("/dashboard/announcements");
        expect(screen.getByRole("link", { name: "New advisory" }).getAttribute("href")).toBe("/dashboard/advisories/new");
        const cards = screen.getAllByRole("listitem");
        expect(cards).toHaveLength(3);

        const first = within(cards[0]);
        expect(first.getByText("Scheduled")).toBeTruthy();
        expect(first.getByText(/^Goes out /)).toBeTruthy();
        expect(first.getByRole("link", { name: `Edit ${pending[0].title}` }).getAttribute("href")).toBe(
            `/dashboard/advisories/${pending[0].id}/edit`,
        );
        expect(first.getByRole("button", { name: `Publish ${pending[0].title} now` })).toBeTruthy();
        expect(first.getByRole("button", { name: `Cancel ${pending[0].title}` })).toBeTruthy();
        expect(within(cards[1]).getByText("Draft")).toBeTruthy();
    });

    it("shows an empty state", () => {
        render(<Pending_advisories advisories={[]} />);

        expect(screen.getByText("No drafted or scheduled advisories.")).toBeTruthy();
    });
});
