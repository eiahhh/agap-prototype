import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { input_field_class, label_class, primary_button_class } from "@/components/auth/form_styles";
import { Activity_list } from "@/components/records/activity_list";
import { Records_summary } from "@/components/records/records_summary";
import { Records_table } from "@/components/records/records_table";
import { require_cdrrmo } from "@/lib/auth/current_user";
import { activity_actions, activity_log, parse_activity_action } from "@/lib/cdrrmo/activity_log";
import { advisory_level_labels, advisory_levels, list_advisories } from "@/lib/cdrrmo/advisories";
import {
    all_records,
    filter_records,
    paginate,
    parse_record_filter,
    record_outcome_labels,
    record_outcomes,
    records_href,
    type record_filter,
} from "@/lib/cdrrmo/records";
import { chart_range, published_per_day, summarize_records } from "@/lib/cdrrmo/records_summary";
import { get_weather_snapshot } from "@/lib/cdrrmo/weather";

export const metadata: Metadata = {
    title: "AGAP | Historical Records",
};

export default function records_page({ searchParams }: PageProps<"/dashboard/records">) {
    return (
        <main className="flex-1 px-6 py-10">
            <div className="mx-auto w-full max-w-[1120px]">
                <p className="text-[10px] font-semibold uppercase leading-[15px] tracking-[1px] text-agap-500">Historical records</p>
                <h1 className="pt-1.5 text-4xl font-normal leading-[43.2px] tracking-[-1.08px] text-agap-ink">Class suspension records</h1>
                <p className="pt-2 text-xs leading-[18px] text-agap-muted">
                    Every published and cancelled notice, with the weather on the day it went out.
                </p>

                <Suspense fallback={<p className="mt-8 text-xs text-agap-muted">Loading records…</p>}>
                    <Records search_params={searchParams} />
                </Suspense>
            </div>
        </main>
    );
}

// Reads the session and the URL, so it streams in behind the Suspense boundary.
async function Records({ search_params }: { search_params: Promise<Record<string, string | string[] | undefined>> }) {
    await require_cdrrmo();
    const params = await search_params;
    if (params.view === "activity") {
        return (
            <>
                <View_tabs view="activity" />
                <Activity params={params} />
            </>
        );
    }

    const filter = parse_record_filter(params);
    // The weather reading time doubles as the page clock, like the dashboard.
    const now = get_weather_snapshot().observed_at;
    const matching = filter_records(all_records(list_advisories(), now), filter);
    const { rows, page, pages } = paginate(matching, filter.page);
    const chart = chart_range(filter.from, filter.to, now);
    const is_filtered = Boolean(filter.from || filter.to || filter.level || filter.outcome || filter.q);

    return (
        <>
            <View_tabs view="records" />
            <Record_filters filter={filter} />

            <Records_summary summary={summarize_records(matching)} per_day={published_per_day(matching, chart.from, chart.to)} />

            <section aria-labelledby="records-heading" className="mt-6 rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-5">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id="records-heading" className="text-sm font-medium text-agap-ink">
                        {matching.length} {matching.length === 1 ? "record" : "records"}
                        {is_filtered && " match your filters"}
                    </h2>
                    {is_filtered && (
                        <Link href="/dashboard/records" className="text-[11px] font-semibold text-agap-700 underline">
                            Clear filters
                        </Link>
                    )}
                </div>
                {rows.length === 0 ? (
                    <p className="py-6 text-center text-xs text-agap-muted">No records match these filters.</p>
                ) : (
                    <Records_table records={rows} />
                )}
            </section>

            {pages > 1 && <Pagination filter={filter} page={page} pages={pages} />}
        </>
    );
}

function Record_filters({ filter }: { filter: record_filter }) {
    return (
        <form
            role="search"
            aria-label="Filter records"
            action="/dashboard/records"
            className="mt-4 grid grid-cols-2 gap-3 rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-4 sm:grid-cols-3 lg:grid-cols-6"
        >
            <div className="col-span-2 sm:col-span-3 lg:col-span-2">
                <label htmlFor="q" className={`block ${label_class}`}>
                    Search
                </label>
                <input
                    id="q"
                    name="q"
                    type="search"
                    defaultValue={filter.q}
                    placeholder="Title, area or message"
                    className={`mt-1 ${input_field_class} h-9`}
                />
            </div>
            <div>
                <label htmlFor="from" className={`block ${label_class}`}>
                    From
                </label>
                <input id="from" name="from" type="date" defaultValue={filter.from ?? ""} className={`mt-1 ${input_field_class} h-9`} />
            </div>
            <div>
                <label htmlFor="to" className={`block ${label_class}`}>
                    To
                </label>
                <input id="to" name="to" type="date" defaultValue={filter.to ?? ""} className={`mt-1 ${input_field_class} h-9`} />
            </div>
            <div>
                <label htmlFor="level" className={`block ${label_class}`}>
                    Levels
                </label>
                <select id="level" name="level" defaultValue={filter.level ?? ""} className={`mt-1 ${input_field_class} h-9`}>
                    <option value="">All levels</option>
                    {advisory_levels.map((level) => (
                        <option key={level} value={level}>
                            {advisory_level_labels[level]}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="outcome" className={`block ${label_class}`}>
                    Outcome
                </label>
                <select id="outcome" name="outcome" defaultValue={filter.outcome ?? ""} className={`mt-1 ${input_field_class} h-9`}>
                    <option value="">Any outcome</option>
                    {record_outcomes.map((outcome) => (
                        <option key={outcome} value={outcome}>
                            {record_outcome_labels[outcome]}
                        </option>
                    ))}
                </select>
            </div>
            <div className="col-span-2 flex justify-end sm:col-span-3 lg:col-span-6">
                <button type="submit" className={`h-9 text-[11px] ${primary_button_class}`}>
                    Apply filters
                </button>
            </div>
        </form>
    );
}

function Pagination({ filter, page, pages }: { filter: record_filter; page: number; pages: number }) {
    const link_class =
        "rounded-[8px] border-[0.8px] border-agap-line bg-white px-3 py-1.5 text-[11px] font-semibold text-agap-ink hover:border-agap-700";
    return (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between gap-3 text-[11px] text-agap-muted">
            {page > 1 ? (
                <Link href={records_href({ ...filter, page: page - 1 })} className={link_class}>
                    Previous
                </Link>
            ) : (
                <span />
            )}
            <span>
                Page {page} of {pages}
            </span>
            {page < pages ? (
                <Link href={records_href({ ...filter, page: page + 1 })} className={link_class}>
                    Next
                </Link>
            ) : (
                <span />
            )}
        </nav>
    );
}

function View_tabs({ view }: { view: "records" | "activity" }) {
    const tab_class = (is_active: boolean) =>
        `rounded-[8px] px-3 py-1.5 text-[11px] font-semibold transition ${
            is_active ? "bg-agap-700 text-white" : "text-agap-muted hover:bg-agap-line/60 hover:text-agap-ink"
        }`;
    return (
        <nav aria-label="Records view" className="mt-8 flex gap-1">
            <Link
                href="/dashboard/records"
                aria-current={view === "records" ? "page" : undefined}
                className={tab_class(view === "records")}
            >
                Records
            </Link>
            <Link
                href="/dashboard/records?view=activity"
                aria-current={view === "activity" ? "page" : undefined}
                className={tab_class(view === "activity")}
            >
                Activity log
            </Link>
        </nav>
    );
}

function activity_href(action: string | null, page: number): string {
    const params = new URLSearchParams({ view: "activity" });
    if (action) params.set("action", action);
    if (page > 1) params.set("page", String(page));
    return `/dashboard/records?${params}`;
}

function Activity({ params }: { params: Record<string, string | string[] | undefined> }) {
    const action = parse_activity_action(params.action);
    const all = activity_log(list_advisories());
    const matching = action ? all.filter((entry) => entry.action === action) : all;
    const { rows, page, pages } = paginate(matching, parse_record_filter(params).page);
    const link_class =
        "rounded-[8px] border-[0.8px] border-agap-line bg-white px-3 py-1.5 text-[11px] font-semibold text-agap-ink hover:border-agap-700";

    return (
        <>
            <form
                aria-label="Filter activity"
                action="/dashboard/records"
                className="mt-4 flex flex-wrap items-end gap-3 rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-4"
            >
                <input type="hidden" name="view" value="activity" />
                <div>
                    <label htmlFor="action" className={`block ${label_class}`}>
                        Action
                    </label>
                    <select id="action" name="action" defaultValue={action ?? ""} className={`mt-1 ${input_field_class} h-9 w-[220px]`}>
                        <option value="">Every action</option>
                        {activity_actions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" className={`h-9 text-[11px] ${primary_button_class}`}>
                    Apply
                </button>
            </form>

            <section aria-labelledby="activity-heading" className="mt-6 rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-5">
                <h2 id="activity-heading" className="mb-3 text-sm font-medium text-agap-ink">
                    {matching.length} {matching.length === 1 ? "entry" : "entries"}
                </h2>
                <Activity_list entries={rows} />
            </section>

            {pages > 1 && (
                <nav aria-label="Pages" className="mt-4 flex items-center justify-between gap-3 text-[11px] text-agap-muted">
                    {page > 1 ? (
                        <Link href={activity_href(action, page - 1)} className={link_class}>
                            Previous
                        </Link>
                    ) : (
                        <span />
                    )}
                    <span>
                        Page {page} of {pages}
                    </span>
                    {page < pages ? (
                        <Link href={activity_href(action, page + 1)} className={link_class}>
                            Next
                        </Link>
                    ) : (
                        <span />
                    )}
                </nav>
            )}
        </>
    );
}
