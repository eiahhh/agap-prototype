import type { demo_user } from "@/lib/auth/demo_users";
import { Placeholder_card, View_shell } from "./view_shell";

export function It_staff_view({ user }: { user: demo_user }) {
    return (
        <View_shell
            eyebrow="IT Staff"
            title={`Welcome, ${user.name}`}
            description="Keep the portal and its accounts running smoothly."
        >
            <Placeholder_card label="IT Staff dashboard coming soon." />
        </View_shell>
    );
}
