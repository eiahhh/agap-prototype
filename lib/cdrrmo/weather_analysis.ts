// Summaries of past weather and the suspensions issued during the same period.

import type { advisory } from "./advisories";
import { manila_date, type daily_weather } from "./weather_history";

export const history_ranges = [7, 14, 30] as const;
export type history_range = (typeof history_ranges)[number];
export const default_history_range: history_range = 14;

// Reads ?range= from the URL. Anything unexpected falls back to the default.
export function parse_history_range(value: string | string[] | undefined): history_range {
    const days = Number(Array.isArray(value) ? value[0] : value);
    return (history_ranges as readonly number[]).includes(days) ? (days as history_range) : default_history_range;
}

export type history_day = daily_weather & { suspensions: number };

export type history_summary = {
    total_rainfall_mm: number;
    rainy_days: number; // at least 1 mm of rain
    warning_days: number; // any PAGASA rainfall warning
    high_risk_days: number;
    suspension_days: number;
    wettest_day: history_day | null;
    hottest_day: history_day | null;
};

// Adds how many suspensions were published on each day.
export function with_suspensions(history: daily_weather[], items: readonly advisory[]): history_day[] {
    const per_day = new Map<string, number>();
    for (const item of items) {
        if (item.status !== "published" || item.published_at === undefined) continue;
        const date = manila_date(item.published_at);
        per_day.set(date, (per_day.get(date) ?? 0) + 1);
    }
    return history.map((day) => ({ ...day, suspensions: per_day.get(day.date) ?? 0 }));
}

export function summarize_history(days: history_day[]): history_summary {
    const pick = (better: (a: history_day, b: history_day) => boolean) =>
        days.reduce<history_day | null>((best, day) => (best === null || better(day, best) ? day : best), null);

    return {
        total_rainfall_mm: Math.round(days.reduce((sum, day) => sum + day.total_rainfall_mm, 0) * 10) / 10,
        rainy_days: days.filter((day) => day.total_rainfall_mm >= 1).length,
        warning_days: days.filter((day) => day.rainfall_warning !== "none").length,
        high_risk_days: days.filter((day) => day.risk === "high" || day.risk === "critical").length,
        suspension_days: days.filter((day) => day.suspensions > 0).length,
        wettest_day: pick((a, b) => a.total_rainfall_mm > b.total_rainfall_mm),
        hottest_day: pick((a, b) => a.max_heat_index_c > b.max_heat_index_c),
    };
}
