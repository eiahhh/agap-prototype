import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { Bar_chart, nice_ceiling } from "@/components/weather/bar_chart";
import { Hourly_outlook } from "@/components/weather/hourly_outlook";
import { Station_readings } from "@/components/weather/station_readings";
import { get_hourly_outlook, get_station_readings, station_status, type station_reading } from "@/lib/cdrrmo/weather";

const now = Date.UTC(2026, 10, 26, 2, 0); // 10:00 AM in Manila

const base_station: station_reading = {
    station: "Test",
    barangay: "Test",
    rainfall_mm_per_hr: 0,
    rainfall_last_24h_mm: 0,
    water_level_m: 1,
    alert_level_m: 3,
};

afterEach(() => {
    cleanup();
});

describe("station_status", () => {
    it.each([
        [{ water_level_m: 1 }, "normal"],
        [{ water_level_m: 2.5 }, "alert"],
        [{ water_level_m: 3 }, "critical"],
        [{ rainfall_mm_per_hr: 15 }, "alert"],
        [{ rainfall_mm_per_hr: 30 }, "critical"],
        [{ water_level_m: null, alert_level_m: null, rainfall_mm_per_hr: 5 }, "normal"],
    ] as const)("rates %o as %s", (changes, expected) => {
        expect(station_status({ ...base_station, ...changes })).toBe(expected);
    });
});

describe("hourly outlook", () => {
    it("covers the next 24 hours with chances between 0 and 100%", () => {
        const outlook = get_hourly_outlook();

        expect(outlook.map((hour) => hour.hour_offset)).toEqual(Array.from({ length: 24 }, (_, index) => index + 1));
        for (const hour of outlook) {
            expect(hour.rain_chance_pct).toBeGreaterThanOrEqual(0);
            expect(hour.rain_chance_pct).toBeLessThanOrEqual(100);
        }
    });

    it("names the peak hour and draws one bar per hour", () => {
        render(<Hourly_outlook outlook={get_hourly_outlook()} now={now} />);

        // The sample peak is 13 mm/hr two hours out, at 12 NN in Manila.
        expect(screen.getByText(/^Peak of/).textContent).toContain("13 mm/hr expected around 12 PM");
        expect(screen.getAllByRole("tooltip", { hidden: true })).toHaveLength(24);
    });
});

describe("nice_ceiling", () => {
    it.each([
        [0, 1],
        [0.7, 1],
        [13, 20],
        [24, 25],
        [41, 50],
        [86, 100],
        [120, 200],
    ])("rounds %s up to %s", (value, expected) => {
        expect(nice_ceiling(value)).toBe(expected);
    });
});

describe("Bar_chart", () => {
    it("has a data table with every value", () => {
        render(
            <Bar_chart
                title="Rain"
                unit="mm"
                data={[
                    { key: "a", label: "a", value: 4, tooltip: ["Mon"] },
                    { key: "b", label: "b", value: 12.5, tooltip: ["Tue"] },
                ]}
                reference_lines={[{ value: 7.5, label: "Yellow 7.5" }]}
            />,
        );

        const table = screen.getByRole("table", { hidden: true });
        expect(within(table).getByText("Mon")).toBeTruthy();
        expect(within(table).getByText("12.5")).toBeTruthy();
        expect(screen.getByText("Yellow 7.5")).toBeTruthy();
    });
});

describe("Station_readings", () => {
    it("lists critical stations first with their status and river level", () => {
        render(<Station_readings readings={get_station_readings()} />);

        const rows = screen.getAllByRole("row").slice(1);
        expect(rows).toHaveLength(5);
        // Julian River is above its 3.0 m alert level.
        expect(within(rows[0]).getByText("Julian River Bridge")).toBeTruthy();
        expect(within(rows[0]).getByText("Critical")).toBeTruthy();
        expect(within(rows[0]).getByText("alert at 3.0 m")).toBeTruthy();
        expect(screen.getAllByText("No gauge")).toHaveLength(2);
    });
});
