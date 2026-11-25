import Link from "next/link";
import { Advisory_action_buttons } from "@/components/cdrrmo/advisory_action_buttons";
import {
    advisory_level_labels,
    advisory_status_labels,
    is_archived,
    is_pending,
    type advisory,
    type advisory_status,
} from "@/lib/cdrrmo/advisories";
import { Archive_button } from "./archive_button";

const date_time_format = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
});

export const announcement_status_badge_class: Record<advisory_status, string> = {
    draft: "bg-agap-line text-agap-ink",
    scheduled: "bg-sky-100 text-sky-900",
    published: "bg-agap-100 text-agap-900",
    cancelled: "bg-red-50 text-red-800",
};

const secondary_link_class =
    "flex h-9 items-center rounded-[10px] border-[0.8px] border-agap-line bg-white px-4 text-[11px] font-semibold text-agap-ink transition hover:border-agap-700 hover:text-agap-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agap-700/30";

export function timeline_label(item: advisory): string {
    if (item.status === "scheduled" && item.scheduled_for !== undefined) return `Goes out ${date_time_format.format(item.scheduled_for)}`;
    if (item.status === "published" && item.published_at !== undefined) return `Published ${date_time_format.format(item.published_at)}`;
    if (item.status === "cancelled" && item.cancelled_at !== undefined) return `Cancelled ${date_time_format.format(item.cancelled_at)}`;
    return `Last edited ${date_time_format.format(item.updated_at)}`;
}

export function Announcement_list({ items, empty_label }: { items: advisory[]; empty_label: string }) {
    if (items.length === 0) {
        return (
            <p className="mt-4 rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-6 text-center text-xs text-agap-muted">
                {empty_label}
            </p>
        );
    }

    return (
        <ul className="mt-4 flex flex-col gap-3">
            {items.map((item) => (
                <li key={item.id} className="rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-5">
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                        <div className="min-w-0">
                            <span
                                className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${announcement_status_badge_class[item.status]}`}
                            >
                                {advisory_status_labels[item.status]}
                            </span>
                            {is_archived(item) && <Archived_badge />}
                            <h3 className="mt-2 text-sm font-medium text-agap-ink">
                                <Link href={`/dashboard/announcements/${item.id}`} className="hover:text-agap-700 hover:underline">
                                    {item.title}
                                </Link>
                            </h3>
                            <p className="mt-0.5 text-[11px] leading-[16.5px] text-agap-muted">
                                {advisory_level_labels[item.level]} · {item.coverage}
                            </p>
                        </div>
                        <p className="text-[11px] leading-[16.5px] text-agap-muted">{timeline_label(item)}</p>
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs leading-[18px] text-agap-muted">{item.message}</p>

                    {!is_pending(item) && (
                        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                            <Link href={`/dashboard/announcements/${item.id}`} className={secondary_link_class}>
                                View
                            </Link>
                            <Archive_button advisory_id={item.id} title={item.title} is_archived={is_archived(item)} />
                        </div>
                    )}

                    {is_pending(item) && (
                        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                            <Link
                                href={`/dashboard/advisories/${item.id}/edit?return_to=/dashboard/announcements`}
                                aria-label={`Edit ${item.title}`}
                                className={secondary_link_class}
                            >
                                Edit
                            </Link>
                            <form className="flex">
                                <input type="hidden" name="advisory_id" value={item.id} />
                                <Advisory_action_buttons title={item.title} />
                            </form>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
}

export function Archived_badge() {
    return (
        <span className="ml-2 inline-block rounded-full bg-agap-muted/15 px-2.5 py-0.5 text-[10px] font-semibold text-agap-muted">
            Archived
        </span>
    );
}
