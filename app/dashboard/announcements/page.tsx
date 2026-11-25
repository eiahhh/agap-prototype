import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Announcement_list } from "@/components/announcements/announcement_list";
import { input_field_class, primary_button_class } from "@/components/auth/form_styles";
import { require_cdrrmo } from "@/lib/auth/current_user";
import { list_advisories } from "@/lib/cdrrmo/advisories";
import {
    announcement_tab_labels,
    announcement_tabs,
    count_by_tab,
    filter_announcements,
    parse_announcement_tab,
    parse_search_query,
    type announcement_tab,
} from "@/lib/cdrrmo/announcement_filters";

export const metadata: Metadata = {
    title: "AGAP | Announcements",
};

export default function announcements_page({ searchParams }: PageProps<"/dashboard/announcements">) {
    return (
        <main className="flex-1 px-6 py-10">
            <div className="mx-auto w-full max-w-[880px]">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-semibold uppercase leading-[15px] tracking-[1px] text-agap-500">
                            Announcement management
                        </p>
                        <h1 className="pt-1.5 text-4xl font-normal leading-[43.2px] tracking-[-1.08px] text-agap-ink">
                            Class suspension notices
                        </h1>
                        <p className="pt-2 text-xs leading-[18px] text-agap-muted">
                            Draft, schedule, publish, update and archive official LGU class suspension notices.
                        </p>
                    </div>
                    <Link
                        href="/dashboard/advisories/new?return_to=/dashboard/announcements"
                        className={`h-10 text-xs ${primary_button_class}`}
                    >
                        New announcement
                    </Link>
                </div>

                <Suspense fallback={<p className="mt-8 text-xs text-agap-muted">Loading announcements…</p>}>
                    <Announcements search_params={searchParams} />
                </Suspense>
            </div>
        </main>
    );
}

// Reads the session and the URL, so it streams in behind the Suspense boundary.
async function Announcements({ search_params }: { search_params: Promise<Record<string, string | string[] | undefined>> }) {
    await require_cdrrmo();
    const params = await search_params;
    const tab = parse_announcement_tab(params.tab);
    const query = parse_search_query(params.q);
    const all = list_advisories();
    const counts = count_by_tab(all, query);
    const items = filter_announcements(all, tab, query);

    return (
        <>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                <nav aria-label="Announcement status" className="flex flex-wrap gap-1">
                    {announcement_tabs.map((option) => (
                        <Link
                            key={option}
                            href={tab_href(option, query)}
                            aria-current={option === tab ? "page" : undefined}
                            className={`rounded-[8px] px-3 py-1.5 text-[11px] font-semibold transition ${
                                option === tab ? "bg-agap-700 text-white" : "text-agap-muted hover:bg-agap-line/60 hover:text-agap-ink"
                            }`}
                        >
                            {announcement_tab_labels[option]}{" "}
                            <span className={option === tab ? "text-white/75" : "text-agap-muted"}>{counts[option]}</span>
                        </Link>
                    ))}
                </nav>

                <form role="search" action="/dashboard/announcements" className="flex w-full gap-2 sm:w-auto">
                    {tab !== "all" && <input type="hidden" name="tab" value={tab} />}
                    <label htmlFor="q" className="sr-only">
                        Search announcements
                    </label>
                    <input
                        id="q"
                        name="q"
                        type="search"
                        defaultValue={query}
                        placeholder="Search title, area or message"
                        className={`${input_field_class} h-9 sm:w-[260px]`}
                    />
                    <button
                        type="submit"
                        className="h-9 rounded-[10px] border-[0.8px] border-agap-line bg-white px-4 text-[11px] font-semibold text-agap-ink transition hover:border-agap-700"
                    >
                        Search
                    </button>
                </form>
            </div>

            {query && (
                <p className="mt-3 text-[11px] text-agap-muted">
                    {items.length} {items.length === 1 ? "result" : "results"} for “{query}” ·{" "}
                    <Link href={tab_href(tab, "")} className="font-semibold text-agap-700 underline">
                        Clear search
                    </Link>
                </p>
            )}

            <Announcement_list
                items={items}
                empty_label={query ? "No announcements match your search." : `No ${announcement_tab_labels[tab].toLowerCase()} announcements.`}
            />
        </>
    );
}

function tab_href(tab: announcement_tab, query: string): string {
    const params = new URLSearchParams();
    if (tab !== "all") params.set("tab", tab);
    if (query) params.set("q", query);
    const search = params.toString();
    return search ? `/dashboard/announcements?${search}` : "/dashboard/announcements";
}
