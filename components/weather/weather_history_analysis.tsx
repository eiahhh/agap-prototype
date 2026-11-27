import Link from "next/link";
import { risk_badge_class } from "@/components/cdrrmo/weather_widgets";
import { Widget_card } from "@/components/cdrrmo/widget_card";
import { rainfall_warning_labels, risk_labels } from "@/lib/cdrrmo/weather";
import { history_ranges, type history_day, type history_range, type history_summary } from "@/lib/cdrrmo/weather_analysis";
import { Bar_chart } from "./bar_chart";
import { rainfall_reference_lines } from "./hourly_outlook";

const short_day = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
const long_day = new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Manila" });

export function Weather_history_analysis({
    range,
    days,
    summary,
}: {
    range: history_range;
    days: history_day[];
    summary: history_summary;
}) {
    const rain_data = days.map((day) => ({
        key: day.date,
        label: short_day.format(day.day_start).replace(/^\w+ /, ""),
        value: day.peak_rainfall_mm_per_hr,
        tooltip: [
            long_day.format(day.day_start),
            `Peak ${day.peak_rainfall_mm_per_hr} mm/hr · total ${day.total_rainfall_mm} mm`,
            rainfall_warning_labels[day.rainfall_warning],
        ],
    }));
    const heat_data = days.map((day) => ({
        key: day.date,
        label: short_day.format(day.day_start).replace(/^\w+ /, ""),
        value: day.max_heat_index_c,
        tooltip: [long_day.format(day.day_start), `Heat index ${day.max_heat_index_c}°C`, `Wind up to ${day.max_wind_kph} km/h`],
    }));
    const label_every = range === 30 ? 5 : range === 14 ? 2 : 1;

    return (
        <section id="history" aria-labelledby="history-heading" className="mt-8 scroll-mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="history-heading" className="text-base font-medium text-agap-ink">
                    Historical weather analysis
                </h2>
                <nav aria-label="History range" className="flex rounded-[10px] border-[0.8px] border-agap-line bg-white p-0.5">
                    {history_ranges.map((option) => (
                        <Link
                            key={option}
                            href={`/dashboard/weather?range=${option}#history`}
                            scroll={false}
                            aria-current={option === range ? "page" : undefined}
                            className={`rounded-[8px] px-3 py-1.5 text-[11px] font-semibold transition ${
                                option === range ? "bg-agap-700 text-white" : "text-agap-muted hover:text-agap-ink"
                            }`}
                        >
                            {option} days
                        </Link>
                    ))}
                </nav>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <Stat label="Total rainfall" value={`${summary.total_rainfall_mm} mm`} />
                <Stat label="Rainy days" value={`${summary.rainy_days} of ${days.length}`} />
                <Stat label="Rainfall warning days" value={String(summary.warning_days)} />
                <Stat label="High-risk days" value={String(summary.high_risk_days)} />
                <Stat label="Days with suspensions" value={String(summary.suspension_days)} />
                <Stat
                    label="Wettest day"
                    value={summary.wettest_day ? short_day.format(summary.wettest_day.day_start) : "—"}
                    detail={summary.wettest_day ? `${summary.wettest_day.total_rainfall_mm} mm` : undefined}
                />
            </dl>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Widget_card title="Peak rainfall rate per day">
                    <Bar_chart
                        title={`Peak rainfall rate per day, last ${range} days`}
                        unit="mm/hr"
                        data={rain_data}
                        reference_lines={rainfall_reference_lines}
                        label_every={label_every}
                    />
                </Widget_card>
                <Widget_card title="Highest heat index per day">
                    <Bar_chart
                        title={`Highest heat index per day, last ${range} days`}
                        unit="°C"
                        data={heat_data}
                        reference_lines={[{ value: 42, label: "Danger 42°C" }]}
                        label_every={label_every}
                    />
                </Widget_card>
            </div>

            <Widget_card title="Daily log" className="mt-4">
                <div className="-mx-1 overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-xs">
                        <thead>
                            <tr className="border-b-[0.8px] border-agap-line text-[11px] text-agap-muted">
                                <th scope="col" className="px-1 pb-2 font-medium">Date</th>
                                <th scope="col" className="px-1 pb-2 text-right font-medium">Total rain</th>
                                <th scope="col" className="px-1 pb-2 text-right font-medium">Peak</th>
                                <th scope="col" className="px-1 pb-2 font-medium">Warning</th>
                                <th scope="col" className="px-1 pb-2 text-right font-medium">Heat index</th>
                                <th scope="col" className="px-1 pb-2 text-right font-medium">Wind</th>
                                <th scope="col" className="px-1 pb-2 font-medium">Risk</th>
                                <th scope="col" className="px-1 pb-2 font-medium">Suspension</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...days].reverse().map((day) => (
                                <tr key={day.date} className="border-b-[0.8px] border-agap-line/60 last:border-0">
                                    <th scope="row" className="px-1 py-2 font-medium text-agap-ink">
                                        {long_day.format(day.day_start)}
                                    </th>
                                    <td className="px-1 py-2 text-right text-agap-ink">{day.total_rainfall_mm} mm</td>
                                    <td className="px-1 py-2 text-right text-agap-ink">{day.peak_rainfall_mm_per_hr} mm/hr</td>
                                    <td className="px-1 py-2 text-agap-muted">
                                        {day.rainfall_warning === "none" ? "None" : rainfall_warning_labels[day.rainfall_warning].replace(" rainfall warning", "")}
                                    </td>
                                    <td className="px-1 py-2 text-right text-agap-ink">{day.max_heat_index_c}°C</td>
                                    <td className="px-1 py-2 text-right text-agap-ink">
                                        {day.max_wind_kph} km/h
                                        {day.wind_signal > 0 && <span className="block text-[10px] text-agap-muted">Signal No. {day.wind_signal}</span>}
                                    </td>
                                    <td className="px-1 py-2">
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${risk_badge_class[day.risk]}`}>
                                            {risk_labels[day.risk]}
                                        </span>
                                    </td>
                                    <td className="px-1 py-2 text-agap-ink">
                                        {day.suspensions > 0 ? (
                                            <span className="font-semibold text-agap-700">
                                                <span aria-hidden>✓ </span>
                                                {day.suspensions === 1 ? "Issued" : `${day.suspensions} issued`}
                                            </span>
                                        ) : (
                                            <span className="text-agap-muted">None</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Widget_card>
        </section>
    );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
    return (
        <div className="rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-4">
            <dt className="text-[11px] leading-[16.5px] text-agap-muted">{label}</dt>
            <dd className="mt-1 text-xl font-medium text-agap-ink">
                {value}
                {detail && <span className="block text-[11px] font-normal text-agap-muted">{detail}</span>}
            </dd>
        </div>
    );
}
