import { Widget_card } from "@/components/cdrrmo/widget_card";
import type { outlook_hour } from "@/lib/cdrrmo/weather";
import { Bar_chart } from "./bar_chart";

const hour_format = new Intl.DateTimeFormat("en-PH", { hour: "numeric", timeZone: "Asia/Manila" });

// PAGASA rainfall warning thresholds, drawn as reference lines.
export const rainfall_reference_lines = [
    { value: 7.5, label: "Yellow 7.5" },
    { value: 15, label: "Orange 15" },
];

export function Hourly_outlook({ outlook, now }: { outlook: outlook_hour[]; now: number }) {
    const data = outlook.map((hour) => {
        const time = hour_format.format(now + hour.hour_offset * 3_600_000);
        return {
            key: String(hour.hour_offset),
            label: time.replace(/\s/g, "").toLowerCase(),
            value: hour.rainfall_mm_per_hr,
            tooltip: [
                time,
                `Rain ${hour.rainfall_mm_per_hr} mm/hr · ${hour.rain_chance_pct}% chance`,
                `${hour.temperature_c}°C · wind ${hour.wind_kph} km/h`,
            ],
        };
    });
    const peak = outlook.reduce((highest, hour) => (hour.rainfall_mm_per_hr > highest.rainfall_mm_per_hr ? hour : highest));

    return (
        <Widget_card title="24-hour rainfall outlook">
            <p className="-mt-1 mb-4 text-xs text-agap-muted">
                Peak of <span className="font-semibold text-agap-ink">{peak.rainfall_mm_per_hr} mm/hr</span> expected around{" "}
                <span className="font-semibold text-agap-ink">{hour_format.format(now + peak.hour_offset * 3_600_000)}</span>.
                Dashed lines mark the PAGASA rainfall warning levels.
            </p>
            <Bar_chart
                title="Expected rainfall per hour, next 24 hours"
                unit="mm/hr"
                data={data}
                reference_lines={rainfall_reference_lines}
                label_every={3}
            />
        </Widget_card>
    );
}
