import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({ redirect: vi.fn(), useRouter: () => ({ refresh: () => {} }) }));

import { Review_card } from "@/components/reviews/review_card";
import { list_advisories, reset_advisories, type advisory } from "@/lib/cdrrmo/advisories";
import { count_review_tabs, parse_review_tab, review_queue } from "@/lib/cdrrmo/review_queue";

const now = Date.UTC(2026, 10, 26, 2, 0);

function find(state: string, submitted_by: string): advisory {
    return list_advisories().find((item) => item.review?.state === state && item.review.submitted_by === submitted_by)!;
}

beforeEach(() => {
    reset_advisories(now);
});

afterEach(() => {
    cleanup();
});

describe("review queue", () => {
    it.each([
        ["mine", "mine"],
        ["approved", "approved"],
        [undefined, "to_review"],
        ["everything", "to_review"],
    ] as const)("reads tab %s as %s", (value, expected) => {
        expect(parse_review_tab(value)).toBe(expected);
    });

    it("shows each officer the other's submissions to review", () => {
        expect(review_queue(list_advisories(), "to_review", "u_cdrrmo").map((item) => item.review!.submitted_by)).toEqual(["u_cdrrmo_head"]);
        expect(review_queue(list_advisories(), "to_review", "u_cdrrmo_head").map((item) => item.review!.submitted_by)).toEqual(["u_cdrrmo"]);
    });

    it("lists my submissions oldest first, whatever their state", () => {
        const mine = review_queue(list_advisories(), "mine", "u_cdrrmo");

        expect(mine.map((item) => item.review!.state)).toEqual(["approved", "in_review"]);
    });

    it("counts each tab", () => {
        expect(count_review_tabs(list_advisories(), "u_cdrrmo")).toEqual({ to_review: 1, mine: 2, approved: 1 });
    });

    it("leaves out published and cancelled notices", () => {
        const all = [...list_advisories()];
        const approved = find("approved", "u_cdrrmo");
        all.splice(all.indexOf(approved), 1, { ...approved, status: "published" });

        expect(review_queue(all, "approved", "u_cdrrmo")).toEqual([]);
    });
});

describe("Review_card", () => {
    it("lets another officer approve or request changes", () => {
        const item = find("in_review", "u_cdrrmo_head");
        render(<Review_card item={item} viewer_id="u_cdrrmo" />);

        expect(screen.getByText(/^Submitted by CDRRMO Head/)).toBeTruthy();
        expect(screen.getByText(item.message)).toBeTruthy();
        expect(screen.getByRole("button", { name: `Approve ${item.title}` })).toBeTruthy();
        expect(screen.getByRole("button", { name: `Request changes to ${item.title}` })).toBeTruthy();
        expect(screen.getByLabelText("Comment")).toBeTruthy();
    });

    it("tells the author it's waiting for someone else", () => {
        render(<Review_card item={find("in_review", "u_cdrrmo")} viewer_id="u_cdrrmo" />);

        expect(screen.getByText("Waiting for another officer to review it.")).toBeTruthy();
        expect(screen.queryByRole("button", { name: /^Approve/ })).toBeNull();
    });

    it("shows the review thread and a Publish button once approved", () => {
        const item = find("approved", "u_cdrrmo");
        render(<Review_card item={item} viewer_id="u_cdrrmo" />);

        const thread = screen.getByRole("list", { name: `Review history for ${item.title}` });
        expect(within(thread).getByText("You")).toBeTruthy();
        expect(within(thread).getByText("“Matches the Yellow warning. Approved.”")).toBeTruthy();
        expect(screen.getByRole("button", { name: `Publish ${item.title} now` })).toBeTruthy();
    });

    it("offers a resubmit after changes were requested", () => {
        const item: advisory = {
            ...find("in_review", "u_cdrrmo"),
            review: { state: "changes_requested", submitted_by: "u_cdrrmo", submitted_at: now, decided_by: "u_cdrrmo_head", decided_at: now },
        };
        render(<Review_card item={item} viewer_id="u_cdrrmo" />);

        expect(screen.getByRole("button", { name: `Submit ${item.title} for review` }).textContent).toBe("Resubmit for review");
    });
});
