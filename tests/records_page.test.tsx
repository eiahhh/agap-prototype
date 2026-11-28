import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { Records_table } from "@/components/records/records_table";
import { list_advisories, reset_advisories, revise_advisory } from "@/lib/cdrrmo/advisories";
import {
    all_records,
    filter_records,
    paginate,
    parse_record_filter,
    records_href,
    type record_filter,
} from "@/lib/cdrrmo/records";

const now = Date.UTC(2026, 10, 26, 2, 0); // Thu Nov 26, 10:00 AM in Manila

const no_filter: record_filter = { from: null, to: null, level: null, outcome: null, q: "", page: 1 };

beforeEach(() => {
    reset_advisories(now);
});

afterEach(() => {
    cleanup();
});

describe("parse_record_filter", () => {
    it("reads valid values and ignores the rest", () => {
        expect(
            parse_record_filter({ from: "2026-11-01", to: "2026/11/30", level: "college", outcome: "updated", q: "  rain ", page: "3" }),
        ).toEqual({ from: "2026-11-01", to: null, level: "college", outcome: "updated", q: "rain", page: 3 });
        expect(parse_record_filter({ level: "everyone", outcome: "deleted", page: "-2" })).toEqual(no_filter);
    });

    it("round-trips through the URL, leaving out defaults", () => {
        expect(records_href(no_filter)).toBe("/dashboard/records");
        const filter: record_filter = { ...no_filter, from: "2026-11-01", level: "all", q: "flood", page: 2 };
        const href = records_href(filter);

        expect(href).toBe("/dashboard/records?from=2026-11-01&level=all&q=flood&page=2");
        expect(parse_record_filter(Object.fromEntries(new URL(href, "http://x").searchParams))).toEqual(filter);
    });
});

describe("all_records", () => {
    it("includes published and cancelled notices, archived ones too, newest first", () => {
        const records = all_records(list_advisories(), now);
        const finished = list_advisories().filter((item) => item.status === "published" || item.status === "cancelled");

        expect(records).toHaveLength(finished.length);
        expect(records.some((record) => record.advisory.archived_at !== undefined)).toBe(true);
        expect(records.map((record) => record.at)).toEqual([...records.map((record) => record.at)].sort((a, b) => b - a));
        expect(records[0].date).toBe("2026-11-26");
    });
});

describe("filter_records", () => {
    const records = () => all_records(list_advisories(), now);

    it("filters by Manila date range, inclusive", () => {
        const today = filter_records(records(), { ...no_filter, from: "2026-11-26", to: "2026-11-26" });

        expect(today.length).toBeGreaterThan(0);
        expect(today.every((record) => record.date === "2026-11-26")).toBe(true);
        expect(filter_records(records(), { ...no_filter, to: "2026-11-25" }).every((record) => record.date <= "2026-11-25")).toBe(true);
    });

    it("filters by level and outcome", () => {
        expect(filter_records(records(), { ...no_filter, outcome: "cancelled" }).every((record) => record.outcome === "cancelled")).toBe(true);
        expect(filter_records(records(), { ...no_filter, level: "college" }).every((record) => record.advisory.level === "college")).toBe(true);
    });

    it("finds notices that were updated after publishing", () => {
        expect(filter_records(records(), { ...no_filter, outcome: "updated" })).toEqual([]);

        const published = list_advisories().find((item) => item.status === "published" && item.archived_at === undefined)!;
        revise_advisory(published.id, { title: "Changed", level: "all", coverage: "Citywide", message: "x".repeat(30) }, "Fixed coverage", "u_cdrrmo", now);

        expect(filter_records(all_records(list_advisories(), now), { ...no_filter, outcome: "updated" }).map((record) => record.advisory.id)).toEqual([
            published.id,
        ]);
    });

    it("searches title, coverage and message", () => {
        expect(filter_records(records(), { ...no_filter, q: "sampaloc" }).map((record) => record.advisory.coverage)).toEqual(["Sampaloc IV"]);
    });
});

describe("paginate", () => {
    const rows = Array.from({ length: 45 }, (_, index) => index);

    it("splits rows into pages", () => {
        expect(paginate(rows, 1)).toMatchObject({ page: 1, pages: 3, rows: rows.slice(0, 20) });
        expect(paginate(rows, 3).rows).toEqual(rows.slice(40));
    });

    it("shows the last page when the page is past the end", () => {
        expect(paginate(rows, 9).page).toBe(3);
        expect(paginate([], 1)).toEqual({ rows: [], page: 1, pages: 1 });
    });
});

describe("Records_table", () => {
    it("links each record to its notice and shows outcome and weather", () => {
        const records = all_records(list_advisories(), now);
        render(<Records_table records={records} />);

        const rows = screen.getAllByRole("row").slice(1);
        expect(rows).toHaveLength(records.length);
        expect(within(rows[0]).getByRole("link", { name: records[0].advisory.title }).getAttribute("href")).toBe(
            `/dashboard/announcements/${records[0].advisory.id}`,
        );
        expect(screen.getAllByText("Archived").length).toBeGreaterThan(0);
        expect(screen.getByText("Cancelled")).toBeTruthy();
    });
});
