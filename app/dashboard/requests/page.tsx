import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Review_buttons } from "@/components/requests/review_buttons";
import { list_pending_account_requests, type account_request } from "@/lib/auth/account_requests";
import { require_super_admin } from "@/lib/auth/current_user";
import { role_labels } from "@/lib/auth/demo_users";

export const metadata: Metadata = {
    title: "AGAP | Account Requests",
};

const submitted_at_format = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
});

export default function account_requests_page() {
    return (
        <main className="min-h-screen bg-agap-mist px-6 py-10">
            <div className="mx-auto w-full max-w-[880px]">
                <Link href="/dashboard" className="text-[11px] font-semibold leading-[16.5px] text-agap-700 underline">
                    Back to dashboard
                </Link>
                <p className="mt-6 text-[10px] font-semibold uppercase leading-[15px] tracking-[1px] text-agap-500">
                    Super Admin
                </p>
                <h1 className="pt-1.5 text-4xl font-normal leading-[43.2px] tracking-[-1.08px] text-agap-ink">
                    Account requests
                </h1>
                <p className="pt-2 text-xs leading-[18px] text-agap-muted">
                    Review requests from the register page. Oldest requests are shown first.
                </p>

                <Suspense fallback={<p className="mt-8 text-xs text-agap-muted">Loading requests…</p>}>
                    <Pending_requests />
                </Suspense>
            </div>
        </main>
    );
}

// Reads the session, so it streams in behind the Suspense boundary.
async function Pending_requests() {
    await require_super_admin();
    const requests = list_pending_account_requests();

    if (requests.length === 0) {
        return (
            <p className="mt-8 rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-6 text-center text-xs text-agap-muted">
                No pending requests.
            </p>
        );
    }

    return (
        <section aria-labelledby="pending-heading" className="mt-8">
            <h2 id="pending-heading" className="text-[11px] font-medium leading-[16.5px] text-agap-muted">
                {requests.length} pending {requests.length === 1 ? "request" : "requests"}
            </h2>
            <ul className="mt-3 flex flex-col gap-3">
                {requests.map((request) => (
                    <Request_card key={request.id} request={request} />
                ))}
            </ul>
        </section>
    );
}

function Request_card({ request }: { request: account_request }) {
    return (
        <li className="rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-base font-medium text-agap-ink">{request.full_name}</h3>
                <p className="text-[11px] leading-[16.5px] text-agap-muted">
                    Submitted {submitted_at_format.format(request.created_at)}
                </p>
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
                <Detail label="Email" value={request.email} />
                <Detail label="Requested role" value={role_labels[request.role]} />
                <Detail label="Employee ID" value={request.employee_id} />
            </dl>
            <form className="mt-4 flex justify-end">
                <input type="hidden" name="request_id" value={request.id} />
                <Review_buttons full_name={request.full_name} />
            </form>
        </li>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <dt className="text-[11px] leading-[16.5px] text-agap-muted">{label}</dt>
            <dd className="break-words font-medium text-agap-ink">{value}</dd>
        </div>
    );
}
