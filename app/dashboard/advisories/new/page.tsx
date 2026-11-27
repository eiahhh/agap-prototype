import type { Metadata } from "next";
import { Suspense } from "react";
import { Back_link } from "@/components/cdrrmo/back_link";
import { Advisory_edit_form } from "@/components/cdrrmo/advisory_edit_form";
import { require_cdrrmo } from "@/lib/auth/current_user";
import { safe_return_path } from "@/lib/cdrrmo/advisory_form";
import { advisory_level_labels, advisory_levels } from "@/lib/cdrrmo/advisories";

export const metadata: Metadata = {
    title: "AGAP | New Advisory",
};

const level_options = advisory_levels.map((level) => ({ value: level, label: advisory_level_labels[level] }));

export default function new_advisory_page({ searchParams }: PageProps<"/dashboard/advisories/new">) {
    return (
        <main className="flex-1 px-6 py-10">
            <div className="mx-auto w-full max-w-[720px]">
                <Suspense fallback={<span className="text-[11px] leading-[16.5px]">&nbsp;</span>}>
                    <Back_link search_params={searchParams} />
                </Suspense>
                <p className="mt-6 text-[10px] font-semibold uppercase leading-[15px] tracking-[1px] text-agap-500">
                    Class suspension advisory
                </p>
                <h1 className="pt-1.5 text-4xl font-normal leading-[43.2px] tracking-[-1.08px] text-agap-ink">
                    New advisory
                </h1>
                <p className="pt-2 text-xs leading-[18px] text-agap-muted">
                    Save it as a draft or pick a time to schedule it. It goes to review on the dashboard and is only
                    sent once published.
                </p>

                <Suspense fallback={<p className="mt-8 text-xs text-agap-muted">Loading…</p>}>
                    <New_advisory_form search_params={searchParams} />
                </Suspense>
            </div>
        </main>
    );
}

// Reads the session, so it streams in behind the Suspense boundary.
async function New_advisory_form({ search_params }: { search_params: Promise<Record<string, string | string[] | undefined>> }) {
    await require_cdrrmo();
    const return_to = safe_return_path((await search_params).return_to);
    return <Advisory_edit_form level_options={level_options} return_to={return_to} />;
}
