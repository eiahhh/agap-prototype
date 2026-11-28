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

import { decide_review_action, submit_for_review_action } from "@/app/dashboard/reviews/actions";
import { Review_badge } from "@/components/reviews/review_badge";
import type { user_role } from "@/lib/auth/demo_users";
import { session_cookie_name, sign_session } from "@/lib/auth/session_token";
import { create_advisory, find_advisory, list_advisories, reset_advisories, type advisory } from "@/lib/cdrrmo/advisories";
import { list_notifications, reset_notifications } from "@/lib/cdrrmo/notifications";
import { make_form_data } from "./helpers/mock_next";

const now = Date.UTC(2026, 10, 26, 2, 0);

async function sign_in_as(user_id: string, role: user_role = "cdrrmo") {
    const token = await sign_session({ user_id, role, expires_at: Date.now() + 60_000 });
    cookie_jar.store.set(session_cookie_name, { value: token });
}

function in_review_by(user_id: string): advisory {
    return list_advisories().find((item) => item.review?.state === "in_review" && item.review.submitted_by === user_id)!;
}

function notification_titles() {
    return list_notifications("u_cdrrmo").map((item) => item.title);
}

beforeEach(() => {
    reset_advisories(now);
    reset_notifications(now);
    cookie_jar.store.clear();
    refresh_mock.mockClear();
});

afterEach(() => {
    cleanup();
});

describe("submit_for_review_action", () => {
    it("submits the notice and lets the other officers know", async () => {
        await sign_in_as("u_cdrrmo");
        const draft = create_advisory({ title: "New notice", level: "all", coverage: "Citywide", message: "x".repeat(30) }, "u_cdrrmo", now);

        await submit_for_review_action(make_form_data({ advisory_id: draft.id }));

        expect(find_advisory(draft.id)!.review).toMatchObject({ state: "in_review", submitted_by: "u_cdrrmo" });
        expect(notification_titles()).toContain("Review requested");
        expect(refresh_mock).toHaveBeenCalled();
    });
});

describe("decide_review_action", () => {
    it("approves another officer's notice", async () => {
        await sign_in_as("u_cdrrmo");
        const item = in_review_by("u_cdrrmo_head");

        const state = await decide_review_action({}, make_form_data({ advisory_id: item.id, decision: "approved", comment: "" }));

        expect(state).toEqual({ decided: "approved" });
        expect(find_advisory(item.id)!.review).toMatchObject({ state: "approved", decided_by: "u_cdrrmo" });
        expect(notification_titles()).toContain("Notice approved");
    });

    it("sends a notice back with a comment", async () => {
        await sign_in_as("u_cdrrmo_head");
        const item = in_review_by("u_cdrrmo");

        const state = await decide_review_action(
            {},
            make_form_data({ advisory_id: item.id, decision: "changes_requested", comment: "  Add   Burol Main " }),
        );

        expect(state).toEqual({ decided: "changes_requested" });
        expect(find_advisory(item.id)!.review_log!.at(-1)).toMatchObject({ action: "changes_requested", comment: "Add Burol Main" });
        expect(notification_titles()).toContain("Changes requested");
    });

    it.each([
        ["own submission", "u_cdrrmo", "approved", "", "another officer has to review it"],
        ["missing comment", "u_cdrrmo_head", "changes_requested", "", "Say what needs to change"],
        ["long comment", "u_cdrrmo_head", "changes_requested", "x".repeat(501), "500 characters"],
    ])("explains a refused decision (%s)", async (_case, user_id, decision, comment, message) => {
        await sign_in_as(user_id);
        const item = in_review_by("u_cdrrmo");

        const state = await decide_review_action({}, make_form_data({ advisory_id: item.id, decision, comment }));

        expect(state.error).toContain(message);
        expect(find_advisory(item.id)!.review!.state).toBe("in_review");
    });

    it("explains when the notice is no longer in review", async () => {
        await sign_in_as("u_cdrrmo_head");
        const approved = list_advisories().find((item) => item.review?.state === "approved")!;

        const state = await decide_review_action({}, make_form_data({ advisory_id: approved.id, decision: "approved" }));

        expect(state.error).toBe("This notice is no longer waiting for review.");
    });

    it.each([
        ["u_admin", "super_admin"],
        ["u_it", "it_staff"],
    ] as const)("sends %s to /unauthorized", async (user_id, role) => {
        await sign_in_as(user_id, role);
        const item = in_review_by("u_cdrrmo");

        await expect(decide_review_action({}, make_form_data({ advisory_id: item.id, decision: "approved" }))).rejects.toThrow(
            "NEXT_REDIRECT:/unauthorized",
        );
        await expect(submit_for_review_action(make_form_data({ advisory_id: item.id }))).rejects.toThrow("NEXT_REDIRECT:/unauthorized");
        expect(find_advisory(item.id)!.review!.state).toBe("in_review");
    });
});

describe("Review_badge", () => {
    it.each([
        [undefined, "Not submitted"],
        ["in_review", "In review"],
        ["approved", "Approved"],
        ["changes_requested", "Changes requested"],
    ] as const)("labels %s as %s", (state, label) => {
        const item = { ...list_advisories()[0], review: state ? { state, submitted_by: "u_cdrrmo", submitted_at: now } : undefined };
        render(<Review_badge item={item} />);

        expect(screen.getByText(label)).toBeTruthy();
    });
});
