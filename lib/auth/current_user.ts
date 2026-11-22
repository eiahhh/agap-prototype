import { redirect } from "next/navigation";
import type { demo_user } from "./demo_users";
import { get_session } from "./session";
import { find_session_user } from "./session_user";

// Returns the signed-in user, or sends the visitor to the login page when the session
// is missing, expired, tampered with, or its role doesn't match the account.
export async function require_user(): Promise<demo_user> {
    const user = find_session_user(await get_session());
    if (!user) redirect("/login");
    return user;
}

// Only Super Admins can review account requests. Everyone else sees the unauthorized page.
export async function require_super_admin(): Promise<demo_user> {
    const user = await require_user();
    if (user.role !== "super_admin") redirect("/unauthorized");
    return user;
}
