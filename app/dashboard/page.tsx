import Link from "next/link";
import { Suspense } from "react";
import { Agap_logo } from "@/components/login/agap_logo";
import { require_user } from "@/lib/auth/current_user";
import { role_labels } from "@/lib/auth/demo_users";
import { logout } from "@/app/login/actions";

// Placeholder landing page after sign-in. The role dashboards from Figma
// (CDRRMO / SA / IT) will replace this.
export default function dashboard_page() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-agap-mist px-6 py-10">
            <Agap_logo tone="dark" />
            <Suspense fallback={<p className="text-xs text-agap-muted">Loading your account…</p>}>
                <Signed_in_card />
            </Suspense>
        </main>
    );
}

async function Signed_in_card() {
    const user = await require_user();

    return (
        <section className="w-full max-w-[440px] rounded-[10px] border-[0.8px] border-agap-line bg-agap-field p-6 text-center">
            <p className="text-[10px] font-semibold uppercase leading-[15px] tracking-[1px] text-agap-500">
                Signed in
            </p>
            <h1 className="mt-1.5 text-2xl font-normal tracking-[-0.72px] text-agap-ink">{user.name}</h1>
            <p className="mt-1 text-xs text-agap-muted">
                {user.email} · {role_labels[user.role]}
            </p>

            {user.role === "super_admin" && (
                <Link
                    href="/dashboard/requests"
                    className="mt-4 inline-block text-[11px] font-semibold leading-[16.5px] text-agap-700 underline"
                >
                    Review account requests
                </Link>
            )}

            <form action={logout} className="mt-6">
                <button
                    type="submit"
                    className="rounded-[10px] bg-agap-700 px-4 py-3 text-xs font-semibold text-white transition hover:bg-agap-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agap-700/40 focus-visible:ring-offset-2"
                >
                    Sign out
                </button>
            </form>
        </section>
    );
}
