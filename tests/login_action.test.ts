// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted runs before the imports below, so the mocks exist when the modules load.
const { cookie_jar, redirect_mock } = await vi.hoisted(async () => {
    const { create_cookie_jar, create_redirect_mock } = await import("./helpers/mock_next");
    return { cookie_jar: create_cookie_jar(), redirect_mock: create_redirect_mock() };
});

vi.mock("next/headers", () => ({ cookies: async () => cookie_jar.api }));
vi.mock("next/navigation", () => ({ redirect: redirect_mock }));

import { login, logout } from "@/app/login/actions";
import { session_cookie_name, verify_session } from "@/lib/auth/session_token";
import { make_form_data } from "./helpers/mock_next";

const day_ms = 24 * 60 * 60 * 1000;

beforeEach(() => {
    cookie_jar.store.clear();
    redirect_mock.mockClear();
});

function expect_not_signed_in() {
    expect(cookie_jar.store.has(session_cookie_name)).toBe(false);
    expect(redirect_mock).not.toHaveBeenCalled();
}

describe("login: field validation", () => {
    it("requires both email and password", async () => {
        const state = await login({}, make_form_data({ email: "", password: "" }));

        expect(state.field_errors).toEqual({
            email: "Enter your email address.",
            password: "Enter your password.",
        });
        expect_not_signed_in();
    });

    it("treats missing form fields the same as empty ones", async () => {
        const state = await login({}, new FormData());

        expect(state.field_errors?.email).toBe("Enter your email address.");
        expect(state.field_errors?.password).toBe("Enter your password.");
        expect_not_signed_in();
    });

    it("treats a whitespace-only email as empty", async () => {
        const state = await login({}, make_form_data({ email: "    ", password: "Admin@2026" }));

        expect(state.field_errors?.email).toBe("Enter your email address.");
        expect_not_signed_in();
    });

    it.each(["not-an-email", "name@", "@cdrrmo.gov.ph", "name@cdrrmo", "name @cdrrmo.gov.ph", "name@cdrrmo .gov.ph"])(
        "rejects badly formatted email %j",
        async (email) => {
            const state = await login({}, make_form_data({ email, password: "Admin@2026" }));

            expect(state.field_errors?.email).toBe("Enter a valid email address.");
            expect_not_signed_in();
        },
    );

    it("reports only the password error when the email is valid", async () => {
        const state = await login({}, make_form_data({ email: "admin@cdrrmo.gov.ph", password: "" }));

        expect(state.field_errors).toEqual({ password: "Enter your password." });
        expect_not_signed_in();
    });

    it("does not treat a whitespace password as empty (spaces are valid password characters)", async () => {
        const state = await login({}, make_form_data({ email: "admin@cdrrmo.gov.ph", password: "   " }));

        expect(state.field_errors).toBeUndefined();
        expect(state.form_error).toBe("Incorrect email or password.");
        expect_not_signed_in();
    });

    it("returns the trimmed email so the form can keep it after an error", async () => {
        const state = await login({}, make_form_data({ email: "  name@cdrrmo  ", password: "x" }));

        expect(state.email).toBe("name@cdrrmo");
    });
});

describe("login: credentials", () => {
    it("rejects a wrong password with a generic error", async () => {
        const state = await login({}, make_form_data({ email: "admin@cdrrmo.gov.ph", password: "WrongPass1" }));

        expect(state).toEqual({ form_error: "Incorrect email or password.", email: "admin@cdrrmo.gov.ph" });
        expect_not_signed_in();
    });

    it("gives the same error for an unknown email, so accounts can't be probed", async () => {
        const unknown = await login({}, make_form_data({ email: "nobody@cdrrmo.gov.ph", password: "Admin@2026" }));
        const wrong_password = await login({}, make_form_data({ email: "admin@cdrrmo.gov.ph", password: "nope" }));

        expect(unknown.form_error).toBe(wrong_password.form_error);
        expect(unknown.field_errors).toBeUndefined();
        expect_not_signed_in();
    });

    it("treats passwords as case-sensitive", async () => {
        const state = await login({}, make_form_data({ email: "admin@cdrrmo.gov.ph", password: "admin@2026" }));

        expect(state.form_error).toBe("Incorrect email or password.");
        expect_not_signed_in();
    });

    it("does not accept another account's password", async () => {
        const state = await login({}, make_form_data({ email: "admin@cdrrmo.gov.ph", password: "ItStaff@2026" }));

        expect(state.form_error).toBe("Incorrect email or password.");
        expect_not_signed_in();
    });

    it("accepts an email with different letter case and surrounding spaces", async () => {
        await expect(
            login({}, make_form_data({ email: "  ADMIN@CDRRMO.GOV.PH ", password: "Admin@2026" })),
        ).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    });

    it.each([
        ["cdrrmo@cdrrmo.gov.ph", "Cdrrmo@2026", "u_cdrrmo", "cdrrmo"],
        ["admin@cdrrmo.gov.ph", "Admin@2026", "u_admin", "super_admin"],
        ["it@cdrrmo.gov.ph", "ItStaff@2026", "u_it", "it_staff"],
    ])("signs in %s and redirects to /dashboard", async (email, password, user_id, role) => {
        await expect(login({}, make_form_data({ email, password }))).rejects.toThrow("NEXT_REDIRECT:/dashboard");

        const session = await verify_session(cookie_jar.store.get(session_cookie_name)?.value);
        expect(session).toMatchObject({ user_id, role });
        expect(redirect_mock).toHaveBeenCalledWith("/dashboard");
    });
});

describe("login: session cookie", () => {
    it("sets a secure-by-default HttpOnly cookie that ends with the browser session", async () => {
        await expect(
            login({}, make_form_data({ email: "admin@cdrrmo.gov.ph", password: "Admin@2026" })),
        ).rejects.toThrow("NEXT_REDIRECT");

        const options = cookie_jar.store.get(session_cookie_name)?.options;
        expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
        expect(options).not.toHaveProperty("expires");

        const session = await verify_session(cookie_jar.store.get(session_cookie_name)?.value);
        expect(session!.expires_at - Date.now()).toBeLessThanOrEqual(day_ms);
    });

    it("keeps the user signed in for 30 days when 'Keep me signed in' is ticked", async () => {
        await expect(
            login({}, make_form_data({ email: "admin@cdrrmo.gov.ph", password: "Admin@2026", remember: "on" })),
        ).rejects.toThrow("NEXT_REDIRECT");

        const expires = cookie_jar.store.get(session_cookie_name)?.options?.expires as Date;
        const days_left = (expires.getTime() - Date.now()) / day_ms;
        expect(days_left).toBeGreaterThan(29.9);
        expect(days_left).toBeLessThanOrEqual(30);
    });

    it("signs the user out by deleting the cookie and redirecting to /login", async () => {
        await expect(
            login({}, make_form_data({ email: "admin@cdrrmo.gov.ph", password: "Admin@2026" })),
        ).rejects.toThrow("NEXT_REDIRECT");
        expect(cookie_jar.store.has(session_cookie_name)).toBe(true);

        await expect(logout()).rejects.toThrow("NEXT_REDIRECT:/login");
        expect(cookie_jar.store.has(session_cookie_name)).toBe(false);
    });
});
