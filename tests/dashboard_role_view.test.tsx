import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

// vi.hoisted runs before the imports below, so the mocks exist when the modules load.
const { cookie_jar, redirect_mock } = await vi.hoisted(async () => {
    const { create_cookie_jar, create_redirect_mock } = await import("./helpers/mock_next");
    return { cookie_jar: create_cookie_jar(), redirect_mock: create_redirect_mock() };
});

vi.mock("next/headers", () => ({ cookies: async () => cookie_jar.api }));
vi.mock("next/navigation", () => ({ redirect: redirect_mock }));

import { Role_view } from "@/components/dashboard/role_view";
import { clear_account_requests, submit_account_request } from "@/lib/auth/account_requests";
import { require_user } from "@/lib/auth/current_user";
import type { user_role } from "@/lib/auth/demo_users";
import { session_cookie_name, sign_session } from "@/lib/auth/session_token";

async function sign_in_as(user_id: string, role: user_role, expires_in_ms = 60_000) {
    const token = await sign_session({ user_id, role, expires_at: Date.now() + expires_in_ms });
    cookie_jar.store.set(session_cookie_name, { value: token });
}

// Same steps as the dashboard page: read the session, then pick the view for its role.
async function render_dashboard() {
    const user = await require_user();
    render(<Role_view user={user} />);
}

const view_markers = {
    cdrrmo: "CDRRMO dashboard coming soon.",
    super_admin: "Pending account requests",
    it_staff: "IT Staff dashboard coming soon.",
} as const;

beforeEach(() => {
    cookie_jar.store.clear();
    redirect_mock.mockClear();
    clear_account_requests();
});

afterEach(() => {
    cleanup();
});

describe("dashboard: each role gets its own view", () => {
    it.each([
        ["cdrrmo", "u_cdrrmo", "CDRRMO Officer"],
        ["super_admin", "u_admin", "System Administrator"],
        ["it_staff", "u_it", "IT Staff"],
    ] as const)("shows the %s view", async (role, user_id, name) => {
        await sign_in_as(user_id, role);

        await render_dashboard();

        expect(screen.getByRole("heading", { level: 1, name: `Welcome, ${name}` })).toBeTruthy();
        expect(screen.getByText(view_markers[role])).toBeTruthy();
        for (const [other_role, marker] of Object.entries(view_markers)) {
            if (other_role !== role) expect(screen.queryByText(marker)).toBeNull();
        }
    });

    it("shows the pending request count and review link to the Super Admin", async () => {
        await submit_account_request({
            full_name: "Maria Cruz",
            email: "maria.cruz@cdrrmo.gov.ph",
            role: "cdrrmo",
            employee_id: "CDRRMO-0123",
            password: "SafePass123",
        });
        await sign_in_as("u_admin", "super_admin");

        await render_dashboard();

        expect(screen.getByText("1")).toBeTruthy();
        expect(screen.getByRole("link", { name: "Review account requests" }).getAttribute("href")).toBe(
            "/dashboard/requests",
        );
    });

    it("does not show the account requests link to other roles", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo");

        await render_dashboard();

        expect(screen.queryByRole("link", { name: "Review account requests" })).toBeNull();
    });
});

describe("dashboard: invalid sessions go to login", () => {
    it("redirects when there is no session", async () => {
        await expect(render_dashboard()).rejects.toThrow("NEXT_REDIRECT:/login");
    });

    it("redirects when the session has expired", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo", -1_000);

        await expect(render_dashboard()).rejects.toThrow("NEXT_REDIRECT:/login");
    });

    it("redirects when the session token was tampered with", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo");
        const token = cookie_jar.store.get(session_cookie_name)!.value;
        cookie_jar.store.set(session_cookie_name, { value: `${token}x` });

        await expect(render_dashboard()).rejects.toThrow("NEXT_REDIRECT:/login");
    });

    it("redirects when the session role doesn't match the account", async () => {
        // Validly signed, but u_cdrrmo is not a Super Admin.
        await sign_in_as("u_cdrrmo", "super_admin");

        await expect(render_dashboard()).rejects.toThrow("NEXT_REDIRECT:/login");
    });

    it("redirects when the session role is not a known role", async () => {
        await sign_in_as("u_cdrrmo", "guest" as user_role);

        await expect(render_dashboard()).rejects.toThrow("NEXT_REDIRECT:/login");
    });

    it("redirects when the account no longer exists", async () => {
        await sign_in_as("u_removed", "cdrrmo");

        await expect(render_dashboard()).rejects.toThrow("NEXT_REDIRECT:/login");
    });
});
