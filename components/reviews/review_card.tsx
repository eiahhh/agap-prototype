import Link from "next/link";
import { Advisory_action_buttons } from "@/components/cdrrmo/advisory_action_buttons";
import { find_user_by_id } from "@/lib/auth/demo_users";
import { advisory_level_labels, advisory_status_labels, type advisory, type review_event } from "@/lib/cdrrmo/advisories";
import { Review_badge } from "./review_badge";
import { Review_decision_form } from "./review_decision_form";

const date_time_format = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
});

const event_labels: Record<review_event["action"], string> = {
    submitted: "Submitted for review",
    approved: "Approved",
    changes_requested: "Requested changes",
    reset: "Edited, so it needs review again",
};

function user_name(user_id: string): string {
    return find_user_by_id(user_id)?.name ?? "Unknown user";
}

// One notice in the review queue: the full text the public will see, its review thread,
// and what the signed-in officer can do with it.
export function Review_card({ item, viewer_id }: { item: advisory; viewer_id: string }) {
    const review = item.review!;
    const is_own = review.submitted_by === viewer_id;

    return (
        <li className="rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-5">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                    <span className="inline-block rounded-full bg-agap-line px-2.5 py-0.5 text-[10px] font-semibold text-agap-ink">
                        {advisory_status_labels[item.status]}
                    </span>
                    <Review_badge item={item} />
                    <h3 className="mt-2 text-sm font-medium text-agap-ink">
                        <Link href={`/dashboard/announcements/${item.id}`} className="hover:text-agap-700 hover:underline">
                            {item.title}
                        </Link>
                    </h3>
                    <p className="mt-0.5 text-[11px] leading-[16.5px] text-agap-muted">
                        {advisory_level_labels[item.level]} · {item.coverage}
                        {item.scheduled_for !== undefined && ` · Goes out ${date_time_format.format(item.scheduled_for)}`}
                    </p>
                </div>
                <p className="text-[11px] leading-[16.5px] text-agap-muted">
                    Submitted by {is_own ? "you" : user_name(review.submitted_by)} · {date_time_format.format(review.submitted_at)}
                </p>
            </div>

            <blockquote className="mt-3 whitespace-pre-line rounded-[8px] border-l-2 border-agap-500 bg-white px-4 py-3 text-xs leading-[19px] text-agap-ink">
                {item.message}
            </blockquote>

            {(item.review_log?.length ?? 0) > 0 && (
                <ol aria-label={`Review history for ${item.title}`} className="mt-3 flex flex-col gap-1.5">
                    {item.review_log!.map((event) => (
                        <li key={`${event.at}-${event.action}`} className="text-[11px] leading-[16.5px] text-agap-muted">
                            <span className="font-medium text-agap-ink">{event.by === viewer_id ? "You" : user_name(event.by)}</span>{" "}
                            {event_labels[event.action].toLowerCase()} · {date_time_format.format(event.at)}
                            {event.comment && <span className="block text-agap-ink">“{event.comment}”</span>}
                        </li>
                    ))}
                </ol>
            )}

            {review.state === "in_review" && !is_own && <Review_decision_form advisory_id={item.id} title={item.title} />}

            {review.state === "in_review" && is_own && (
                <p className="mt-4 border-t-[0.8px] border-agap-line pt-3 text-[11px] text-agap-muted">
                    Waiting for another officer to review it.
                </p>
            )}

            {review.state !== "in_review" && (
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t-[0.8px] border-agap-line pt-4">
                    <Link
                        href={`/dashboard/advisories/${item.id}/edit?return_to=/dashboard/announcements/${item.id}`}
                        aria-label={`Edit ${item.title}`}
                        className="flex h-9 items-center rounded-[10px] border-[0.8px] border-agap-line bg-white px-4 text-[11px] font-semibold text-agap-ink transition hover:border-agap-700 hover:text-agap-700"
                    >
                        Edit
                    </Link>
                    <form className="flex">
                        <input type="hidden" name="advisory_id" value={item.id} />
                        <Advisory_action_buttons title={item.title} review_state={review.state} />
                    </form>
                </div>
            )}
        </li>
    );
}
