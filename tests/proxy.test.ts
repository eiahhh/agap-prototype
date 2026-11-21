// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { config, proxy } from "@/proxy";
import type { user_role } from "@/lib/auth/demo_users";
import { session_cookie_name, sign_session } from "@/lib/auth/session_token";

async function request_for(pathname: string, is_signed_in: boolean) {
    const request = new NextRequest(new URL(pathname, "http://localhost:3000"));
    if (is_signed_in) {
        const token = await sign_session({ user_id: "u_cdrrmo", role: "cdrrmo", expires_at: Date.now() + 60_000 });
        request.cookies.set(session_cookie_name, token);
    }
    return request;
}

async function request_with_session(pathname: string, user_id: string, role: string) {
    const request = new NextRequest(new URL(pathname, "http://localhost:3000"));
    const token = await sign_session({ user_id, role: role as user_role, expires_at: Date.now() + 60_000 });
    request.cookies.set(session_cookie_name, token);
    return request;
}

function clears_session_cookie(response: Response): boolean {
    const set_cookie = response.headers.get("set-cookie") ?? "";
    return set_cookie.startsWith(`${session_cookie_name}=;`) || /agap_session=;.*(Max-Age=0|Expires=Thu, 01 Jan 1970)/i.test(set_cookie);
}

function redirect_target(response: Response): string | null {
    const location = response.headers.get("location");
    return location ? new URL(location).pathname : null;
}

describe("proxy", () => {
    it("lets signed-out visitors open the forgot password page", async () => {
        const response = await proxy(await request_for("/forgot-password", false));

        expect(redirect_target(response)).toBeNull();
    });

    it("sends signed-in users from the forgot password page to the dashboard", async () => {
        const response = await proxy(await request_for("/forgot-password", true));

        expect(redirect_target(response)).toBe("/dashboard");
    });

    it("still sends signed-in users from the login page to the dashboard", async () => {
        const response = await proxy(await request_for("/login", true));

        expect(redirect_target(response)).toBe("/dashboard");
    });

    it("still sends signed-out visitors from the dashboard to login", async () => {
        const response = await proxy(await request_for("/dashboard", false));

        expect(redirect_target(response)).toBe("/login");
    });

    it("runs on the forgot password page", () => {
        expect(config.matcher).toContain("/forgot-password");
    });

    it("lets signed-out visitors open the register page", async () => {
        const response = await proxy(await request_for("/register", false));

        expect(redirect_target(response)).toBeNull();
    });

    it("sends signed-in users from the register page to the dashboard", async () => {
        const response = await proxy(await request_for("/register", true));

        expect(redirect_target(response)).toBe("/dashboard");
    });

    it("runs on the register page", () => {
        expect(config.matcher).toContain("/register");
    });

    it.each([
        ["an unknown role", "u_cdrrmo", "guest"],
        ["a role that doesn't match the account", "u_cdrrmo", "super_admin"],
        ["an account that no longer exists", "u_removed", "cdrrmo"],
    ])("sends a session with %s from the dashboard to login and clears it", async (_label, user_id, role) => {
        const response = await proxy(await request_with_session("/dashboard", user_id, role));

        expect(redirect_target(response)).toBe("/login");
        expect(clears_session_cookie(response)).toBe(true);
    });

    it("lets a session with an invalid role open the login page instead of bouncing back to the dashboard", async () => {
        const response = await proxy(await request_with_session("/login", "u_cdrrmo", "guest"));

        expect(redirect_target(response)).toBeNull();
        expect(clears_session_cookie(response)).toBe(true);
    });

    it("keeps a valid session cookie", async () => {
        const response = await proxy(await request_with_session("/dashboard", "u_cdrrmo", "cdrrmo"));

        expect(redirect_target(response)).toBeNull();
        expect(clears_session_cookie(response)).toBe(false);
    });
});
