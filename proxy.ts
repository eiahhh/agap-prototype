import { NextResponse, type NextRequest } from "next/server";
import { session_cookie_name, verify_session } from "@/lib/auth/session_token";
import { find_session_user } from "@/lib/auth/session_user";

const protected_prefixes = ["/dashboard"];
const guest_only_paths = ["/login", "/register", "/forgot-password"];

// Optimistic route check: signed-out users can't reach protected pages,
// signed-in users skip the login, register and forgot password pages. Pages still verify the session themselves.
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const session_cookie = request.cookies.get(session_cookie_name)?.value;
    const user = find_session_user(await verify_session(session_cookie));

    let response: NextResponse;
    if (!user && protected_prefixes.some((prefix) => pathname.startsWith(prefix))) {
        response = NextResponse.redirect(new URL("/login", request.nextUrl));
    } else if (user && guest_only_paths.includes(pathname)) {
        response = NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    } else {
        response = NextResponse.next();
    }

    // Clear a cookie that no longer maps to a valid user, so /login and /dashboard can't bounce between each other.
    if (session_cookie && !user) response.cookies.delete(session_cookie_name);

    return response;
}

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/register", "/forgot-password"],
};
