import Link from "next/link";
import { announcement_status_badge_class } from "@/components/announcements/announcement_list";
import { risk_badge_class } from "@/components/cdrrmo/weather_widgets";
import { advisory_level_labels, advisory_status_labels } from "@/lib/cdrrmo/advisories";
import type { history_record } from "@/lib/cdrrmo/records";
import { rainfall_warning_labels, risk_labels } from "@/lib/cdrrmo/weather";

const date_time_format = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });

export function Records_table({ records }: { records: history_record[] }) {
    return (
        <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                    <tr className="border-b-[0.8px] border-agap-line text-[11px] text-agap-muted">
                        <th scope="col" className="px-1 pb-2 font-medium">
                            Date
                        </th>
                        <th scope="col" className="px-1 pb-2 font-medium">
                            Notice
                        </th>
                        <th scope="col" className="px-1 pb-2 font-medium">
                            Outcome
                        </th>
                        <th scope="col" className="px-1 pb-2 font-medium">
                            Weather that day
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((record) => (
                        <tr key={record.advisory.id} className="border-b-[0.8px] border-agap-line/60 align-top last:border-0">
                            <td className="whitespace-nowrap px-1 py-3 text-agap-ink">{date_time_format.format(record.at)}</td>
                            <th scope="row" className="px-1 py-3 font-normal">
                                <Link
                                    href={`/dashboard/announcements/${record.advisory.id}`}
                                    className="block font-medium text-agap-ink hover:text-agap-700 hover:underline"
                                >
                                    {record.advisory.title}
                                </Link>
                                <span className="block text-[10px] text-agap-muted">
                                    {advisory_level_labels[record.advisory.level]} · {record.advisory.coverage}
                                </span>
                            </th>
                            <td className="px-1 py-3">
                                <span
                                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${announcement_status_badge_class[record.outcome]}`}
                                >
                                    {advisory_status_labels[record.outcome]}
                                </span>
                                {record.updates > 0 && (
                                    <span className="mt-1 block text-[10px] text-agap-muted">
                                        Updated {record.updates} {record.updates === 1 ? "time" : "times"}
                                    </span>
                                )}
                                {record.advisory.archived_at !== undefined && (
                                    <span className="mt-1 block text-[10px] text-agap-muted">Archived</span>
                                )}
                            </td>
                            <td className="px-1 py-3">
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${risk_badge_class[record.weather.risk]}`}
                                >
                                    {risk_labels[record.weather.risk]}
                                </span>
                                <span className="mt-1 block text-[10px] text-agap-muted">
                                    Peak {record.weather.peak_rainfall_mm_per_hr} mm/hr ·{" "}
                                    {rainfall_warning_labels[record.weather.rainfall_warning]}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
