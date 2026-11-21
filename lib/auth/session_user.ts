import { find_user_by_id, type demo_user } from "./demo_users";
import type { session_payload } from "./session_token";

// The user behind a verified session, or null when the account is gone or its role
// no longer matches the role the session was signed with. No Next.js imports, so proxy.ts can use it too.
export function find_session_user(session: session_payload | null): demo_user | null {
    if (!session) return null;
    const user = find_user_by_id(session.user_id);
    return user && user.role === session.role ? user : null;
}
