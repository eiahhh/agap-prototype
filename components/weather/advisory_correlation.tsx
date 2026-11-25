import Link from "next/link";
import { primary_button_class } from "@/components/auth/form_styles";
import { risk_badge_class } from "@/components/cdrrmo/weather_widgets";
import { Widget_card } from "@/components/cdrrmo/widget_card";
import { advisory_status_labels } from "@/lib/cdrrmo/advisories";
import {
    correlation_check_labels,
    type advisory_recommendation,
    type correlated_advisory,
    type correlation_check,
} from "@/lib/cdrrmo/advisory_correlation";
import { rainfall_warning_labels, risk_labels, type risk_level } from "@/lib/cdrrmo/weather";
import type { daily_weather } from "@/lib/cdrrmo/weather_history";

const date_time_format = new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
});

const day_format = new Intl.DateTimeFormat("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Manila",
});

const check_class: Record<correlation_check, string> = {
    matched: "text-agap-700",
    low_risk: "text-orange-800",
    withdrawn: "text-agap-muted",
    pending: "text-sky-800",
};

const check_icon: Record<correlation_check, string> = { matched: "✓", low_risk: "!", withdrawn: "–", pending: "…" };

const recommendation_copy: Record<advisory_recommendation, { heading: string; body: string; tone: string }> = {
    issue: {
        heading: "Consider a class suspension",
        body: "Risk is high and no advisory is published or scheduled for today.",
        tone: "border-orange-300 bg-orange-50",
    },
    covered: {
        heading: "Advisories are in place",
        body: "Today's conditions are covered by these advisories.",
        tone: "border-agap-line bg-agap-field",
    },
    monitor: {
        heading: "Keep monitoring",
        body: "Risk is not high enough to call for a suspension yet.",
        tone: "border-agap-line bg-agap-field",
    },
};

export function Advisory_correlation({
    risk,
    recommendation,
    active_titles,
    correlated,
    missed,
}: {
    risk: risk_level;
    recommendation: advisory_recommendation;
    active_titles: string[];
    correlated: correlated_advisory[];
    missed: daily_weather[];
}) {
    const copy = recommendation_copy[recommendation];

    return (
        <section aria-labelledby="correlation-heading" className="mt-8">
            <h2 id="correlation-heading" className="text-base font-medium text-agap-ink">
                Advisory correlation
            </h2>

            <div className={`mt-3 flex flex-wrap items-center justify-between gap-4 rounded-[10px] border-[0.8px] p-5 ${copy.tone}`}>
                <div className="min-w-0">
                    <p className="text-[11px] text-agap-muted">
                        Current risk{" "}
                        <span className={`ml-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${risk_badge_class[risk]}`}>
                            {risk_labels[risk]}
                        </span>
                    </p>
                    <p className="mt-2 text-sm font-medium text-agap-ink">{copy.heading}</p>
                    <p className="text-xs text-agap-muted">{copy.body}</p>
                    {active_titles.length > 0 && (
                        <ul className="mt-2 list-disc pl-4 text-xs text-agap-ink">
                            {active_titles.map((title) => (
                                <li key={title}>{title}</li>
                            ))}
                        </ul>
                    )}
                </div>
                {recommendation === "issue" ? (
                    <Link href="/dashboard/advisories/new" className={`h-9 text-[11px] ${primary_button_class}`}>
                        New advisory
                    </Link>
                ) : (
                    <Link href="/dashboard" className="text-[11px] font-semibold text-agap-700 underline">
                        Review advisories on the dashboard
                    </Link>
                )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Widget_card title="Advisories vs. weather that day" className="lg:col-span-2">
                    {correlated.length === 0 ? (
                        <p className="text-center text-xs text-agap-muted">No published, scheduled or cancelled advisories yet.</p>
                    ) : (
                        <div className="-mx-1 overflow-x-auto">
                            <table className="w-full min-w-[560px] text-left text-xs">
                                <thead>
                                    <tr className="border-b-[0.8px] border-agap-line text-[11px] text-agap-muted">
                                        <th scope="col" className="px-1 pb-2 font-medium">Advisory</th>
                                        <th scope="col" className="px-1 pb-2 font-medium">Weather that day</th>
                                        <th scope="col" className="px-1 pb-2 font-medium">Check</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {correlated.map(({ advisory: item, at, weather, check }) => (
                                        <tr key={item.id} className="border-b-[0.8px] border-agap-line/60 align-top last:border-0">
                                            <th scope="row" className="px-1 py-2.5 font-normal">
                                                <span className="block font-medium text-agap-ink">{item.title}</span>
                                                <span className="block text-[10px] text-agap-muted">
                                                    {advisory_status_labels[item.status]} · {date_time_format.format(at)}
                                                </span>
                                            </th>
                                            <td className="px-1 py-2.5">
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${risk_badge_class[weather.risk]}`}>
                                                    {risk_labels[weather.risk]}
                                                </span>
                                                <span className="mt-1 block text-[10px] text-agap-muted">
                                                    Peak {weather.peak_rainfall_mm_per_hr} mm/hr ·{" "}
                                                    {rainfall_warning_labels[weather.rainfall_warning]}
                                                </span>
                                            </td>
                                            <td className={`px-1 py-2.5 text-[11px] font-semibold ${check_class[check]}`}>
                                                <span aria-hidden className="mr-1">{check_icon[check]}</span>
                                                {correlation_check_labels[check]}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Widget_card>

                <Widget_card title="High-risk days without a suspension">
                    {missed.length === 0 ? (
                        <p className="text-xs text-agap-muted">Every high-risk day in the last 30 days had a suspension.</p>
                    ) : (
                        <ul className="flex flex-col divide-y-[0.8px] divide-agap-line">
                            {missed.map((day) => (
                                <li key={day.date} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                                    <div>
                                        <p className="text-xs font-medium text-agap-ink">{day_format.format(day.day_start)}</p>
                                        <p className="text-[10px] text-agap-muted">
                                            Peak {day.peak_rainfall_mm_per_hr} mm/hr · {rainfall_warning_labels[day.rainfall_warning]}
                                        </p>
                                    </div>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${risk_badge_class[day.risk]}`}>
                                        {risk_labels[day.risk]}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Widget_card>
            </div>
        </section>
    );
}
