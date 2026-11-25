import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Advisory_edit_form } from "@/components/cdrrmo/advisory_edit_form";
import { require_cdrrmo } from "@/lib/auth/current_user";
import { advisory_level_labels, advisory_levels, find_advisory, is_pending } from "@/lib/cdrrmo/advisories";
import { to_manila_datetime_input } from "@/lib/cdrrmo/advisory_form";

export const metadata: Metadata = {
    title: "AGAP | Edit Advisory",
};

const level_options = advisory_levels.map((level) => ({ value: level, label: advisory_level_labels[level] }));

export default function edit_advisory_page({ params }: PageProps<"/dashboard/advisories/[id]/edit">) {
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
                    Edit advisory
                </h1>
                <p className="pt-2 text-xs leading-[18px] text-agap-muted">
                    Changes are saved to the draft. Nothing is sent until the advisory is published.
                </p>

                <Suspense fallback={<p className="mt-8 text-xs text-agap-muted">Loading advisory…</p>}>
                    <Advisory_editor params={params} />
                </Suspense>
            </div>
        </main>
    );
}

// Reads the session and the URL, so it streams in behind the Suspense boundary.
async function Advisory_editor({ params }: { params: Promise<{ id: string }> }) {
    await require_cdrrmo();
    const { id } = await params;
    const item = find_advisory(id);

    if (!item || !is_pending(item)) {
        return (
            <p className="mt-8 rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-6 text-center text-xs text-agap-muted">
                {item
                    ? "This advisory was already published or cancelled, so it can't be edited."
                    : "This advisory doesn't exist."}
            </p>
        );
    }

    return (
        <Advisory_edit_form
            advisory_id={item.id}
            level_options={level_options}
            initial_values={{
                title: item.title,
                level: item.level,
                coverage: item.coverage,
                message: item.message,
                scheduled_for: item.scheduled_for === undefined ? "" : to_manila_datetime_input(item.scheduled_for),
            }}
        />
    );
}
