import type { demo_user } from "@/lib/auth/demo_users";
import { Placeholder_card, View_shell } from "./view_shell";

export function Cdrrmo_view({ user }: { user: demo_user }) {
    return (
        <View_shell
            eyebrow="CDRRMO Personnel"
            title={`Welcome, ${user.name}`}
            description="Monitor alerts and guidance for your area."
        >
            <Placeholder_card label="CDRRMO dashboard coming soon." />
        </View_shell>
    );
}
