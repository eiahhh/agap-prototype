import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Advisory_edit_form } from "@/components/cdrrmo/advisory_edit_form";
import { require_cdrrmo } from "@/lib/auth/current_user";
import { advisory_level_labels, advisory_levels } from "@/lib/cdrrmo/advisories";

export const metadata: Metadata = {
    title: "AGAP | New Advisory",
};

const level_options = advisory_levels.map((level) => ({ value: level, label: advisory_level_labels[level] }));

export default function new_advisory_page() {
    return (
        <main className="flex-1 px-6 py-10">
            <div className="mx-auto w-full max-w-[720px]">
                <Link href="/dashboard" className="text-[11px] font-semibold leading-[16.5px] text-agap-700 underline">
                    Back to dashboard
                </Link>
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
                    <New_advisory_form />
                </Suspense>
            </div>
        </main>
    );
}

// Reads the session, so it streams in behind the Suspense boundary.
async function New_advisory_form() {
    await require_cdrrmo();
    return <Advisory_edit_form level_options={level_options} />;
}
