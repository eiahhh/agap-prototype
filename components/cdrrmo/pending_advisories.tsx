import Link from "next/link";
import {
    advisory_level_labels,
    advisory_status_labels,
    type advisory,
} from "@/lib/cdrrmo/advisories";
import { primary_button_class } from "@/components/auth/form_styles";
import { Review_badge } from "@/components/reviews/review_badge";
import { Advisory_action_buttons } from "./advisory_action_buttons";
import { Widget_card } from "./widget_card";

const date_time_format = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
});

const status_badge_class = {
    draft: "bg-agap-line text-agap-ink",
    scheduled: "bg-sky-100 text-sky-900",
} as const;

// Drafted or scheduled class suspension advisories awaiting final review, with quick actions.
export function Pending_advisories({ advisories, to_review_count = 0 }: { advisories: advisory[]; to_review_count?: number }) {
    return (
        <section aria-labelledby="advisories-heading" className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="advisories-heading" className="text-base font-medium text-agap-ink">
                    Class suspension advisories awaiting review
                </h2>
                <div className="flex items-center gap-3">
                    <p className="text-[11px] leading-[16.5px] text-agap-muted">
                        {advisories.length} {advisories.length === 1 ? "advisory" : "advisories"} pending ·{" "}
                        <Link href="/dashboard/announcements" className="font-semibold text-agap-700 underline">
                            Manage all
                        </Link>
                    </p>
                    <Link href="/dashboard/advisories/new" className={`h-9 text-[11px] ${primary_button_class}`}>
                        New advisory
                    </Link>
                </div>
            </div>

            {to_review_count > 0 && (
                <Link
                    href="/dashboard/reviews"
                    className="mt-3 flex items-center justify-between gap-3 rounded-[10px] border-[0.8px] border-violet-200 bg-violet-50 px-4 py-3 text-xs text-violet-950 transition hover:border-violet-400"
                >
                    <span>
                        <span className="font-semibold">
                            {to_review_count} {to_review_count === 1 ? "notice is" : "notices are"} waiting for your review
                        </span>{" "}
                        before they can be published.
                    </span>
                    <span aria-hidden className="font-semibold">Review →</span>
                </Link>
            )}

            {advisories.length === 0 ? (
                <Widget_card title="Pending advisories" className="mt-3">
                    <p className="text-center text-xs text-agap-muted">No drafted or scheduled advisories.</p>
                </Widget_card>
            ) : (
                <ul className="mt-3 flex flex-col gap-3">
                    {advisories.map((item) => (
                        <Advisory_card key={item.id} item={item} />
                    ))}
                </ul>
            )}
        </section>
    );
}

function Advisory_card({ item }: { item: advisory }) {
    const status = item.status as keyof typeof status_badge_class;

    return (
        <li className="rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-5">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                    <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${status_badge_class[status]}`}
                    >
                        {advisory_status_labels[item.status]}
                    </span>
                    <Review_badge item={item} />
                    <h3 className="mt-2 text-sm font-medium text-agap-ink">{item.title}</h3>
                </div>
                <p className="text-[11px] leading-[16.5px] text-agap-muted">
                    {item.status === "scheduled" && item.scheduled_for !== undefined
                        ? `Goes out ${date_time_format.format(item.scheduled_for)}`
                        : `Last edited ${date_time_format.format(item.updated_at)}`}
                </p>
            </div>

            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
                <div>
                    <dt className="text-[11px] leading-[16.5px] text-agap-muted">Levels</dt>
                    <dd className="font-medium text-agap-ink">{advisory_level_labels[item.level]}</dd>
                </div>
                <div>
                    <dt className="text-[11px] leading-[16.5px] text-agap-muted">Coverage</dt>
                    <dd className="break-words font-medium text-agap-ink">{item.coverage}</dd>
                </div>
            </dl>
            <p className="mt-3 line-clamp-2 text-xs leading-[18px] text-agap-muted">{item.message}</p>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                <Link
                    href={`/dashboard/advisories/${item.id}/edit`}
                    aria-label={`Edit ${item.title}`}
                    className="flex h-9 items-center rounded-[10px] border-[0.8px] border-agap-line bg-white px-4 text-[11px] font-semibold text-agap-ink transition hover:border-agap-700 hover:text-agap-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agap-700/30"
                >
                    Edit
                </Link>
                <form className="flex">
                    <input type="hidden" name="advisory_id" value={item.id} />
                    <Advisory_action_buttons title={item.title} review_state={item.review?.state} />
                </form>
            </div>
        </li>
    );
}
