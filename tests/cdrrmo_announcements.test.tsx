import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { Recent_announcements } from "@/components/cdrrmo/recent_announcements";
import {
    cancel_advisory,
    create_advisory,
    list_advisories,
    publish_advisory,
    reset_advisories,
    type advisory,
} from "@/lib/cdrrmo/advisories";
import { channel_deliveries, track_recent_announcements } from "@/lib/cdrrmo/announcement_tracker";

const now = Date.UTC(2026, 10, 26, 2, 0);
const minute = 60_000;

function published_at(offset_ms: number, extra: Partial<advisory> = {}): advisory {
    return {
        id: "a1",
        title: "Suspension of classes",
        level: "all",
        coverage: "Citywide",
        message: "Classes at all levels are suspended.",
        status: "published",
        created_at: now - offset_ms,
        updated_at: now - offset_ms,
        published_at: now - offset_ms,
        ...extra,
    };
}

function state_of(item: advisory, at: number) {
    return Object.fromEntries(channel_deliveries(item, at).map((delivery) => [delivery.channel, delivery.state]));
}

beforeEach(() => {
    reset_advisories(now);
});

afterEach(() => {
    cleanup();
});

describe("channel deliveries", () => {
    it("posts to the portal right away while the slower channels are still sending", () => {
        expect(state_of(published_at(0), now)).toEqual({
            portal: "delivered",
            facebook: "sending",
            school_email: "sending",
            sms: "sending",
        });
    });

    it("finishes every channel once enough time has passed", () => {
        expect(Object.values(state_of(published_at(15 * minute), now))).toEqual([
            "delivered",
            "delivered",
            "delivered",
            "delivered",
        ]);
    });

    it("reports SMS progress as a share of recipients", () => {
        const sms = channel_deliveries(published_at(7.5 * minute), now).find((delivery) => delivery.channel === "sms")!;

        expect(sms).toEqual({ channel: "sms", state: "sending", sent: 24_250, total: 48_500 });
    });

    it("marks failed channels", () => {
        expect(state_of(published_at(30 * minute, { failed_channels: ["facebook"] }), now).facebook).toBe("failed");
    });

    it("has no deliveries for advisories that were never published", () => {
        expect(channel_deliveries({ ...published_at(0), status: "cancelled", published_at: undefined }, now)).toEqual([]);
    });
});

describe("track_recent_announcements", () => {
    it("lists published and cancelled advisories newest first, with an overall status", () => {
        const tracked = track_recent_announcements(list_advisories(), now);

        expect(tracked.map((item) => item.status)).toEqual(["delivering", "partially_failed", "cancelled", "delivered", "delivered"]);
        expect(tracked.map((item) => item.happened_at)).toEqual([...tracked.map((item) => item.happened_at)].sort((a, b) => b - a));
    });

    it("leaves out drafts and scheduled advisories", () => {
        const tracked = track_recent_announcements(list_advisories(), now);

        expect(tracked.every((item) => item.advisory.status === "published" || item.advisory.status === "cancelled")).toBe(true);
    });

    it("picks up an advisory as soon as it is published or cancelled", () => {
        const to_publish = create_advisory({ title: "New", level: "all", coverage: "Citywide", message: "x".repeat(20) }, "u_cdrrmo", now);
        const to_cancel = create_advisory({ title: "Old", level: "all", coverage: "Citywide", message: "x".repeat(20) }, "u_cdrrmo", now);
        publish_advisory(to_publish.id, "u_cdrrmo", now + 2 * minute);
        cancel_advisory(to_cancel.id, "u_cdrrmo", now + minute);

        const [first, second] = track_recent_announcements(list_advisories(), now + 2 * minute);

        expect(first).toMatchObject({ advisory: { id: to_publish.id }, status: "delivering" });
        expect(second).toMatchObject({ advisory: { id: to_cancel.id }, status: "cancelled", deliveries: [] });
    });

    it("shows at most the limit", () => {
        expect(track_recent_announcements(list_advisories(), now, 2)).toHaveLength(2);
    });
});

describe("Recent_announcements widget", () => {
    it("shows each announcement's status and per-channel delivery", () => {
        const tracked = track_recent_announcements(list_advisories(), now);
        render(<Recent_announcements announcements={tracked} />);

        const rows = screen.getAllByRole("listitem").filter((row) => row.parentElement!.tagName === "OL");
        expect(rows).toHaveLength(5);

        const delivering = within(rows[0]);
        expect(delivering.getByText("Delivering")).toBeTruthy();
        expect(delivering.getByText("AGAP portal")).toBeTruthy();
        expect(delivering.getByText(/ \/ 48,500 sent$/)).toBeTruthy();
        expect(delivering.getAllByRole("progressbar")).toHaveLength(4);

        const failed = within(rows[1]);
        expect(failed.getByText("Partially failed")).toBeTruthy();
        expect(failed.getByText("Failed to send")).toBeTruthy();

        const cancelled = within(rows[2]);
        expect(cancelled.getByText(/^Cancelled /)).toBeTruthy();
        expect(cancelled.queryByRole("progressbar")).toBeNull();
    });

    it("shows an empty state", () => {
        render(<Recent_announcements announcements={[]} />);

        expect(screen.getByText("No announcements have been published yet.")).toBeTruthy();
    });
});
