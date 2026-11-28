import { Auto_refresh } from "@/components/cdrrmo/auto_refresh";
import { Inbox_notifications } from "@/components/cdrrmo/inbox_notifications";
import { Pending_advisories } from "@/components/cdrrmo/pending_advisories";
import { Recent_announcements } from "@/components/cdrrmo/recent_announcements";
import { Weather_widgets } from "@/components/cdrrmo/weather_widgets";
import type { demo_user } from "@/lib/auth/demo_users";
import { list_advisories, list_pending_advisories } from "@/lib/cdrrmo/advisories";
import { track_recent_announcements } from "@/lib/cdrrmo/announcement_tracker";
import { count_inbox_unread, list_inbox_notifications } from "@/lib/cdrrmo/notification_preferences";
import { review_queue } from "@/lib/cdrrmo/review_queue";
import { get_weather_snapshot } from "@/lib/cdrrmo/weather";
import { View_shell } from "./view_shell";

export function Cdrrmo_view({ user }: { user: demo_user }) {
    const snapshot = get_weather_snapshot();
    // One clock for the whole render, so every widget agrees on what "now" is.
    const now = snapshot.observed_at;

    return (
        <View_shell
            eyebrow="CDRRMO Personnel"
            title={`Welcome, ${user.name}`}
            description="Monitor weather, manage class suspension advisories, and follow up on notifications."
        >
            <Auto_refresh />
            <Weather_widgets snapshot={snapshot} details_href="/dashboard/weather" />

            <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-3">
                <div className="min-w-0 lg:col-span-2">
                    <Pending_advisories
                        advisories={list_pending_advisories()}
                        to_review_count={review_queue(list_advisories(), "to_review", user.id).length}
                    />
                    <Recent_announcements announcements={track_recent_announcements(list_advisories(), now)} />
                </div>
                <aside className="min-w-0">
                    <Inbox_notifications
                        notifications={list_inbox_notifications(user.id, 6)}
                        unread_count={count_inbox_unread(user.id)}
                        now={now}
                    />
                </aside>
            </div>
        </View_shell>
    );
}
