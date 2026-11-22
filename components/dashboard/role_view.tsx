import type { demo_user, user_role } from "@/lib/auth/demo_users";
import { Cdrrmo_view } from "./cdrrmo_view";
import { It_staff_view } from "./it_staff_view";
import { Super_admin_view } from "./super_admin_view";

// One dashboard view per role. Adding a role to user_role makes this a type error until it has a view.
export const role_views: Record<user_role, (props: { user: demo_user }) => React.ReactNode> = {
    cdrrmo: Cdrrmo_view,
    super_admin: Super_admin_view,
    it_staff: It_staff_view,
};

export function Role_view({ user }: { user: demo_user }) {
    const View = role_views[user.role];
    return <View user={user} />;
}
