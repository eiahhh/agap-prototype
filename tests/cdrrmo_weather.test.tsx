import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { Weather_widgets } from "@/components/cdrrmo/weather_widgets";
import { assess_risk, get_weather_snapshot } from "@/lib/cdrrmo/weather";

const calm = { rainfall_mm_per_hr: 0, wind_signal: 0, heat_index_c: 28, rainfall_warning: "none" } as const;

afterEach(() => {
    cleanup();
});

describe("assess_risk", () => {
    it("is low when nothing is above normal", () => {
        expect(assess_risk(calm)).toBe("low");
    });

    it.each([
        [7.5, "moderate"],
        [15, "high"],
        [30, "critical"],
    ] as const)("rates %s mm/hr of rain as %s", (rainfall_mm_per_hr, expected) => {
        expect(assess_risk({ ...calm, rainfall_mm_per_hr })).toBe(expected);
    });

    it.each([
        [1, "moderate"],
        [2, "high"],
        [3, "critical"],
        [5, "critical"],
    ] as const)("rates wind signal %s as %s", (wind_signal, expected) => {
        expect(assess_risk({ ...calm, wind_signal })).toBe(expected);
    });

    it.each([
        ["yellow", "moderate"],
        ["orange", "high"],
        ["red", "critical"],
    ] as const)("rates a %s rainfall warning as %s", (rainfall_warning, expected) => {
        expect(assess_risk({ ...calm, rainfall_warning })).toBe(expected);
    });

    it.each([
        [33, "moderate"],
        [42, "high"],
        [52, "critical"],
    ] as const)("rates a %s°C heat index as %s", (heat_index_c, expected) => {
        expect(assess_risk({ ...calm, heat_index_c })).toBe(expected);
    });

    it("uses the most severe hazard", () => {
        expect(assess_risk({ ...calm, rainfall_mm_per_hr: 8, wind_signal: 3, heat_index_c: 42 })).toBe("critical");
    });
});

describe("Weather_widgets", () => {
    it("shows the current conditions, warnings, forecast and barangay risks", () => {
        const snapshot = get_weather_snapshot(Date.UTC(2026, 10, 26, 2, 0));
        render(<Weather_widgets snapshot={snapshot} />);

        expect(screen.getByRole("heading", { name: "Live weather & risk monitoring" })).toBeTruthy();
        expect(screen.getByText(`${snapshot.current.temperature_c}°C`)).toBeTruthy();
        expect(screen.getByText(`${snapshot.current.rainfall_mm_per_hr} mm/hr`)).toBeTruthy();
        expect(screen.getByText("Yellow rainfall warning")).toBeTruthy();
        expect(screen.getByText("Signal No. 1")).toBeTruthy();
        // 9.2 mm/hr, yellow warning and signal 1 are all moderate.
        expect(screen.getByTestId("city-risk").textContent).toBe("Moderate");

        const forecast = screen.getByRole("heading", { name: "Next 6 hours" }).closest("div")!.parentElement!;
        expect(within(forecast).getAllByRole("listitem")).toHaveLength(6);
        for (const item of snapshot.barangays) expect(screen.getByText(item.barangay)).toBeTruthy();
    });

    it("says when there is no wind signal", () => {
        const snapshot = { ...get_weather_snapshot(), wind_signal: 0 };
        render(<Weather_widgets snapshot={snapshot} />);

        expect(screen.getByText("No wind signal")).toBeTruthy();
    });
});
