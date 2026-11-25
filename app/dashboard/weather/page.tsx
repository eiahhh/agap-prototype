import type { Metadata } from "next";
import { Suspense } from "react";
import { Auto_refresh } from "@/components/cdrrmo/auto_refresh";
import { Weather_widgets } from "@/components/cdrrmo/weather_widgets";
import { Hourly_outlook } from "@/components/weather/hourly_outlook";
import { Station_readings } from "@/components/weather/station_readings";
import { require_cdrrmo } from "@/lib/auth/current_user";
import { get_hourly_outlook, get_station_readings, get_weather_snapshot } from "@/lib/cdrrmo/weather";

export const metadata: Metadata = {
    title: "AGAP | Weather Monitoring",
};

export default function weather_page() {
    return (
        <main className="flex-1 px-6 py-10">
            <div className="mx-auto w-full max-w-[1120px]">
                <p className="text-[10px] font-semibold uppercase leading-[15px] tracking-[1px] text-agap-500">
                    Weather monitoring
                </p>
                <h1 className="pt-1.5 text-4xl font-normal leading-[43.2px] tracking-[-1.08px] text-agap-ink">
                    Dasmariñas City weather
                </h1>
                <p className="pt-2 text-xs leading-[18px] text-agap-muted">
                    Real-time conditions, station readings and how they line up with class suspension advisories.
                </p>

                <Suspense fallback={<p className="mt-8 text-xs text-agap-muted">Loading weather…</p>}>
                    <Weather_monitoring />
                </Suspense>
            </div>
        </main>
    );
}

// Reads the session, so it streams in behind the Suspense boundary.
async function Weather_monitoring() {
    await require_cdrrmo();
    const snapshot = get_weather_snapshot();
    // One clock for the whole render, so every section agrees on what "now" is.
    const now = snapshot.observed_at;

    return (
        <>
            <Auto_refresh />
            <Weather_widgets snapshot={snapshot} />

            <section aria-labelledby="tracking-heading" className="mt-8">
                <h2 id="tracking-heading" className="text-base font-medium text-agap-ink">
                    Stations &amp; outlook
                </h2>
                <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Station_readings readings={get_station_readings()} />
                    <Hourly_outlook outlook={get_hourly_outlook()} now={now} />
                </div>
            </section>
        </>
    );
}
