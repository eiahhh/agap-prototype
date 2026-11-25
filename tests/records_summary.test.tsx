import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Records_summary } from "@/components/records/records_summary";
import { list_advisories, reset_advisories } from "@/lib/cdrrmo/advisories";
import { all_records } from "@/lib/cdrrmo/records";
import { chart_range, published_per_day, summarize_records } from "@/lib/cdrrmo/records_summary";

const now = Date.UTC(2026, 10, 26, 2, 0); // Thu Nov 26, 10:00 AM in Manila

beforeEach(() => {
    reset_advisories(now);
});

afterEach(() => {
    cleanup();
});

describe("summarize_records", () => {
    it("counts outcomes, high-risk days and levels", () => {
        const records = all_records(list_advisories(), now);
        const summary = summarize_records(records);

        expect(summary.published + summary.cancelled).toBe(records.length);
        expect(Object.values(summary.by_level).reduce((sum, count) => sum + count, 0)).toBe(summary.published);
        // Past suspensions in the sample data are all on high-risk days.
        expect(summary.on_high_risk_days).toBe(records.filter((record) => record.outcome === "published" && record.date < "2026-11-26").length);
        expect(summary.updated).toBe(0);
    });

    it("is all zero for no records", () => {
        expect(summarize_records([])).toMatchObject({ published: 0, cancelled: 0, updated: 0, on_high_risk_days: 0 });
    });
});

describe("published_per_day", () => {
    it("has an entry for every day, including quiet ones", () => {
        const records = all_records(list_advisories(), now);
        const days = published_per_day(records, "2026-11-20", "2026-11-26");

        expect(days.map((day) => day.date)).toEqual([
            "2026-11-20",
            "2026-11-21",
            "2026-11-22",
            "2026-11-23",
            "2026-11-24",
            "2026-11-25",
            "2026-11-26",
        ]);
        expect(days.at(-1)!.published).toBe(2);
    });
});

describe("chart_range", () => {
    it("defaults to the 30 days ending today", () => {
        expect(chart_range(null, null, now)).toEqual({ from: "2026-10-28", to: "2026-11-26" });
    });

    it("uses the filter dates, and swaps them if they're backwards", () => {
        expect(chart_range("2026-11-01", null, now)).toEqual({ from: "2026-11-01", to: "2026-11-26" });
        expect(chart_range("2026-11-20", "2026-11-10", now)).toEqual({ from: "2026-11-10", to: "2026-11-20" });
    });
});

describe("Records_summary", () => {
    it("shows the totals, a bar per day and each level", () => {
        const records = all_records(list_advisories(), now);
        const summary = summarize_records(records);
        render(<Records_summary summary={summary} per_day={published_per_day(records, "2026-11-20", "2026-11-26")} />);

        expect(screen.getByText("Published on high-risk days")).toBeTruthy();
        expect(screen.getAllByRole("tooltip", { hidden: true })).toHaveLength(7);
        expect(screen.getByText("College and graduate school")).toBeTruthy();
    });
});
