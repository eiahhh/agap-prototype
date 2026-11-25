import Link from "next/link";
import { Suspense } from "react";
import { Agap_logo } from "@/components/login/agap_logo";
import { logout } from "@/app/login/actions";
import { require_user } from "@/lib/auth/current_user";
import { role_labels } from "@/lib/auth/demo_users";
import { count_inbox_unread } from "@/lib/cdrrmo/notification_preferences";

// Shared shell for every /dashboard page: logo, nav, signed-in user and sign out.
export default function dashboard_layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-agap-mist">
            <header className="border-b-[0.8px] border-agap-line bg-agap-field">
                <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-4 px-6 py-3">
                    <Link href="/dashboard" aria-label="AGAP dashboard home">
                        <Agap_logo tone="dark" />
                    </Link>
                    <Suspense fallback={<p className="text-xs text-agap-muted">Loading your account…</p>}>
                        <Account_nav />
                    </Suspense>
                </div>
            </header>
            {children}
        </div>
    );
}

// Reads the session, so it streams in behind the Suspense boundary.
async function Account_nav() {
    const user = await require_user();

    return (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <nav aria-label="Dashboard">
                <ul className="flex items-center gap-4 text-[11px] font-semibold leading-[16.5px]">
                    <li>
                        <Link href="/dashboard" className="text-agap-700 hover:underline">
                            Dashboard
                        </Link>
                    </li>
                    {user.role === "cdrrmo" && (
                        <li>
                            <Link href="/dashboard/weather" className="text-agap-700 hover:underline">
                                Weather
                            </Link>
                        </li>
                    )}
                    {user.role === "cdrrmo" && (
                        <li>
                            <Link href="/dashboard/announcements" className="text-agap-700 hover:underline">
                                Announcements
                            </Link>
                        </li>
                    )}
                    {user.role === "cdrrmo" && (
                        <li>
                            <Link href="/dashboard/reviews" className="text-agap-700 hover:underline">
                                Reviews
                            </Link>
                        </li>
                    )}
                    {user.role === "cdrrmo" && (
                        <li>
                            <Notifications_link user_id={user.id} />
                        </li>
                    )}
                    {user.role === "super_admin" && (
                        <li>
                            <Link href="/dashboard/requests" className="text-agap-700 hover:underline">
                                Account requests
                            </Link>
                        </li>
                    )}
                </ul>
            </nav>

            <div className="text-right">
                <p className="text-xs font-medium text-agap-ink">{user.name}</p>
                <p className="text-[10px] leading-[15px] text-agap-muted">{role_labels[user.role]}</p>
            </div>

            <form action={logout}>
                <button
                    type="submit"
                    className="rounded-[10px] bg-agap-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-agap-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agap-700/40 focus-visible:ring-offset-2"
                >
                    Sign out
                </button>
            </form>
        </div>
    );
}

function Notifications_link({ user_id }: { user_id: string }) {
    const unread = count_inbox_unread(user_id);
    return (
        <Link href="/dashboard/notifications" className="inline-flex items-center gap-1.5 text-agap-700 hover:underline">
            Notifications
            {unread > 0 && (
                <span aria-label={`${unread} unread`} className="rounded-full bg-agap-700 px-1.5 py-px text-[9px] font-semibold text-white">
                    {unread}
                </span>
            )}
        </Link>
    );
}
