// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { config, proxy } from "@/proxy";
import { session_cookie_name, sign_session } from "@/lib/auth/session_token";

async function request_for(pathname: string, is_signed_in: boolean) {
    const request = new NextRequest(new URL(pathname, "http://localhost:3000"));
    if (is_signed_in) {
        const token = await sign_session({ user_id: "u_cdrrmo", role: "cdrrmo", expires_at: Date.now() + 60_000 });
        request.cookies.set(session_cookie_name, token);
    }
    return request;
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
});
