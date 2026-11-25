import { Pending_advisories } from "@/components/cdrrmo/pending_advisories";
import { Weather_widgets } from "@/components/cdrrmo/weather_widgets";
import type { demo_user } from "@/lib/auth/demo_users";
import { list_pending_advisories } from "@/lib/cdrrmo/advisories";
import { get_weather_snapshot } from "@/lib/cdrrmo/weather";
import { View_shell } from "./view_shell";

export function Cdrrmo_view({ user }: { user: demo_user }) {
    return (
        <View_shell
            eyebrow="CDRRMO Personnel"
            title={`Welcome, ${user.name}`}
            description="Monitor weather, manage class suspension advisories, and follow up on notifications."
        >
            <Weather_widgets snapshot={get_weather_snapshot()} />
            <Pending_advisories advisories={list_pending_advisories()} />
        </View_shell>
    );
}
