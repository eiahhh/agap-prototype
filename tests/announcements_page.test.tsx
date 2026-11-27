import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { Announcement_list } from "@/components/announcements/announcement_list";
import { list_advisories, reset_advisories } from "@/lib/cdrrmo/advisories";
import { safe_return_path } from "@/lib/cdrrmo/advisory_form";
import {
    count_by_tab,
    filter_announcements,
    parse_announcement_tab,
    parse_search_query,
} from "@/lib/cdrrmo/announcement_filters";

const now = Date.UTC(2026, 10, 26, 2, 0);

beforeEach(() => {
    reset_advisories(now);
});

afterEach(() => {
    cleanup();
});

describe("parsing the URL", () => {
    it.each([
        ["draft", "draft"],
        ["published", "published"],
        [["scheduled", "draft"], "scheduled"],
        [undefined, "all"],
        ["deleted", "all"],
    ] as const)("reads tab %o as %s", (value, expected) => {
        expect(parse_announcement_tab(value as string | string[] | undefined)).toBe(expected);
    });

    it("trims the search and caps its length", () => {
        expect(parse_search_query("  rain  ")).toBe("rain");
        expect(parse_search_query("x".repeat(500))).toHaveLength(100);
        expect(parse_search_query(undefined)).toBe("");
    });
});

describe("filter_announcements", () => {
    it("shows only the selected status", () => {
        for (const status of ["draft", "scheduled", "published", "cancelled"] as const) {
            const items = filter_announcements(list_advisories(), status, "");
            expect(items.length).toBeGreaterThan(0);
            expect(items.every((item) => item.status === status)).toBe(true);
        }
    });

    it("lists everything newest first on the All tab", () => {
        const items = filter_announcements(list_advisories(), "all", "");

        expect(items).toHaveLength(list_advisories().filter((item) => item.archived_at === undefined).length);
        expect(items.map((item) => item.updated_at)).toEqual([...items.map((item) => item.updated_at)].sort((a, b) => b - a));
    });

    it("searches title, coverage and message, ignoring case", () => {
        expect(filter_announcements(list_advisories(), "all", "SAMPALOC").map((item) => item.coverage)).toEqual(["Sampaloc IV"]);
        expect(filter_announcements(list_advisories(), "all", "julian river")).toHaveLength(1);
        expect(filter_announcements(list_advisories(), "all", "no such words")).toEqual([]);
    });

    it("counts each tab for the current search", () => {
        const counts = count_by_tab(list_advisories(), "");

        expect(counts.all + counts.archived).toBe(list_advisories().length);
        expect(counts.draft + counts.scheduled + counts.published + counts.cancelled).toBe(counts.all);
        expect(count_by_tab(list_advisories(), "heat index")).toMatchObject({ all: 1, draft: 1 });
    });
});

describe("safe_return_path", () => {
    it.each([
        ["/dashboard", "/dashboard"],
        ["/dashboard/announcements", "/dashboard/announcements"],
        ["/dashboard/announcements/0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0", "/dashboard/announcements/0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0"],
        ["https://evil.example", "/dashboard"],
        ["//evil.example", "/dashboard"],
        ["/dashboard/requests", "/dashboard"],
        [null, "/dashboard"],
    ])("allows %s → %s", (value, expected) => {
        expect(safe_return_path(value)).toBe(expected);
    });
});

describe("Announcement_list", () => {
    it("shows status, timing and edit/publish/cancel only for pending notices", () => {
        const items = filter_announcements(list_advisories(), "all", "");
        render(<Announcement_list items={items} empty_label="None" />);

        const cards = screen.getAllByRole("listitem");
        expect(cards).toHaveLength(items.length);
        for (const [index, item] of items.entries()) {
            const card = within(cards[index]);
            const pending = item.status === "draft" || item.status === "scheduled";
            expect(card.queryByRole("link", { name: `Edit ${item.title}` }) !== null).toBe(pending);
            expect(card.queryByRole("button", { name: `Publish ${item.title} now` }) !== null).toBe(pending);
        }

        const scheduled = items.findIndex((item) => item.status === "scheduled");
        expect(within(cards[scheduled]).getByText(/^Goes out /)).toBeTruthy();
        expect(
            within(cards[scheduled]).getByRole("link", { name: /^Edit / }).getAttribute("href"),
        ).toBe(`/dashboard/advisories/${items[scheduled].id}/edit?return_to=/dashboard/announcements`);
    });

    it("shows the empty message", () => {
        render(<Announcement_list items={[]} empty_label="No announcements match your search." />);

        expect(screen.getByText("No announcements match your search.")).toBeTruthy();
    });
});
