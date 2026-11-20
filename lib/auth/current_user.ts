import { redirect } from "next/navigation";
import { find_user_by_id, type demo_user } from "./demo_users";
import { get_session } from "./session";

// Returns the signed-in user, or sends the visitor to the login page.
export async function require_user(): Promise<demo_user> {
    const session = await get_session();
    const user = session ? find_user_by_id(session.user_id) : null;
    if (!user) redirect("/login");
    return user;
}

// Only Super Admins can review account requests. Everyone else goes back to the dashboard.
export async function require_super_admin(): Promise<demo_user> {
    const user = await require_user();
    if (user.role !== "super_admin") redirect("/dashboard");
    return user;
}
