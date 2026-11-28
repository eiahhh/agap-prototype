// Totals and a per-day count for the records currently shown.

import { advisory_levels, type advisory_level } from "./advisories";
import type { history_record } from "./records";
import { manila_date } from "./weather_history";

export type records_summary = {
    published: number;
    cancelled: number;
    updated: number;
    on_high_risk_days: number; // published on a high or critical risk day
    by_level: Record<advisory_level, number>; // published only
};

export function summarize_records(records: history_record[]): records_summary {
    const by_level = Object.fromEntries(advisory_levels.map((level) => [level, 0])) as Record<advisory_level, number>;
    let published = 0;
    let on_high_risk_days = 0;
    for (const record of records) {
        if (record.outcome !== "published") continue;
        published += 1;
        by_level[record.advisory.level] += 1;
        if (record.weather.risk === "high" || record.weather.risk === "critical") on_high_risk_days += 1;
    }
    return {
        published,
        cancelled: records.filter((record) => record.outcome === "cancelled").length,
        updated: records.filter((record) => record.updates > 0).length,
        on_high_risk_days,
        by_level,
    };
}

export type day_count = { date: string; published: number };

const day_ms = 86_400_000;

// Published notices per Manila day, for every day from `from` to `to` (YYYY-MM-DD, inclusive), so quiet days show as zero.
export function published_per_day(records: history_record[], from: string, to: string): day_count[] {
    const counts = new Map<string, number>();
    for (const record of records) {
        if (record.outcome === "published") counts.set(record.date, (counts.get(record.date) ?? 0) + 1);
    }
    const days: day_count[] = [];
    // Noon Manila time keeps the date stable while stepping a day at a time.
    for (let at = Date.parse(`${from}T12:00:00+08:00`); manila_date(at) <= to; at += day_ms) {
        const date = manila_date(at);
        days.push({ date, published: counts.get(date) ?? 0 });
        if (days.length > 366) break; // a year at most
    }
    return days;
}

// The chart's date range: the filter's dates, or the 30 days ending today.
export function chart_range(from: string | null, to: string | null, now: number): { from: string; to: string } {
    const end = to ?? manila_date(now);
    const start = from ?? manila_date(Date.parse(`${end}T12:00:00+08:00`) - 29 * day_ms);
    return start <= end ? { from: start, to: end } : { from: end, to: start };
}
