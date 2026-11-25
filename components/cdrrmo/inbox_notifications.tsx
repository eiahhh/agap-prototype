import Link from "next/link";
import { mark_all_notifications_read_action, mark_notification_read_action } from "@/app/dashboard/notifications/actions";
import { notification_kind_labels, type notification_view, type notification_kind } from "@/lib/cdrrmo/notifications";
import { Widget_card } from "./widget_card";

const relative_format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

const kind_dot_class: Record<notification_kind, string> = {
    weather: "bg-amber-500",
    advisory: "bg-agap-500",
    delivery: "bg-red-500",
    system: "bg-agap-muted",
};

export function format_time_ago(timestamp: number, now: number): string {
    const minutes = Math.round((now - timestamp) / 60_000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return relative_format.format(-minutes, "minute");
    const hours = Math.round(minutes / 60);
    if (hours < 24) return relative_format.format(-hours, "hour");
    return relative_format.format(-Math.round(hours / 24), "day");
}

const text_button_class =
    "text-[10px] font-semibold leading-[15px] text-agap-700 underline outline-none hover:text-agap-900 focus-visible:ring-2 focus-visible:ring-agap-700/30";

// Latest system notifications for CDRRMO personnel, with unread ones highlighted.
export function Inbox_notifications({
    notifications,
    unread_count,
    now,
}: {
    notifications: notification_view[];
    unread_count: number;
    now: number;
}) {
    return (
        <section aria-labelledby="inbox-heading" className="mt-8">
            <div className="flex items-baseline justify-between gap-2">
                <h2 id="inbox-heading" className="flex items-center gap-2 text-base font-medium text-agap-ink">
                    Inbox
                    {unread_count > 0 && (
                        <span
                            aria-label={`${unread_count} unread`}
                            className="rounded-full bg-agap-700 px-2 py-0.5 text-[10px] font-semibold text-white"
                        >
                            {unread_count}
                        </span>
                    )}
                </h2>
                {unread_count > 0 && (
                    <form action={mark_all_notifications_read_action}>
                        <button type="submit" className={text_button_class}>
                            Mark all as read
                        </button>
                    </form>
                )}
            </div>

            <Widget_card title="Notifications" className="mt-3">
                {notifications.length === 0 ? (
                    <p className="text-center text-xs text-agap-muted">You&apos;re all caught up.</p>
                ) : (
                    <ul className="flex flex-col divide-y-[0.8px] divide-agap-line">
                        {notifications.map((item) => (
                            <Notification_row key={item.id} item={item} now={now} />
                        ))}
                    </ul>
                )}
            </Widget_card>
        </section>
    );
}

function Notification_row({ item, now }: { item: notification_view; now: number }) {
    const is_unread = !item.is_read;

    return (
        <li className="flex gap-3 py-3 first:pt-0 last:pb-0" data-unread={is_unread || undefined}>
            <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${kind_dot_class[item.kind]}`} />
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-agap-muted">
                        {notification_kind_labels[item.kind]}
                        {is_unread && <span className="sr-only"> (unread)</span>}
                    </p>
                    <p className="shrink-0 text-[10px] text-agap-muted">{format_time_ago(item.created_at, now)}</p>
                </div>
                <p className={`mt-0.5 text-xs text-agap-ink ${is_unread ? "font-semibold" : "font-normal"}`}>
                    {item.href ? (
                        <Link href={item.href} className="hover:text-agap-700 hover:underline">
                            {item.title}
                        </Link>
                    ) : (
                        item.title
                    )}
                </p>
                <p className="mt-0.5 text-[11px] leading-[16.5px] text-agap-muted">{item.body}</p>
                {is_unread && (
                    <form action={mark_notification_read_action} className="mt-1.5">
                        <input type="hidden" name="notification_id" value={item.id} />
                        <button type="submit" aria-label={`Mark “${item.title}” as read`} className={text_button_class}>
                            Mark as read
                        </button>
                    </form>
                )}
            </div>
        </li>
    );
}
