import type { NextRequest } from "next/server";
import { get_session } from "@/lib/auth/session";
import { find_session_user } from "@/lib/auth/session_user";
import { list_advisories } from "@/lib/cdrrmo/advisories";
import { all_records, filter_records, parse_record_filter } from "@/lib/cdrrmo/records";
import { records_to_csv } from "@/lib/cdrrmo/records_csv";
import { manila_date } from "@/lib/cdrrmo/weather_history";

// Downloads the records matching the page's filters (all pages) as a CSV file.
// The proxy already blocks other roles; this checks again because route handlers can be called directly.
export async function GET(request: NextRequest) {
    const user = find_session_user(await get_session());
    if (!user) return new Response("Sign in to download records.", { status: 401 });
    if (user.role !== "cdrrmo") return new Response("Only CDRRMO personnel can download records.", { status: 403 });

    const filter = parse_record_filter(Object.fromEntries(request.nextUrl.searchParams));
    const records = filter_records(all_records(list_advisories()), filter);

    return new Response(records_to_csv(records), {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="agap-suspension-records-${manila_date(Date.now())}.csv"`,
            "Cache-Control": "no-store",
        },
    });
}
