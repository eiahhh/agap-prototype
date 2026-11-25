import Link from "next/link";
import {
    rainfall_warning_labels,
    risk_labels,
    snapshot_risk,
    type rainfall_warning,
    type risk_level,
    type weather_snapshot,
} from "@/lib/cdrrmo/weather";
import { Widget_card } from "./widget_card";

const time_format = new Intl.DateTimeFormat("en-PH", { timeStyle: "short", timeZone: "Asia/Manila" });
const hour_format = new Intl.DateTimeFormat("en-PH", { hour: "numeric", timeZone: "Asia/Manila" });

export const risk_badge_class: Record<risk_level, string> = {
    low: "bg-agap-100 text-agap-900",
    moderate: "bg-amber-100 text-amber-900",
    high: "bg-orange-100 text-orange-900",
    critical: "bg-red-100 text-red-900",
};

const warning_badge_class: Record<rainfall_warning, string> = {
    none: "bg-agap-100 text-agap-900",
    yellow: "bg-yellow-100 text-yellow-900",
    orange: "bg-orange-100 text-orange-900",
    red: "bg-red-100 text-red-900",
};

const risk_guidance: Record<risk_level, string> = {
    low: "No hazards above normal. Continue routine monitoring.",
    moderate: "Hazards building. Watch flood-prone barangays and prepare advisories.",
    high: "Significant hazard. Consider class suspension and pre-emptive evacuation.",
    critical: "Severe hazard. Issue suspensions and activate emergency response.",
};

// Live weather and risk widgets for the CDRRMO dashboard.
export function Weather_widgets({ snapshot, details_href }: { snapshot: weather_snapshot; details_href?: string }) {
    const { current } = snapshot;
    const risk = snapshot_risk(snapshot);

    return (
        <section aria-labelledby="weather-heading" className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="weather-heading" className="text-base font-medium text-agap-ink">
                    Live weather &amp; risk monitoring
                </h2>
                <p className="text-[11px] leading-[16.5px] text-agap-muted">
                    {snapshot.location} · Updated {time_format.format(snapshot.observed_at)}
                    {details_href && (
                        <>
                            {" · "}
                            <Link href={details_href} className="font-semibold text-agap-700 underline">
                                Open weather monitoring
                            </Link>
                        </>
                    )}
                </p>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                <Widget_card title="City risk level">
                    <p
                        className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${risk_badge_class[risk]}`}
                        data-testid="city-risk"
                    >
                        {risk_labels[risk]}
                    </p>
                    <p className="mt-3 text-xs leading-[18px] text-agap-muted">{risk_guidance[risk]}</p>
                </Widget_card>

                <Widget_card title="Current conditions">
                    <div className="flex items-baseline gap-3">
                        <p className="text-4xl font-normal tracking-[-1px] text-agap-ink">{current.temperature_c}°C</p>
                        <p className="text-xs text-agap-muted">{current.condition}</p>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                        <Metric label="Rainfall" value={`${current.rainfall_mm_per_hr} mm/hr`} />
                        <Metric label="Wind" value={`${current.wind_kph} km/h`} />
                        <Metric label="Heat index" value={`${current.heat_index_c}°C`} />
                        <Metric label="Humidity" value={`${current.humidity_pct}%`} />
                    </dl>
                </Widget_card>

                <Widget_card title="PAGASA warnings">
                    <ul className="flex flex-col gap-3 text-xs">
                        <li className="flex items-center justify-between gap-3">
                            <span className="text-agap-muted">Rainfall</span>
                            <span
                                className={`rounded-full px-2.5 py-0.5 font-semibold ${warning_badge_class[snapshot.rainfall_warning]}`}
                            >
                                {rainfall_warning_labels[snapshot.rainfall_warning]}
                            </span>
                        </li>
                        <li className="flex items-center justify-between gap-3">
                            <span className="text-agap-muted">Wind</span>
                            <span className="font-semibold text-agap-ink">
                                {snapshot.wind_signal === 0 ? "No wind signal" : `Signal No. ${snapshot.wind_signal}`}
                            </span>
                        </li>
                    </ul>
                </Widget_card>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-5">
                <Widget_card title="Next 6 hours" className="md:col-span-3">
                    <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {snapshot.forecast.map((hour) => (
                            <li
                                key={hour.hour_offset}
                                className="rounded-[8px] border-[0.8px] border-agap-line bg-white p-2 text-center"
                            >
                                <p className="text-[10px] font-semibold uppercase text-agap-muted">
                                    {hour_format.format(snapshot.observed_at + hour.hour_offset * 3_600_000)}
                                </p>
                                <p className="mt-1 text-sm font-medium text-agap-ink">{hour.temperature_c}°</p>
                                <p className="text-[10px] leading-[14px] text-agap-muted">{hour.condition}</p>
                                <p className="mt-1 text-[10px] font-semibold text-agap-700">{hour.rain_chance_pct}% rain</p>
                            </li>
                        ))}
                    </ol>
                </Widget_card>

                <Widget_card title="Flood-prone barangays" className="md:col-span-2">
                    <ul className="flex flex-col divide-y-[0.8px] divide-agap-line">
                        {snapshot.barangays.map((item) => (
                            <li key={item.barangay} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-agap-ink">{item.barangay}</p>
                                    <p className="text-[10px] leading-[15px] text-agap-muted">{item.note}</p>
                                </div>
                                <span
                                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${risk_badge_class[item.risk]}`}
                                >
                                    {risk_labels[item.risk]}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Widget_card>
            </div>
        </section>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-[11px] leading-[16.5px] text-agap-muted">{label}</dt>
            <dd className="font-medium text-agap-ink">{value}</dd>
        </div>
    );
}
