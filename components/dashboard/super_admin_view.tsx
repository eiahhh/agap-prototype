import Link from "next/link";
import { list_pending_account_requests } from "@/lib/auth/account_requests";
import type { demo_user } from "@/lib/auth/demo_users";
import { View_shell } from "./view_shell";

export function Super_admin_view({ user }: { user: demo_user }) {
    const pending_count = list_pending_account_requests().length;

    return (
        <View_shell
            eyebrow="Super Administrator"
            title={`Welcome, ${user.name}`}
            description="Manage who can access the portal."
        >
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-6">
                <div>
                    <p className="text-[11px] leading-[16.5px] text-agap-muted">Pending account requests</p>
                    <p className="text-2xl font-medium text-agap-ink">{pending_count}</p>
                </div>
                <Link
                    href="/dashboard/requests"
                    className="text-[11px] font-semibold leading-[16.5px] text-agap-700 underline"
                >
                    Review account requests
                </Link>
            </div>
        </View_shell>
    );
}
