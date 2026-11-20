import { NextResponse, type NextRequest } from "next/server";
import { session_cookie_name, verify_session } from "@/lib/auth/session_token";

const protected_prefixes = ["/dashboard"];
const guest_only_paths = ["/login", "/forgot-password"];

// Optimistic route check: signed-out users can't reach protected pages,
// signed-in users skip the login and forgot password pages. Pages still verify the session themselves.
export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const session = await verify_session(request.cookies.get(session_cookie_name)?.value);

    if (!session && protected_prefixes.some((prefix) => pathname.startsWith(prefix))) {
        return NextResponse.redirect(new URL("/login", request.nextUrl));
    }

    if (session && guest_only_paths.includes(pathname)) {
        return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/forgot-password"],
};
