// Lines advisories up with the weather, to check suspensions were issued when conditions called for them.

import { type advisory } from "./advisories";
import type { risk_level } from "./weather";
import { manila_date, weather_on, type daily_weather } from "./weather_history";

// "matched": published on a day with at least moderate risk.
// "low_risk": published on a low-risk day, worth a second look.
// "withdrawn": cancelled before it went out.
// "pending": scheduled, not sent yet.
export type correlation_check = "matched" | "low_risk" | "withdrawn" | "pending";

export const correlation_check_labels: Record<correlation_check, string> = {
    matched: "Matches conditions",
    low_risk: "Issued on a low-risk day",
    withdrawn: "Withdrawn",
    pending: "Not sent yet",
};

export type correlated_advisory = {
    advisory: advisory;
    at: number; // when it was published, cancelled, or is scheduled for
    weather: daily_weather;
    check: correlation_check;
};

const elevated: readonly risk_level[] = ["moderate", "high", "critical"];
const severe: readonly risk_level[] = ["high", "critical"];

function event_time(item: advisory): number {
    if (item.status === "published") return item.published_at ?? item.updated_at;
    if (item.status === "cancelled") return item.cancelled_at ?? item.updated_at;
    return item.scheduled_for ?? item.updated_at;
}

function check_for(item: advisory, weather: daily_weather): correlation_check {
    if (item.status === "cancelled") return "withdrawn";
    if (item.status === "scheduled") return "pending";
    return elevated.includes(weather.risk) ? "matched" : "low_risk";
}

// Published, cancelled and scheduled advisories with the weather on their day, newest first.
// Drafts are left out because they haven't been timed yet.
export function correlate_advisories(items: readonly advisory[], now: number = Date.now()): correlated_advisory[] {
    return items
        .filter((item) => item.status !== "draft")
        .map((item) => {
            const at = event_time(item);
            const weather = weather_on(Math.min(at, now), now);
            return { advisory: item, at, weather, check: check_for(item, weather) };
        })
        .sort((first, second) => second.at - first.at);
}

// High or critical risk days before today with no published suspension.
export function missed_days(history: daily_weather[], items: readonly advisory[], now: number = Date.now()): daily_weather[] {
    const covered = new Set(
        items
            .filter((item) => item.status === "published" && item.published_at !== undefined)
            .map((item) => manila_date(item.published_at!)),
    );
    const today = manila_date(now);
    return history.filter((day) => day.date !== today && severe.includes(day.risk) && !covered.has(day.date));
}

export type advisory_recommendation = "issue" | "covered" | "monitor";

// What the current risk calls for, given the advisories already published today or scheduled.
export function recommend_advisory(
    risk: risk_level,
    items: readonly advisory[],
    now: number = Date.now(),
): { recommendation: advisory_recommendation; active: advisory[] } {
    const today = manila_date(now);
    const active = items.filter(
        (item) =>
            item.status === "scheduled" ||
            (item.status === "published" && item.published_at !== undefined && manila_date(item.published_at) === today),
    );
    if (active.length > 0) return { recommendation: "covered", active };
    return { recommendation: severe.includes(risk) ? "issue" : "monitor", active };
}
