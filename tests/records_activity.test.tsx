import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Activity_list } from "@/components/records/activity_list";
import { archive_advisory, list_advisories, reset_advisories } from "@/lib/cdrrmo/advisories";
import { activity_actions, activity_log, parse_activity_action } from "@/lib/cdrrmo/activity_log";

const now = Date.UTC(2026, 10, 26, 2, 0);

beforeEach(() => {
    reset_advisories(now);
});

afterEach(() => {
    cleanup();
});

describe("activity_log", () => {
    it("lists every step across all notices, newest first", () => {
        const entries = activity_log(list_advisories());

        expect(entries.map((entry) => entry.at)).toEqual([...entries.map((entry) => entry.at)].sort((a, b) => b - a));
        expect(entries.filter((entry) => entry.action === "Drafted")).toHaveLength(list_advisories().length);
        expect(entries.some((entry) => entry.action === "Approved" && entry.by === "CDRRMO Head")).toBe(true);
    });

    it("picks up new actions as they happen", () => {
        const cancelled = list_advisories().find((item) => item.status === "cancelled")!;
        archive_advisory(cancelled.id, "u_cdrrmo", now + 60_000);

        expect(activity_log(list_advisories())[0]).toMatchObject({
            action: "Archived",
            by: "CDRRMO Officer",
            advisory_id: cancelled.id,
            advisory_title: cancelled.title,
        });
    });

    it("only accepts known actions as a filter", () => {
        expect(parse_activity_action("Approved")).toBe("Approved");
        expect(parse_activity_action("Deleted")).toBeNull();
        expect(parse_activity_action(undefined)).toBeNull();
        expect(activity_actions).toContain("Updated and re-sent");
    });
});

describe("Activity_list", () => {
    it("shows the action, who did it and a link to the notice", () => {
        const entries = activity_log(list_advisories()).filter((entry) => entry.action === "Approved");
        render(<Activity_list entries={entries} />);

        expect(screen.getByText("Approved")).toBeTruthy();
        expect(screen.getByText("by CDRRMO Head", { exact: false })).toBeTruthy();
        expect(screen.getByRole("link", { name: entries[0].advisory_title }).getAttribute("href")).toBe(
            `/dashboard/announcements/${entries[0].advisory_id}`,
        );
        expect(screen.getByText("Matches the Yellow warning. Approved.")).toBeTruthy();
    });

    it("shows an empty message", () => {
        render(<Activity_list entries={[]} />);

        expect(screen.getByText("No activity matches these filters.")).toBeTruthy();
    });
});
