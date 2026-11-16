import { cookies } from "next/headers";
import type { user_role } from "./demo_users";
import { session_cookie_name, sign_session, verify_session, type session_payload } from "./session_token";

const one_day_ms = 24 * 60 * 60 * 1000;
const remembered_session_ms = 30 * one_day_ms;
const browser_session_ms = one_day_ms;

export async function create_session(user_id: string, role: user_role, is_remembered: boolean) {
    const lifetime_ms = is_remembered ? remembered_session_ms : browser_session_ms;
    const expires_at = Date.now() + lifetime_ms;
    const token = await sign_session({ user_id, role, expires_at });

    (await cookies()).set(session_cookie_name, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        // "Keep me signed in" persists the cookie; otherwise it ends when the browser closes.
        ...(is_remembered ? { expires: new Date(expires_at) } : {}),
    });
}

export async function get_session(): Promise<session_payload | null> {
    return verify_session((await cookies()).get(session_cookie_name)?.value);
}

export async function delete_session() {
    (await cookies()).delete(session_cookie_name);
}
