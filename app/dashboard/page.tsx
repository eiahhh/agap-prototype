import { Suspense } from "react";
import { require_user } from "@/lib/auth/current_user";
import { role_labels } from "@/lib/auth/demo_users";

// Placeholder landing page after sign-in. The role dashboards from Figma
// (CDRRMO / SA / IT) will replace this. Nav and sign out live in layout.tsx.
export default function dashboard_page() {
    return (
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
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
        </section>
    );
}
