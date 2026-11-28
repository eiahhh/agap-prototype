import Link from "next/link";
import type { activity_entry } from "@/lib/cdrrmo/activity_log";

const date_time_format = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });

export function Activity_list({ entries }: { entries: activity_entry[] }) {
    if (entries.length === 0) return <p className="py-6 text-center text-xs text-agap-muted">No activity matches these filters.</p>;

    return (
        <ol className="flex flex-col divide-y-[0.8px] divide-agap-line">
            {entries.map((entry, index) => (
                <li
                    key={`${entry.advisory_id}-${entry.at}-${entry.action}-${index}`}
                    className="flex flex-wrap gap-x-4 gap-y-1 py-3 first:pt-0 last:pb-0"
                >
                    <p className="w-[150px] shrink-0 text-[11px] text-agap-muted">{date_time_format.format(entry.at)}</p>
                    <div className="min-w-0 flex-1 text-xs">
                        <p className="text-agap-ink">
                            <span className="font-semibold">{entry.action}</span>
                            {entry.by && <span className="text-agap-muted"> by {entry.by}</span>}
                            {" · "}
                            <Link
                                href={`/dashboard/announcements/${entry.advisory_id}`}
                                className="text-agap-700 underline hover:text-agap-900"
                            >
                                {entry.advisory_title}
                            </Link>
                        </p>
                        {entry.detail && <p className="mt-0.5 text-[11px] leading-[16.5px] text-agap-muted">{entry.detail}</p>}
                    </div>
                </li>
            ))}
        </ol>
    );
}
