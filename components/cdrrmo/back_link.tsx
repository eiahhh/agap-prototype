import Link from "next/link";
import { safe_return_path } from "@/lib/cdrrmo/advisory_form";

// "Back to dashboard" or "Back to announcements", depending on where the form was opened from.
export async function Back_link({ search_params }: { search_params: Promise<Record<string, string | string[] | undefined>> }) {
    const href = safe_return_path((await search_params).return_to);
    return (
        <Link href={href} className="text-[11px] font-semibold leading-[16.5px] text-agap-700 underline">
            {href === "/dashboard" ? "Back to dashboard" : href === "/dashboard/announcements" ? "Back to announcements" : "Back to announcement"}
        </Link>
    );
}
