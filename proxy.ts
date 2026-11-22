import { NextResponse, type NextRequest } from "next/server";
import { allowed_roles_for } from "@/lib/auth/route_access";
import { session_cookie_name, verify_session } from "@/lib/auth/session_token";
import { find_session_user } from "@/lib/auth/session_user";

const guest_only_paths = ["/login", "/register", "/forgot-password"];

// Optimistic route check: signed-out users can't reach protected pages, signed-in users only reach
// the routes their role allows, and they skip the guest pages. Pages still verify the session themselves.
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const session_cookie = request.cookies.get(session_cookie_name)?.value;
    const user = find_session_user(await verify_session(session_cookie));
    const allowed_roles = allowed_roles_for(pathname);

    let response: NextResponse;
    if (allowed_roles && !user) {
        response = NextResponse.redirect(new URL("/login", request.nextUrl));
    } else if (allowed_roles && user && !allowed_roles.includes(user.role)) {
        response = NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    } else if (user && guest_only_paths.includes(pathname)) {
        response = NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    } else {
        response = NextResponse.next();
    }

    // Clear a cookie that no longer maps to a valid user, so /login and /dashboard can't bounce between each other.
    if (session_cookie && !user) response.cookies.delete(session_cookie_name);

    return response;
}

// Must stay a static list (Next.js reads it at build time). Keep it in sync with route_roles and guest_only_paths.
export const config = {
    matcher: ["/", "/dashboard", "/dashboard/:path*", "/login", "/register", "/forgot-password"],
};
