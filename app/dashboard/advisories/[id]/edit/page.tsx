import type { Metadata } from "next";
import { Suspense } from "react";
import { Back_link } from "@/components/cdrrmo/back_link";
import { Advisory_edit_form } from "@/components/cdrrmo/advisory_edit_form";
import { require_cdrrmo } from "@/lib/auth/current_user";
import { advisory_level_labels, advisory_levels, find_advisory, is_archived, is_pending } from "@/lib/cdrrmo/advisories";
import { safe_return_path, to_manila_datetime_input } from "@/lib/cdrrmo/advisory_form";

export const metadata: Metadata = {
    title: "AGAP | Edit Announcement",
};

const level_options = advisory_levels.map((level) => ({ value: level, label: advisory_level_labels[level] }));

export default function edit_advisory_page({ params, searchParams }: PageProps<"/dashboard/advisories/[id]/edit">) {
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
                    Edit announcement
                </h1>

                <Suspense fallback={<p className="mt-8 text-xs text-agap-muted">Loading advisory…</p>}>
                    <Advisory_editor params={params} search_params={searchParams} />
                </Suspense>
            </div>
        </main>
    );
}

// Reads the session and the URL, so it streams in behind the Suspense boundary.
async function Advisory_editor({
    params,
    search_params,
}: {
    params: Promise<{ id: string }>;
    search_params: Promise<Record<string, string | string[] | undefined>>;
}) {
    await require_cdrrmo();
    const { id } = await params;
    const return_to = safe_return_path((await search_params).return_to);
    const item = find_advisory(id);

    const is_revision = item?.status === "published" && !is_archived(item);
    if (!item || (!is_pending(item) && !is_revision)) {
        return (
            <p className="mt-8 rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-6 text-center text-xs text-agap-muted">
                {!item
                    ? "This advisory doesn't exist."
                    : is_archived(item)
                      ? "This notice is archived. Restore it before making changes."
                      : "This advisory was cancelled, so it can't be edited."}
            </p>
        );
    }

    return (
        <>
            <p className="pt-2 text-xs leading-[18px] text-agap-muted">
                {is_revision
                    ? "This notice is already published. Saving sends the updated notice again and adds your note to its history."
                    : "Changes are saved to the draft. Nothing is sent until the advisory is published."}
            </p>
            <Advisory_edit_form
                is_revision={is_revision}
                advisory_id={item.id}
                level_options={level_options}
                return_to={return_to}
                initial_values={{
                    title: item.title,
                    level: item.level,
                    coverage: item.coverage,
                    message: item.message,
                    scheduled_for: item.scheduled_for === undefined ? "" : to_manila_datetime_input(item.scheduled_for),
                    revision_note: "",
                }}
            />
        </>
    );
}
