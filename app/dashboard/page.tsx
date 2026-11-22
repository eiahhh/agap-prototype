import { Suspense } from "react";
import { Role_view } from "@/components/dashboard/role_view";
import { require_user } from "@/lib/auth/current_user";

// Landing page after sign-in: shows the dashboard for the signed-in user's role.
// Nav and sign out live in layout.tsx.
export default function dashboard_page() {
    return (
        <main className="flex-1 px-6 py-10">
            <Suspense fallback={<p className="text-xs text-agap-muted">Loading your dashboard…</p>}>
                <Dashboard_for_role />
            </Suspense>
        </main>
    );
}

// Reads the session, so it streams in behind the Suspense boundary.
async function Dashboard_for_role() {
    const user = await require_user();
    return <Role_view user={user} />;
}
