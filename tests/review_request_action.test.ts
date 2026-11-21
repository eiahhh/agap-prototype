// @vitest-environment node
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

import { approve_request, reject_request } from "@/app/dashboard/requests/actions";
import {
    clear_account_requests,
    list_account_requests,
    submit_account_request,
} from "@/lib/auth/account_requests";
import type { user_role } from "@/lib/auth/demo_users";
import { session_cookie_name, sign_session } from "@/lib/auth/session_token";
import { make_form_data } from "./helpers/mock_next";

async function sign_in_as(user_id: string, role: user_role, expires_in_ms = 60_000) {
    const token = await sign_session({ user_id, role, expires_at: Date.now() + expires_in_ms });
    cookie_jar.store.set(session_cookie_name, { value: token });
}

async function add_request(email = "maria.cruz@cdrrmo.gov.ph") {
    await submit_account_request({
        full_name: "Maria Cruz",
        email,
        role: "cdrrmo",
        employee_id: "CDRRMO-0123",
        password: "SafePass123",
    });
    return list_account_requests().find((request) => request.email === email)!;
}

const form_for = (request_id: string) => make_form_data({ request_id });

beforeEach(() => {
    cookie_jar.store.clear();
    redirect_mock.mockClear();
    refresh_mock.mockClear();
    clear_account_requests();
});

describe("review actions: Super Admin", () => {
    beforeEach(async () => {
        await sign_in_as("u_admin", "super_admin");
    });

    it("approves a pending request and records who reviewed it", async () => {
        const request = await add_request();

        await approve_request(form_for(request.id));

        expect(request).toMatchObject({ status: "approved", reviewed_by: "u_admin" });
        expect(request.reviewed_at).toEqual(expect.any(Number));
        expect(refresh_mock).toHaveBeenCalledOnce();
        expect(redirect_mock).not.toHaveBeenCalled();
    });

    it("rejects a pending request", async () => {
        const request = await add_request();

        await reject_request(form_for(request.id));

        expect(request).toMatchObject({ status: "rejected", reviewed_by: "u_admin" });
        expect(refresh_mock).toHaveBeenCalledOnce();
    });

    it("only changes the request it was given", async () => {
        const first = await add_request("first@cdrrmo.gov.ph");
        const second = await add_request("second@cdrrmo.gov.ph");

        await approve_request(form_for(first.id));

        expect(first.status).toBe("approved");
        expect(second.status).toBe("pending");
    });

    it("can't change a decision once it is made", async () => {
        const request = await add_request();

        await approve_request(form_for(request.id));
        const reviewed_at = request.reviewed_at;
        await reject_request(form_for(request.id));

        expect(request.status).toBe("approved");
        expect(request.reviewed_at).toBe(reviewed_at);
    });

    it.each([
        ["an unknown id", "does-not-exist"],
        ["a missing id", null],
    ])("does nothing for %s", async (_label, request_id) => {
        const request = await add_request();

        await approve_request(request_id === null ? new FormData() : form_for(request_id));

        expect(request.status).toBe("pending");
    });
});

describe("review actions: role check", () => {
    it.each([
        ["CDRRMO Personnel", "u_cdrrmo", "cdrrmo"],
        ["IT Staff", "u_it", "it_staff"],
    ] as const)("sends %s back to the dashboard without changing anything", async (_label, user_id, role) => {
        const request = await add_request();
        await sign_in_as(user_id, role);

        await expect(approve_request(form_for(request.id))).rejects.toThrow("NEXT_REDIRECT:/dashboard");
        await expect(reject_request(form_for(request.id))).rejects.toThrow("NEXT_REDIRECT:/dashboard");

        expect(request.status).toBe("pending");
        expect(refresh_mock).not.toHaveBeenCalled();
    });

    it("sends signed-out visitors to login without changing anything", async () => {
        const request = await add_request();

        await expect(approve_request(form_for(request.id))).rejects.toThrow("NEXT_REDIRECT:/login");

        expect(request.status).toBe("pending");
    });

    it("treats an expired session as signed out", async () => {
        const request = await add_request();
        await sign_in_as("u_admin", "super_admin", -1_000);

        await expect(approve_request(form_for(request.id))).rejects.toThrow("NEXT_REDIRECT:/login");

        expect(request.status).toBe("pending");
    });

    it("rejects a session cookie that was tampered with", async () => {
        const request = await add_request();
        await sign_in_as("u_cdrrmo", "cdrrmo");
        const token = cookie_jar.store.get(session_cookie_name)!.value;
        const [, signature] = token.split(".");
        const forged_body = Buffer.from(
            JSON.stringify({ user_id: "u_admin", role: "super_admin", expires_at: Date.now() + 60_000 }),
        ).toString("base64url");
        cookie_jar.store.set(session_cookie_name, { value: `${forged_body}.${signature}` });

        await expect(approve_request(form_for(request.id))).rejects.toThrow("NEXT_REDIRECT:/login");

        expect(request.status).toBe("pending");
    });

    it("sends a session whose role doesn't match the user back to login", async () => {
        const request = await add_request();
        // Validly signed, but u_cdrrmo is not a Super Admin in the user list.
        await sign_in_as("u_cdrrmo", "super_admin");

        await expect(approve_request(form_for(request.id))).rejects.toThrow("NEXT_REDIRECT:/login");

        expect(request.status).toBe("pending");
    });
});
