import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Pending_advisories } from "@/components/cdrrmo/pending_advisories";
import { list_advisories, list_pending_advisories, reset_advisories } from "@/lib/cdrrmo/advisories";
import { announcement_history } from "@/lib/cdrrmo/announcement_history";

const now = Date.UTC(2026, 10, 26, 2, 0);

beforeEach(() => {
    reset_advisories(now);
});

afterEach(() => {
    cleanup();
});

describe("review steps in a notice's history", () => {
    it("shows who submitted and approved it, with the reviewer's comment", () => {
        const approved = list_advisories().find((item) => item.review?.state === "approved")!;

        expect(announcement_history(approved).map((entry) => [entry.label, entry.by, entry.detail])).toEqual([
            ["Approved", "CDRRMO Head", "Matches the Yellow warning. Approved."],
            ["Submitted for review", "CDRRMO Officer", undefined],
            ["Drafted", undefined, undefined],
        ]);
    });
});

describe("dashboard review link", () => {
    it("says how many notices are waiting for the officer's review", () => {
        render(<Pending_advisories advisories={list_pending_advisories()} to_review_count={1} />);

        const link = screen.getByRole("link", { name: /1 notice is waiting for your review/ });
        expect(link.getAttribute("href")).toBe("/dashboard/reviews");
    });

    it("is hidden when nothing is waiting", () => {
        render(<Pending_advisories advisories={list_pending_advisories()} to_review_count={0} />);

        expect(screen.queryByRole("link", { name: /waiting for your review/ })).toBeNull();
    });
});
