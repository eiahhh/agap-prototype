import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { Advisory_correlation } from "@/components/weather/advisory_correlation";
import { list_advisories, reset_advisories, type advisory } from "@/lib/cdrrmo/advisories";
import { correlate_advisories, missed_days, recommend_advisory } from "@/lib/cdrrmo/advisory_correlation";
import { get_weather_history, manila_date, manila_day_start, weather_on } from "@/lib/cdrrmo/weather_history";

const now = Date.UTC(2026, 10, 26, 2, 0); // 10:00 AM in Manila, Nov 26
const day = 86_400_000;

function make(extra: Partial<advisory>): advisory {
    return {
        id: Math.random().toString(36),
        title: "Test advisory",
        level: "all",
        coverage: "Citywide",
        message: "Classes are suspended.",
        status: "published",
        created_at: now,
        updated_at: now,
        ...extra,
    };
}

beforeEach(() => {
    reset_advisories(now);
});

afterEach(() => {
    cleanup();
});

describe("weather history", () => {
    it("uses Manila dates", () => {
        // 11:30 PM UTC on Nov 25 is 7:30 AM on Nov 26 in Manila.
        expect(manila_date(Date.UTC(2026, 10, 25, 23, 30))).toBe("2026-11-26");
        expect(manila_day_start(now)).toBe(Date.UTC(2026, 10, 25, 16, 0));
    });

    it("returns the same weather for the same day every time", () => {
        expect(weather_on(now - 3 * day, now)).toEqual(weather_on(now - 3 * day + 3_600_000, now));
        expect(get_weather_history(30, now)).toEqual(get_weather_history(30, now));
    });

    it("lists days oldest first and ends with today's live reading", () => {
        const history = get_weather_history(7, now);

        expect(history).toHaveLength(7);
        expect(history.map((entry) => entry.day_start)).toEqual([...history.map((entry) => entry.day_start)].sort((a, b) => a - b));
        expect(history.at(-1)).toMatchObject({ date: "2026-11-26", peak_rainfall_mm_per_hr: 9.2, rainfall_warning: "yellow" });
    });
});

describe("correlate_advisories", () => {
    it("leaves out drafts and lists the rest newest first", () => {
        const correlated = correlate_advisories(list_advisories(), now);

        expect(correlated.some((entry) => entry.advisory.status === "draft")).toBe(false);
        expect(correlated.map((entry) => entry.at)).toEqual([...correlated.map((entry) => entry.at)].sort((a, b) => b - a));
    });

    it("checks each advisory against the weather on its day", () => {
        const low_day = get_weather_history(30, now).find((entry) => entry.risk === "low")!;
        const items = [
            make({ title: "matched", published_at: now - 60_000 }),
            make({ title: "low", published_at: low_day.day_start + 3_600_000 }),
            make({ title: "withdrawn", status: "cancelled", cancelled_at: now - 120_000 }),
            make({ title: "pending", status: "scheduled", scheduled_for: now + 60_000 }),
        ];

        const checks = Object.fromEntries(correlate_advisories(items, now).map((entry) => [entry.advisory.title, entry.check]));

        expect(checks).toEqual({ matched: "matched", low: "low_risk", withdrawn: "withdrawn", pending: "pending" });
    });
});

describe("missed_days", () => {
    it("finds high-risk days with no published suspension", () => {
        const history = get_weather_history(30, now);
        const missed = missed_days(history, list_advisories(), now);

        // The sample data leaves the oldest high-risk day uncovered.
        const first_high = history.find((entry) => entry.risk === "high" || entry.risk === "critical")!;
        expect(missed.map((entry) => entry.date)).toEqual([first_high.date]);
    });

    it("never counts today", () => {
        const history = get_weather_history(1, now).map((entry) => ({ ...entry, risk: "critical" as const }));

        expect(missed_days(history, [], now)).toEqual([]);
    });
});

describe("recommend_advisory", () => {
    it("asks for a suspension when risk is high and nothing is in place", () => {
        expect(recommend_advisory("high", [], now)).toEqual({ recommendation: "issue", active: [] });
    });

    it("keeps monitoring when risk is low or moderate", () => {
        expect(recommend_advisory("moderate", [], now).recommendation).toBe("monitor");
    });

    it("counts advisories published today or scheduled as covering it", () => {
        const yesterday = make({ published_at: now - day });
        const today = make({ published_at: now - 60_000 });

        expect(recommend_advisory("critical", [yesterday], now).recommendation).toBe("issue");
        expect(recommend_advisory("critical", [yesterday, today], now)).toEqual({ recommendation: "covered", active: [today] });
        expect(recommend_advisory("high", [make({ status: "scheduled", scheduled_for: now + 1 })], now).recommendation).toBe(
            "covered",
        );
    });
});

describe("Advisory_correlation widget", () => {
    it("shows a New advisory button when a suspension is called for", () => {
        render(<Advisory_correlation risk="high" recommendation="issue" active_titles={[]} correlated={[]} missed={[]} />);

        expect(screen.getByText("Consider a class suspension")).toBeTruthy();
        expect(screen.getByRole("link", { name: "New advisory" }).getAttribute("href")).toBe("/dashboard/advisories/new");
        expect(screen.getByText("Every high-risk day in the last 30 days had a suspension.")).toBeTruthy();
    });

    it("lists the advisories in place, the correlation table and missed days", () => {
        const advisories = list_advisories();
        const { recommendation, active } = recommend_advisory("moderate", advisories, now);
        const correlated = correlate_advisories(advisories, now);
        render(
            <Advisory_correlation
                risk="moderate"
                recommendation={recommendation}
                active_titles={active.map((item) => item.title)}
                correlated={correlated}
                missed={missed_days(get_weather_history(30, now), advisories, now)}
            />,
        );

        expect(screen.getByText("Advisories are in place")).toBeTruthy();
        const table = screen.getByRole("table");
        expect(within(table).getAllByRole("row")).toHaveLength(correlated.length + 1);
        expect(within(table).getAllByText("Matches conditions").length).toBeGreaterThan(0);
        expect(within(table).getByText("Withdrawn")).toBeTruthy();
        expect(within(table).getByText("Not sent yet")).toBeTruthy();
        expect(screen.getByRole("heading", { name: "High-risk days without a suspension" })).toBeTruthy();
    });
});
