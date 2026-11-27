import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { Weather_history_analysis } from "@/components/weather/weather_history_analysis";
import { list_advisories, reset_advisories } from "@/lib/cdrrmo/advisories";
import { parse_history_range, summarize_history, with_suspensions, type history_day } from "@/lib/cdrrmo/weather_analysis";
import { get_weather_history, type daily_weather } from "@/lib/cdrrmo/weather_history";

const now = Date.UTC(2026, 10, 26, 2, 0);

function day(date: string, changes: Partial<history_day> = {}): history_day {
    return {
        date,
        day_start: Date.parse(`${date}T00:00:00+08:00`),
        total_rainfall_mm: 0,
        peak_rainfall_mm_per_hr: 0,
        max_heat_index_c: 30,
        max_wind_kph: 10,
        wind_signal: 0,
        rainfall_warning: "none",
        risk: "low",
        suspensions: 0,
        ...changes,
    };
}

beforeEach(() => {
    reset_advisories(now);
});

afterEach(() => {
    cleanup();
});

describe("parse_history_range", () => {
    it.each([
        ["7", 7],
        ["14", 14],
        ["30", 30],
        [["30", "7"], 30],
        [undefined, 14],
        ["90", 14],
        ["abc", 14],
    ] as const)("reads %o as %s days", (value, expected) => {
        expect(parse_history_range(value as string | string[] | undefined)).toBe(expected);
    });
});

describe("with_suspensions", () => {
    it("counts published suspensions on each day and ignores the rest", () => {
        const history = get_weather_history(30, now);
        const days = with_suspensions(history, list_advisories());
        const published_dates = list_advisories().filter((item) => item.status === "published").length;

        expect(days.reduce((sum, entry) => sum + entry.suspensions, 0)).toBe(published_dates);
        // Today has two published advisories in the sample data.
        expect(days.at(-1)!.suspensions).toBe(2);
    });
});

describe("summarize_history", () => {
    it("adds up rainfall and counts the notable days", () => {
        const summary = summarize_history([
            day("2026-11-20", { total_rainfall_mm: 0.5 }),
            day("2026-11-21", { total_rainfall_mm: 40.2, rainfall_warning: "orange", risk: "high", suspensions: 1 }),
            day("2026-11-22", { total_rainfall_mm: 12.3, rainfall_warning: "yellow", risk: "moderate", max_heat_index_c: 38 }),
        ]);

        expect(summary).toMatchObject({
            total_rainfall_mm: 53,
            rainy_days: 2,
            warning_days: 2,
            high_risk_days: 1,
            suspension_days: 1,
            wettest_day: { date: "2026-11-21" },
            hottest_day: { date: "2026-11-22" },
        });
    });

    it("handles an empty range", () => {
        expect(summarize_history([])).toMatchObject({ total_rainfall_mm: 0, wettest_day: null, hottest_day: null });
    });
});

describe("Weather_history_analysis widget", () => {
    function render_range(range: 7 | 14 | 30) {
        const history: daily_weather[] = get_weather_history(range, now);
        const days = with_suspensions(history, list_advisories());
        render(<Weather_history_analysis range={range} days={days} summary={summarize_history(days)} />);
        return days;
    }

    it("marks the selected range and links to the others", () => {
        render_range(7);

        const nav = screen.getByRole("navigation", { name: "History range" });
        expect(within(nav).getByRole("link", { name: "7 days" }).getAttribute("aria-current")).toBe("page");
        expect(within(nav).getByRole("link", { name: "30 days" }).getAttribute("href")).toBe("/dashboard/weather?range=30#history");
    });

    it("shows one row per day in the daily log, newest first", () => {
        const days = render_range(14);

        const log = screen.getAllByRole("table").at(-1)!;
        const rows = within(log).getAllByRole("row").slice(1);
        expect(rows).toHaveLength(14);
        expect(within(rows[0]).getByText("Thu, Nov 26")).toBeTruthy();
        expect(within(rows[0]).getByText("2 issued")).toBeTruthy();
        expect(screen.getByText(`${summarize_history(days).total_rainfall_mm} mm`)).toBeTruthy();
    });

    it("draws both charts with a data table each", () => {
        render_range(30);

        expect(screen.getByRole("heading", { name: "Peak rainfall rate per day" })).toBeTruthy();
        expect(screen.getByRole("heading", { name: "Highest heat index per day" })).toBeTruthy();
        expect(screen.getAllByText("Show data table")).toHaveLength(2);
        expect(screen.getByText("Danger 42°C")).toBeTruthy();
    });
});
