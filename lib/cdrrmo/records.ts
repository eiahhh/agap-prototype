// Historical records: every finished class suspension notice, with filters and paging.

import { is_advisory_level, type advisory, type advisory_level } from "./advisories";
import { manila_date, weather_on, type daily_weather } from "./weather_history";

export const record_outcomes = ["published", "cancelled", "updated"] as const;
export type record_outcome = (typeof record_outcomes)[number];

export const record_outcome_labels: Record<record_outcome, string> = {
    published: "Published",
    cancelled: "Cancelled",
    updated: "Updated after publishing",
};

export type record_filter = {
    from: string | null; // YYYY-MM-DD, Manila date, inclusive
    to: string | null;
    level: advisory_level | null;
    outcome: record_outcome | null;
    q: string;
    page: number; // 1-based
};

export const records_per_page = 20;

export type history_record = {
    advisory: advisory;
    at: number; // when it was published or cancelled
    date: string; // Manila date of `at`
    outcome: "published" | "cancelled";
    updates: number;
    weather: daily_weather;
};

const date_pattern = /^\d{4}-\d{2}-\d{2}$/;

function first(value: string | string[] | undefined): string {
    return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parse_record_filter(params: Record<string, string | string[] | undefined>): record_filter {
    const from = first(params.from);
    const to = first(params.to);
    const level = first(params.level);
    const outcome = first(params.outcome);
    const page = Number.parseInt(first(params.page), 10);
    return {
        from: date_pattern.test(from) ? from : null,
        to: date_pattern.test(to) ? to : null,
        level: is_advisory_level(level) ? level : null,
        outcome: (record_outcomes as readonly string[]).includes(outcome) ? (outcome as record_outcome) : null,
        q: first(params.q).trim().slice(0, 100),
        page: Number.isFinite(page) && page > 0 ? page : 1,
    };
}

// Query string for a filter, leaving out defaults so links stay short.
export function record_search_params(filter: record_filter): URLSearchParams {
    const params = new URLSearchParams();
    if (filter.from) params.set("from", filter.from);
    if (filter.to) params.set("to", filter.to);
    if (filter.level) params.set("level", filter.level);
    if (filter.outcome) params.set("outcome", filter.outcome);
    if (filter.q) params.set("q", filter.q);
    if (filter.page > 1) params.set("page", String(filter.page));
    return params;
}

export function records_href(filter: record_filter): string {
    const search = record_search_params(filter).toString();
    return search ? `/dashboard/records?${search}` : "/dashboard/records";
}

// Published and cancelled notices (archived ones included), newest first.
export function all_records(items: readonly advisory[], now: number = Date.now()): history_record[] {
    return items
        .filter((item) => item.status === "published" || item.status === "cancelled")
        .map((item) => {
            const at = (item.status === "published" ? item.published_at : item.cancelled_at) ?? item.updated_at;
            return {
                advisory: item,
                at,
                date: manila_date(at),
                outcome: item.status as "published" | "cancelled",
                updates: item.revisions?.length ?? 0,
                weather: weather_on(Math.min(at, now), now),
            };
        })
        .sort((first, second) => second.at - first.at);
}

function matches(record: history_record, filter: record_filter): boolean {
    if (filter.from && record.date < filter.from) return false;
    if (filter.to && record.date > filter.to) return false;
    if (filter.level && record.advisory.level !== filter.level) return false;
    if (filter.outcome === "updated" && record.updates === 0) return false;
    if (filter.outcome && filter.outcome !== "updated" && record.outcome !== filter.outcome) return false;
    if (filter.q) {
        const needle = filter.q.toLowerCase();
        const { title, coverage, message } = record.advisory;
        if (![title, coverage, message].some((text) => text.toLowerCase().includes(needle))) return false;
    }
    return true;
}

export function filter_records(records: history_record[], filter: record_filter): history_record[] {
    return records.filter((record) => matches(record, filter));
}

// One page of results. A page past the end shows the last page.
export function paginate<T>(rows: T[], page: number, per_page = records_per_page): { rows: T[]; page: number; pages: number } {
    const pages = Math.max(1, Math.ceil(rows.length / per_page));
    const current = Math.min(page, pages);
    return { rows: rows.slice((current - 1) * per_page, current * per_page), page: current, pages };
}
