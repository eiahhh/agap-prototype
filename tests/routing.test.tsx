import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { NextRequest } from "next/server";
import not_found_page from "@/app/not-found";
import unauthorized_page from "@/app/unauthorized/page";
import type { user_role } from "@/lib/auth/demo_users";
import { allowed_roles_for } from "@/lib/auth/route_access";
import { session_cookie_name, sign_session } from "@/lib/auth/session_token";
import { config, proxy } from "@/proxy";

const signed_in_as = {
    cdrrmo: { user_id: "u_cdrrmo", role: "cdrrmo" },
    super_admin: { user_id: "u_admin", role: "super_admin" },
    it_staff: { user_id: "u_it", role: "it_staff" },
} as const;

async function visit(pathname: string, role?: user_role) {
    const request = new NextRequest(new URL(pathname, "http://localhost:3000"));
    if (role) {
        const token = await sign_session({ ...signed_in_as[role], expires_at: Date.now() + 60_000 });
        request.cookies.set(session_cookie_name, token);
    }
    const response = await proxy(request);
    const location = response.headers.get("location");
    return location ? new URL(location).pathname : null;
}

afterEach(() => {
    cleanup();
});

describe("routing: signed out", () => {
    it.each(["/", "/dashboard", "/dashboard/requests"])("sends %s to /login", async (pathname) => {
        expect(await visit(pathname)).toBe("/login");
    });

    it.each(["/login", "/register", "/forgot-password", "/unauthorized"])("lets visitors open %s", async (pathname) => {
        expect(await visit(pathname)).toBeNull();
    });
});

describe("routing: signed in", () => {
    it.each(["cdrrmo", "super_admin", "it_staff"] as const)("sends %s from / to /dashboard", async (role) => {
        expect(await visit("/", role)).toBe("/dashboard");
    });

    it.each(["cdrrmo", "super_admin", "it_staff"] as const)("lets %s open /dashboard", async (role) => {
        expect(await visit("/dashboard", role)).toBeNull();
    });

    it("lets the Super Admin open /dashboard/requests", async () => {
        expect(await visit("/dashboard/requests", "super_admin")).toBeNull();
    });

    it.each(["/login", "/register", "/forgot-password"])("sends signed-in users from %s to /dashboard", async (pathname) => {
        expect(await visit(pathname, "cdrrmo")).toBe("/dashboard");
    });
});

describe("routing: wrong role", () => {
    it.each(["cdrrmo", "it_staff"] as const)("sends %s from /dashboard/requests to /unauthorized", async (role) => {
        expect(await visit("/dashboard/requests", role)).toBe("/unauthorized");
    });

    it.each(["super_admin", "it_staff"] as const)("sends %s from advisory editing to /unauthorized", async (role) => {
        expect(await visit("/dashboard/advisories/some-id/edit", role)).toBe("/unauthorized");
    });

    it.each(["super_admin", "it_staff"] as const)("sends %s from new advisory to /unauthorized", async (role) => {
        expect(await visit("/dashboard/advisories/new", role)).toBe("/unauthorized");
    });

    it.each(["/dashboard/advisories/new", "/dashboard/advisories/some-id/edit"])("lets CDRRMO personnel open %s", async (pathname) => {
        expect(await visit(pathname, "cdrrmo")).toBeNull();
    });

    it("also blocks pages nested under a restricted route", async () => {
        expect(await visit("/dashboard/requests/some-id", "cdrrmo")).toBe("/unauthorized");
    });
});

describe("route-to-role map", () => {
    it("uses the most specific route", () => {
        expect(allowed_roles_for("/dashboard/requests")).toEqual(["super_admin"]);
        expect(allowed_roles_for("/dashboard")).toEqual(["cdrrmo", "super_admin", "it_staff"]);
    });

    it("only matches whole path segments", () => {
        expect(allowed_roles_for("/dashboardx")).toBeNull();
        expect(allowed_roles_for("/dashboard/requests-archive")).toEqual(["cdrrmo", "super_admin", "it_staff"]);
    });

    it("treats public pages as open to everyone", () => {
        expect(allowed_roles_for("/login")).toBeNull();
        expect(allowed_roles_for("/unauthorized")).toBeNull();
    });

    it("runs the proxy on / and the dashboard routes", () => {
        expect(config.matcher).toEqual(expect.arrayContaining(["/", "/dashboard", "/dashboard/:path*"]));
    });
});

describe("error pages", () => {
    it("shows a 404 page with a link home", () => {
        render(not_found_page());

        expect(screen.getByRole("heading", { name: "Page not found" })).toBeTruthy();
        expect(screen.getByRole("link", { name: "Go to home" }).getAttribute("href")).toBe("/");
    });

    it("shows an access denied page with a link back to the dashboard", () => {
        render(unauthorized_page());

        expect(screen.getByRole("heading", { name: "Access denied" })).toBeTruthy();
        expect(screen.getByRole("link", { name: "Back to dashboard" }).getAttribute("href")).toBe("/dashboard");
    });
});
