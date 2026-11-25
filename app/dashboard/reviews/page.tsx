import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { risk_badge_class } from "@/components/cdrrmo/weather_widgets";
import { Review_card } from "@/components/reviews/review_card";
import { require_cdrrmo } from "@/lib/auth/current_user";
import { list_advisories } from "@/lib/cdrrmo/advisories";
import { count_review_tabs, parse_review_tab, review_queue, review_tab_labels, review_tabs } from "@/lib/cdrrmo/review_queue";
import { get_weather_snapshot, risk_labels, snapshot_risk } from "@/lib/cdrrmo/weather";

export const metadata: Metadata = {
    title: "AGAP | Review & Approval",
};

const empty_labels = {
    to_review: "Nothing is waiting for your review.",
    mine: "You haven't submitted any notices for review.",
    approved: "No approved notices are waiting to be published.",
} as const;

export default function reviews_page({ searchParams }: PageProps<"/dashboard/reviews">) {
    return (
        <main className="flex-1 px-6 py-10">
            <div className="mx-auto w-full max-w-[880px]">
                <p className="text-[10px] font-semibold uppercase leading-[15px] tracking-[1px] text-agap-500">Review &amp; approval</p>
                <h1 className="pt-1.5 text-4xl font-normal leading-[43.2px] tracking-[-1.08px] text-agap-ink">Notices awaiting approval</h1>
                <p className="pt-2 text-xs leading-[18px] text-agap-muted">
                    Every class suspension notice is checked by a second CDRRMO officer before it can be published. You can&apos;t
                    approve your own.
                </p>

                <Suspense fallback={<p className="mt-8 text-xs text-agap-muted">Loading reviews…</p>}>
                    <Reviews search_params={searchParams} />
                </Suspense>
            </div>
        </main>
    );
}

// Reads the session and the URL, so it streams in behind the Suspense boundary.
async function Reviews({ search_params }: { search_params: Promise<Record<string, string | string[] | undefined>> }) {
    const user = await require_cdrrmo();
    const tab = parse_review_tab((await search_params).tab);
    const all = list_advisories();
    const counts = count_review_tabs(all, user.id);
    const items = review_queue(all, tab, user.id);
    const risk = snapshot_risk(get_weather_snapshot());

    return (
        <>
            <p className="mt-6 text-[11px] text-agap-muted">
                Current city risk{" "}
                <span className={`ml-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${risk_badge_class[risk]}`}>{risk_labels[risk]}</span>{" "}
                ·{" "}
                <Link href="/dashboard/weather" className="font-semibold text-agap-700 underline">
                    Check the weather
                </Link>
            </p>

            <nav aria-label="Review queue" className="mt-4 flex flex-wrap gap-1">
                {review_tabs.map((option) => (
                    <Link
                        key={option}
                        href={option === "to_review" ? "/dashboard/reviews" : `/dashboard/reviews?tab=${option}`}
                        aria-current={option === tab ? "page" : undefined}
                        className={`rounded-[8px] px-3 py-1.5 text-[11px] font-semibold transition ${
                            option === tab ? "bg-agap-700 text-white" : "text-agap-muted hover:bg-agap-line/60 hover:text-agap-ink"
                        }`}
                    >
                        {review_tab_labels[option]} <span className={option === tab ? "text-white/75" : ""}>{counts[option]}</span>
                    </Link>
                ))}
            </nav>

            {items.length === 0 ? (
                <p className="mt-4 rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-6 text-center text-xs text-agap-muted">
                    {empty_labels[tab]}
                </p>
            ) : (
                <ul className="mt-4 flex flex-col gap-3">
                    {items.map((item) => (
                        <Review_card key={item.id} item={item} viewer_id={user.id} />
                    ))}
                </ul>
            )}
        </>
    );
}
