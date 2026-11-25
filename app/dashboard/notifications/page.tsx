import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { mark_all_notifications_read_action } from "@/app/dashboard/notifications/actions";
import { Notification_list } from "@/components/notifications/notification_list";
import { require_cdrrmo } from "@/lib/auth/current_user";
import { count_unread_notifications, list_notifications, notification_kind_labels, notification_kinds } from "@/lib/cdrrmo/notifications";
import { group_by_day, notification_page_href, parse_notification_filter } from "@/lib/cdrrmo/notification_page";
import { get_weather_snapshot } from "@/lib/cdrrmo/weather";

export const metadata: Metadata = {
    title: "AGAP | Notifications",
};

const chip_class = (is_active: boolean) =>
    `rounded-[8px] px-3 py-1.5 text-[11px] font-semibold transition ${
        is_active ? "bg-agap-700 text-white" : "text-agap-muted hover:bg-agap-line/60 hover:text-agap-ink"
    }`;

export default function notifications_page({ searchParams }: PageProps<"/dashboard/notifications">) {
    return (
        <main className="flex-1 px-6 py-10">
            <div className="mx-auto w-full max-w-[880px]">
                <p className="text-[10px] font-semibold uppercase leading-[15px] tracking-[1px] text-agap-500">Notifications</p>
                <h1 className="pt-1.5 text-4xl font-normal leading-[43.2px] tracking-[-1.08px] text-agap-ink">Inbox</h1>
                <p className="pt-2 text-xs leading-[18px] text-agap-muted">
                    Weather alerts, advisory and review updates, delivery problems and system notices.
                </p>

                <Suspense fallback={<p className="mt-8 text-xs text-agap-muted">Loading notifications…</p>}>
                    <Notifications search_params={searchParams} />
                </Suspense>
            </div>
        </main>
    );
}

// Reads the session and the URL, so it streams in behind the Suspense boundary.
async function Notifications({ search_params }: { search_params: Promise<Record<string, string | string[] | undefined>> }) {
    const user = await require_cdrrmo();
    const filter = parse_notification_filter(await search_params);
    const unread_count = count_unread_notifications(user.id);
    const items = list_notifications(user.id, {
        kind: filter.kind ?? undefined,
        unread_only: filter.unread_only,
    });
    // The weather reading time doubles as the page clock, like the dashboard.
    const now = get_weather_snapshot().observed_at;

    return (
        <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <nav aria-label="Notification type" className="flex flex-wrap gap-1">
                    <Link
                        href={notification_page_href({ ...filter, kind: null })}
                        aria-current={filter.kind === null ? "page" : undefined}
                        className={chip_class(filter.kind === null)}
                    >
                        All
                    </Link>
                    {notification_kinds.map((kind) => (
                        <Link
                            key={kind}
                            href={notification_page_href({ ...filter, kind })}
                            aria-current={filter.kind === kind ? "page" : undefined}
                            className={chip_class(filter.kind === kind)}
                        >
                            {notification_kind_labels[kind]}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <Link
                        href={notification_page_href({
                            ...filter,
                            unread_only: !filter.unread_only,
                        })}
                        aria-pressed={filter.unread_only}
                        className={`rounded-[8px] border-[0.8px] px-3 py-1.5 text-[11px] font-semibold transition ${
                            filter.unread_only
                                ? "border-agap-700 bg-agap-100 text-agap-900"
                                : "border-agap-line bg-white text-agap-muted hover:text-agap-ink"
                        }`}
                    >
                        Unread only ({unread_count})
                    </Link>
                    {unread_count > 0 && (
                        <form action={mark_all_notifications_read_action}>
                            <button type="submit" className="text-[11px] font-semibold text-agap-700 underline hover:text-agap-900">
                                Mark all as read
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <Notification_list
                days={group_by_day(items, now)}
                empty_label={filter.unread_only ? "You're all caught up." : "No notifications here yet."}
            />
        </>
    );
}
