import { advisory_level_labels } from "@/lib/cdrrmo/advisories";
import {
    announcement_status_labels,
    delivery_channel_labels,
    type announcement_status,
    type channel_delivery,
    type tracked_announcement,
} from "@/lib/cdrrmo/announcement_tracker";

const date_time_format = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
});

const number_format = new Intl.NumberFormat("en-PH");

const status_badge_class: Record<announcement_status, string> = {
    delivered: "bg-agap-100 text-agap-900",
    delivering: "bg-sky-100 text-sky-900",
    partially_failed: "bg-red-100 text-red-900",
    cancelled: "bg-agap-line text-agap-muted",
};

const delivery_text_class: Record<channel_delivery["state"], string> = {
    delivered: "text-agap-700",
    sending: "text-sky-800",
    failed: "text-red-700",
};

// Recently published or cancelled advisories, with delivery progress per channel.
export function Recent_announcements({ announcements }: { announcements: tracked_announcement[] }) {
    return (
        <section aria-labelledby="announcements-heading" className="mt-8">
            <h2 id="announcements-heading" className="text-base font-medium text-agap-ink">
                Recent announcements &amp; status tracker
            </h2>

            {announcements.length === 0 ? (
                <p className="mt-3 rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-6 text-center text-xs text-agap-muted">
                    No announcements have been published yet.
                </p>
            ) : (
                <ol className="mt-3 flex flex-col gap-3">
                    {announcements.map((announcement) => (
                        <Announcement_row key={announcement.advisory.id} announcement={announcement} />
                    ))}
                </ol>
            )}
        </section>
    );
}

function Announcement_row({ announcement }: { announcement: tracked_announcement }) {
    const { advisory: item, status, deliveries, happened_at } = announcement;

    return (
        <li className="rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-5">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                    <h3 className="text-sm font-medium text-agap-ink">{item.title}</h3>
                    <p className="mt-0.5 text-[11px] leading-[16.5px] text-agap-muted">
                        {advisory_level_labels[item.level]} · {item.coverage}
                    </p>
                </div>
                <div className="text-right">
                    <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${status_badge_class[status]}`}
                    >
                        {announcement_status_labels[status]}
                    </span>
                    <p className="mt-1 text-[11px] leading-[16.5px] text-agap-muted">
                        {status === "cancelled" ? "Cancelled" : "Published"} {date_time_format.format(happened_at)}
                    </p>
                </div>
            </div>

            {deliveries.length > 0 && (
                <ul
                    aria-label={`Delivery status for ${item.title}`}
                    className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {deliveries.map((delivery) => (
                        <Delivery_cell key={delivery.channel} delivery={delivery} />
                    ))}
                </ul>
            )}
        </li>
    );
}

function Delivery_cell({ delivery }: { delivery: channel_delivery }) {
    const percent = delivery.total === 0 ? 0 : Math.round((delivery.sent / delivery.total) * 100);
    const label = delivery_channel_labels[delivery.channel];
    const detail =
        delivery.state === "failed"
            ? "Failed to send"
            : delivery.total > 1
              ? `${number_format.format(delivery.sent)} / ${number_format.format(delivery.total)} sent`
              : delivery.state === "delivered"
                ? "Posted"
                : "Posting…";

    return (
        <li className="rounded-[8px] border-[0.8px] border-agap-line bg-white p-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-agap-ink">{label}</p>
                <p className={`text-[10px] font-semibold ${delivery_text_class[delivery.state]}`}>{detail}</p>
            </div>
            <div
                role="progressbar"
                aria-label={`${label} progress`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={delivery.state === "failed" ? 0 : percent}
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-agap-line"
            >
                <div
                    className={`h-full rounded-full ${delivery.state === "failed" ? "bg-red-500" : delivery.state === "sending" ? "bg-sky-600" : "bg-agap-700"}`}
                    style={{ width: `${delivery.state === "failed" ? 100 : percent}%` }}
                />
            </div>
        </li>
    );
}
