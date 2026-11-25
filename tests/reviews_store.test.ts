import { beforeEach, describe, expect, it } from "vitest";
import {
    create_advisory,
    decide_review,
    find_advisory,
    list_advisories,
    publish_advisory,
    reset_advisories,
    submit_for_review,
    update_advisory,
    type advisory_input,
} from "@/lib/cdrrmo/advisories";

const now = Date.UTC(2026, 10, 26, 2, 0);

const input: advisory_input = {
    title: "Suspension of classes",
    level: "all",
    coverage: "Citywide",
    message: "Classes at all levels are suspended due to heavy rain.",
};

function new_draft() {
    return create_advisory(input, "u_cdrrmo", now);
}

beforeEach(() => {
    reset_advisories(now);
});

describe("review workflow", () => {
    it("can't publish a notice that hasn't been approved", () => {
        const draft = new_draft();

        expect(publish_advisory(draft.id, "u_cdrrmo", now)).toBe(false);
        submit_for_review(draft.id, "u_cdrrmo", now);
        expect(publish_advisory(draft.id, "u_cdrrmo", now)).toBe(false);
    });

    it("submits, approves and then publishes", () => {
        const draft = new_draft();

        expect(submit_for_review(draft.id, "u_cdrrmo", now)).toBe(true);
        expect(find_advisory(draft.id)!.review).toEqual({ state: "in_review", submitted_by: "u_cdrrmo", submitted_at: now });
        expect(decide_review(draft.id, "approved", "u_cdrrmo_head", "Looks right", now + 1)).toBe("ok");
        expect(find_advisory(draft.id)!.review).toMatchObject({ state: "approved", decided_by: "u_cdrrmo_head", decided_at: now + 1 });
        expect(publish_advisory(draft.id, "u_cdrrmo", now + 2)).toBe(true);

        expect(find_advisory(draft.id)!.review_log!.map((event) => [event.action, event.by, event.comment])).toEqual([
            ["submitted", "u_cdrrmo", undefined],
            ["approved", "u_cdrrmo_head", "Looks right"],
        ]);
    });

    it("doesn't let officers decide on their own submissions", () => {
        const draft = new_draft();
        submit_for_review(draft.id, "u_cdrrmo", now);

        expect(decide_review(draft.id, "approved", "u_cdrrmo", "", now)).toBe("own_submission");
        expect(find_advisory(draft.id)!.review!.state).toBe("in_review");
    });

    it("needs a comment to request changes, then lets the author resubmit", () => {
        const draft = new_draft();
        submit_for_review(draft.id, "u_cdrrmo", now);

        expect(decide_review(draft.id, "changes_requested", "u_cdrrmo_head", "", now)).toBe("comment_required");
        expect(decide_review(draft.id, "changes_requested", "u_cdrrmo_head", "Add Burol Main", now)).toBe("ok");
        expect(find_advisory(draft.id)!.review!.state).toBe("changes_requested");

        // Fixing it keeps the reviewer's request on record; resubmitting starts a new review.
        update_advisory(draft.id, { ...input, coverage: "Citywide and Burol Main" }, "u_cdrrmo", now + 1);
        expect(find_advisory(draft.id)!.review!.state).toBe("changes_requested");
        expect(submit_for_review(draft.id, "u_cdrrmo", now + 2)).toBe(true);
        expect(find_advisory(draft.id)!.review!.state).toBe("in_review");
    });

    it("sends an approved notice back for review when it is edited", () => {
        const draft = new_draft();
        submit_for_review(draft.id, "u_cdrrmo", now);
        decide_review(draft.id, "approved", "u_cdrrmo_head", "", now);

        update_advisory(draft.id, { ...input, title: "Changed title" }, "u_cdrrmo", now + 1);

        expect(find_advisory(draft.id)!.review).toBeUndefined();
        expect(find_advisory(draft.id)!.review_log!.at(-1)).toMatchObject({ action: "reset", by: "u_cdrrmo" });
        expect(publish_advisory(draft.id, "u_cdrrmo", now + 2)).toBe(false);
    });

    it("refuses to submit twice or decide on something not in review", () => {
        const draft = new_draft();

        expect(decide_review(draft.id, "approved", "u_cdrrmo_head", "", now)).toBe("not_in_review");
        submit_for_review(draft.id, "u_cdrrmo", now);
        expect(submit_for_review(draft.id, "u_cdrrmo", now)).toBe(false);
        expect(decide_review("missing", "approved", "u_cdrrmo_head", "", now)).toBe("not_found");
    });

    it("starts with one approved, one waiting for the head and one waiting for the officer", () => {
        const pending = list_advisories().filter((item) => item.review);

        expect(pending.map((item) => [item.review!.state, item.review!.submitted_by]).sort()).toEqual([
            ["approved", "u_cdrrmo"],
            ["in_review", "u_cdrrmo"],
            ["in_review", "u_cdrrmo_head"],
        ]);
    });
});
