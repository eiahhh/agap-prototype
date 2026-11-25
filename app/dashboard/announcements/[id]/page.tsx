import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { announcement_status_badge_class, Archived_badge } from "@/components/announcements/announcement_list";
import { Archive_button } from "@/components/announcements/archive_button";
import { primary_button_class } from "@/components/auth/form_styles";
import { Review_badge } from "@/components/reviews/review_badge";
import { Advisory_action_buttons } from "@/components/cdrrmo/advisory_action_buttons";
import { Delivery_cell, delivery_status_badge_class } from "@/components/cdrrmo/recent_announcements";
import { require_cdrrmo } from "@/lib/auth/current_user";
import {
    advisory_level_labels,
    advisory_status_labels,
    find_advisory,
    is_archived,
    is_pending,
    type advisory,
} from "@/lib/cdrrmo/advisories";
import { announcement_history } from "@/lib/cdrrmo/announcement_history";
import { announcement_status, announcement_status_labels, channel_deliveries } from "@/lib/cdrrmo/announcement_tracker";

export const metadata: Metadata = {
    title: "AGAP | Announcement",
};

const date_time_format = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
});

export default function announcement_page({ params }: PageProps<"/dashboard/announcements/[id]">) {
    return (
        <main className="flex-1 px-6 py-10">
            <div className="mx-auto w-full max-w-[880px]">
                <Link href="/dashboard/announcements" className="text-[11px] font-semibold leading-[16.5px] text-agap-700 underline">
                    Back to announcements
                </Link>
                <Suspense fallback={<p className="mt-8 text-xs text-agap-muted">Loading announcement…</p>}>
                    <Announcement params={params} />
                </Suspense>
            </div>
        </main>
    );
}

// Reads the session and the URL, so it streams in behind the Suspense boundary.
async function Announcement({ params }: { params: Promise<{ id: string }> }) {
    await require_cdrrmo();
    const { id } = await params;
    const item = find_advisory(id);

    if (!item) {
        return (
            <p className="mt-8 rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-6 text-center text-xs text-agap-muted">
                This announcement doesn&apos;t exist.
            </p>
        );
    }

    const deliveries = channel_deliveries(item);
    const detail_path = `/dashboard/announcements/${item.id}`;

    return (
        <article className="mt-6">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${announcement_status_badge_class[item.status]}`}>
                {advisory_status_labels[item.status]}
            </span>
            {is_archived(item) && <Archived_badge />}
            {is_pending(item) && <Review_badge item={item} />}
            {(item.revisions?.length ?? 0) > 0 && (
                <span className="ml-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-900">
                    Updated
                </span>
            )}
            <h1 className="pt-2 text-3xl font-normal leading-[38px] tracking-[-0.9px] text-agap-ink">{item.title}</h1>

            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
                <Detail label="Levels" value={advisory_level_labels[item.level]} />
                <Detail label="Coverage" value={item.coverage} />
                <Detail label="Status" value={status_line(item)} />
            </dl>

            <section aria-labelledby="message-heading" className="mt-6 rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-5">
                <h2 id="message-heading" className="text-[11px] font-semibold uppercase tracking-[0.5px] text-agap-muted">
                    Notice
                </h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-[22px] text-agap-ink">{item.message}</p>
            </section>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                {is_pending(item) && (
                    <>
                        <Link
                            href={`/dashboard/advisories/${item.id}/edit?return_to=${detail_path}`}
                            aria-label={`Edit ${item.title}`}
                            className="flex h-9 items-center rounded-[10px] border-[0.8px] border-agap-line bg-white px-4 text-[11px] font-semibold text-agap-ink transition hover:border-agap-700 hover:text-agap-700"
                        >
                            Edit
                        </Link>
                        <form className="flex">
                            <input type="hidden" name="advisory_id" value={item.id} />
                            <Advisory_action_buttons title={item.title} review_state={item.review?.state} />
                        </form>
                    </>
                )}
                {!is_pending(item) && (
                    <Archive_button advisory_id={item.id} title={item.title} is_archived={is_archived(item)} />
                )}
                {item.status === "published" && !is_archived(item) && (
                    <Link
                        href={`/dashboard/advisories/${item.id}/edit?return_to=${detail_path}`}
                        className={`h-9 text-[11px] ${primary_button_class}`}
                    >
                        Update notice
                    </Link>
                )}
            </div>

            {deliveries.length > 0 && (
                <section aria-labelledby="delivery-heading" className="mt-8">
                    <div className="flex items-center gap-2">
                        <h2 id="delivery-heading" className="text-base font-medium text-agap-ink">
                            Delivery
                        </h2>
                        <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${delivery_status_badge_class[announcement_status(item, deliveries)]}`}
                        >
                            {announcement_status_labels[announcement_status(item, deliveries)]}
                        </span>
                    </div>
                    <ul aria-label={`Delivery status for ${item.title}`} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {deliveries.map((delivery) => (
                            <Delivery_cell key={delivery.channel} delivery={delivery} />
                        ))}
                    </ul>
                </section>
            )}

            <section aria-labelledby="history-heading" className="mt-8">
                <h2 id="history-heading" className="text-base font-medium text-agap-ink">
                    History
                </h2>
                <ol className="mt-3 flex flex-col gap-3 border-l-[0.8px] border-agap-line pl-4">
                    {announcement_history(item).map((entry) => (
                        <li key={`${entry.at}-${entry.label}`} className="relative">
                            <span aria-hidden className="absolute -left-[20.5px] top-1.5 size-2 rounded-full bg-agap-500" />
                            <p className="text-xs font-medium text-agap-ink">{entry.label}</p>
                            <p className="text-[10px] text-agap-muted">
                                {date_time_format.format(entry.at)}
                                {entry.by && ` · ${entry.by}`}
                            </p>
                            {entry.detail && <p className="mt-1 text-[11px] leading-[16.5px] text-agap-muted">{entry.detail}</p>}
                        </li>
                    ))}
                </ol>
            </section>
        </article>
    );
}

function status_line(item: advisory): string {
    if (item.status === "scheduled" && item.scheduled_for !== undefined) return `Goes out ${date_time_format.format(item.scheduled_for)}`;
    if (item.status === "published" && item.published_at !== undefined) return `Published ${date_time_format.format(item.published_at)}`;
    if (item.status === "cancelled" && item.cancelled_at !== undefined) return `Cancelled ${date_time_format.format(item.cancelled_at)}`;
    return `Draft, last edited ${date_time_format.format(item.updated_at)}`;
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <dt className="text-[11px] leading-[16.5px] text-agap-muted">{label}</dt>
            <dd className="break-words font-medium text-agap-ink">{value}</dd>
        </div>
    );
}
