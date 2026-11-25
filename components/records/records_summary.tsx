import { Widget_card } from "@/components/cdrrmo/widget_card";
import { Bar_chart } from "@/components/weather/bar_chart";
import { advisory_level_labels, advisory_levels } from "@/lib/cdrrmo/advisories";
import type { day_count, records_summary } from "@/lib/cdrrmo/records_summary";

const long_day = new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });

// Totals for the records shown, published notices per day, and a breakdown by level.
export function Records_summary({ summary, per_day }: { summary: records_summary; per_day: day_count[] }) {
    const max_level = Math.max(1, ...Object.values(summary.by_level));
    const data = per_day.map((day) => {
        const date = Date.parse(`${day.date}T00:00:00Z`);
        return {
            key: day.date,
            label: day.date.slice(8).replace(/^0/, ""),
            value: day.published,
            tooltip: [long_day.format(date), `${day.published} published`],
        };
    });

    return (
        <section aria-labelledby="summary-heading" className="mt-6">
            <h2 id="summary-heading" className="sr-only">
                Summary
            </h2>
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="Published" value={summary.published} />
                <Stat label="Cancelled" value={summary.cancelled} />
                <Stat label="Updated after publishing" value={summary.updated} />
                <Stat
                    label="Published on high-risk days"
                    value={summary.on_high_risk_days}
                    detail={
                        summary.published > 0
                            ? `${Math.round((summary.on_high_risk_days / summary.published) * 100)}% of published`
                            : undefined
                    }
                />
            </dl>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Widget_card title="Published per day" className="lg:col-span-2">
                    <Bar_chart
                        title="Notices published per day"
                        unit="Published"
                        data={data}
                        label_every={Math.max(1, Math.ceil(data.length / 15))}
                        height_px={120}
                    />
                </Widget_card>
                <Widget_card title="Published by level">
                    <ul className="flex flex-col gap-3">
                        {advisory_levels.map((level) => (
                            <li key={level}>
                                <div className="flex items-baseline justify-between gap-3 text-[11px]">
                                    <span className="text-agap-ink">{advisory_level_labels[level]}</span>
                                    <span className="font-semibold text-agap-ink">{summary.by_level[level]}</span>
                                </div>
                                <div aria-hidden className="mt-1 h-1.5 overflow-hidden rounded-full bg-agap-line">
                                    <div
                                        className="h-full rounded-full bg-agap-700"
                                        style={{ width: `${(summary.by_level[level] / max_level) * 100}%` }}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>
                </Widget_card>
            </div>
        </section>
    );
}

function Stat({ label, value, detail }: { label: string; value: number; detail?: string }) {
    return (
        <div className="rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-4">
            <dt className="text-[11px] leading-[16.5px] text-agap-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-medium text-agap-ink">
                {value}
                {detail && <span className="block text-[11px] font-normal text-agap-muted">{detail}</span>}
            </dd>
        </div>
    );
}
