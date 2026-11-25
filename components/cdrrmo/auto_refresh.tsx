"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-fetches the dashboard's server data on an interval so weather, delivery progress and
// new notifications show up without a reload. Pauses while the tab is hidden and catches up
// as soon as it's visible again. Client state such as scroll position is kept.
export function Auto_refresh({ interval_ms = 60_000 }: { interval_ms?: number }) {
    const router = useRouter();

    useEffect(() => {
        let last_refresh = Date.now();

        function refresh() {
            last_refresh = Date.now();
            router.refresh();
        }

        const timer = window.setInterval(() => {
            if (document.visibilityState === "visible") refresh();
        }, interval_ms);

        function on_visibility_change() {
            if (document.visibilityState === "visible" && Date.now() - last_refresh >= interval_ms) refresh();
        }
        document.addEventListener("visibilitychange", on_visibility_change);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", on_visibility_change);
        };
    }, [router, interval_ms]);

    return null;
}
