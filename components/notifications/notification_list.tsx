import Link from "next/link";
import { notification_kind_labels, type notification_kind } from "@/lib/cdrrmo/notifications";
import type { notification_day } from "@/lib/cdrrmo/notification_page";
import { Read_toggle } from "./read_toggle";

const time_format = new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });

export const kind_dot_class: Record<notification_kind, string> = {
    weather: "bg-amber-500",
    advisory: "bg-agap-500",
    delivery: "bg-red-500",
    system: "bg-agap-muted",
};

// Notifications grouped by day, each with its type, time, link and read toggle.
export function Notification_list({ days, empty_label }: { days: notification_day[]; empty_label: string }) {
    if (days.length === 0) {
        return (
            <p className="mt-4 rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-6 text-center text-xs text-agap-muted">
                {empty_label}
            </p>
        );
    }

    return (
        <div className="mt-4 flex flex-col gap-6">
            {days.map((group) => (
                <section key={group.date} aria-labelledby={`day-${group.date}`}>
                    <h2 id={`day-${group.date}`} className="text-[11px] font-semibold uppercase tracking-[0.5px] text-agap-muted">
                        {group.label}
                    </h2>
                    <ul className="mt-2 flex flex-col divide-y-[0.8px] divide-agap-line overflow-hidden rounded-[10px] border-[0.8px] border-agap-line bg-agap-field">
                        {group.items.map((item) => (
                            <li
                                key={item.id}
                                data-unread={!item.is_read || undefined}
                                className={`flex gap-3 px-5 py-4 ${item.is_read ? "" : "bg-white"}`}
                            >
                                <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${kind_dot_class[item.kind]}`} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-agap-muted">
                                            {notification_kind_labels[item.kind]}
                                            {!item.is_read && <span className="ml-2 normal-case tracking-normal text-agap-700">● Unread</span>}
                                        </p>
                                        <p className="text-[10px] text-agap-muted">{time_format.format(item.created_at)}</p>
                                    </div>
                                    <p className={`mt-0.5 text-sm text-agap-ink ${item.is_read ? "font-normal" : "font-semibold"}`}>{item.title}</p>
                                    <p className="mt-0.5 text-xs leading-[18px] text-agap-muted">{item.body}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-4">
                                        {item.href && (
                                            <Link
                                                href={item.href}
                                                aria-label={`Open “${item.title}”`}
                                                className="text-[10px] font-semibold leading-[15px] text-agap-700 underline hover:text-agap-900"
                                            >
                                                Open
                                            </Link>
                                        )}
                                        <Read_toggle notification_id={item.id} title={item.title} is_read={item.is_read} />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
}
