import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { Notification_list } from "@/components/notifications/notification_list";
import { dismiss_notification, list_notifications, reset_notifications } from "@/lib/cdrrmo/notifications";
import { group_by_day, notification_page_href, parse_notification_filter } from "@/lib/cdrrmo/notification_page";

const now = Date.UTC(2026, 10, 26, 2, 0); // Thu Nov 26, 10:00 AM in Manila

beforeEach(() => {
    reset_notifications(now);
});

afterEach(() => {
    cleanup();
});

describe("notification filters from the URL", () => {
    it.each([
        [{}, { kind: null, unread_only: false, cleared: false }],
        [{ kind: "weather" }, { kind: "weather", unread_only: false, cleared: false }],
        [{ kind: "spam", unread: "yes" }, { kind: null, unread_only: false, cleared: false }],
        [{ kind: ["delivery", "system"], unread: "1" }, { kind: "delivery", unread_only: true, cleared: false }],
        [{ cleared: "1" }, { kind: null, unread_only: false, cleared: true }],
    ])("reads %o", (params, expected) => {
        expect(parse_notification_filter(params)).toEqual(expected);
    });

    it.each([
        [{ kind: null, unread_only: false, cleared: false }, "/dashboard/notifications"],
        [{ kind: "weather", unread_only: false, cleared: false }, "/dashboard/notifications?kind=weather"],
        [{ kind: "advisory", unread_only: true, cleared: false }, "/dashboard/notifications?kind=advisory&unread=1"],
        [{ kind: null, unread_only: false, cleared: true }, "/dashboard/notifications?cleared=1"],
    ] as const)("links %o to %s", (filter, href) => {
        expect(notification_page_href(filter)).toBe(href);
    });
});

describe("group_by_day", () => {
    it("groups by Manila date as Today, Yesterday, then the date", () => {
        const days = group_by_day(list_notifications("u_cdrrmo"), now);

        expect(days.map((day) => day.label)).toEqual(["Today", "Yesterday", "Tuesday, Nov 24", "Sunday, Nov 22"]);
        expect(days.flatMap((day) => day.items)).toHaveLength(list_notifications("u_cdrrmo").length);
    });

    it("returns nothing for an empty list", () => {
        expect(group_by_day([], now)).toEqual([]);
    });
});

describe("Notification_list", () => {
    it("shows unread markers, links and read toggles", () => {
        render(<Notification_list days={group_by_day(list_notifications("u_cdrrmo"), now)} empty_label="None" />);

        const today = screen.getByRole("region", { name: "Today" });
        const rows = within(today).getAllByRole("listitem");
        expect(rows.filter((row) => row.dataset.unread)).toHaveLength(3);
        expect(within(rows[0]).getByRole("link", { name: "Open “PAGASA raised a Yellow Rainfall Warning”" }).getAttribute("href")).toBe(
            "/dashboard/weather",
        );
        expect(within(rows[0]).getByRole("button", { name: "Mark “PAGASA raised a Yellow Rainfall Warning” as read" })).toBeTruthy();
        expect(within(rows[0]).getByRole("button", { name: "Clear “PAGASA raised a Yellow Rainfall Warning”" })).toBeTruthy();

        const read_row = within(today).getAllByRole("listitem").find((row) => !row.dataset.unread)!;
        expect(within(read_row).getByRole("button", { name: /as unread$/ })).toBeTruthy();
        // System notices without a page have no Open link.
        expect(within(read_row).queryByRole("link")).toBeNull();
    });

    it("shows Clear on inbox rows and Restore on cleared ones", () => {
        const [first] = list_notifications("u_cdrrmo");
        dismiss_notification(first.id, "u_cdrrmo", now);
        render(<Notification_list days={group_by_day(list_notifications("u_cdrrmo", { dismissed: true }), now)} empty_label="None" />);

        expect(screen.getByRole("button", { name: `Restore “${first.title}”` })).toBeTruthy();
        expect(screen.queryByRole("button", { name: /^Mark/ })).toBeNull();
    });

    it("shows the empty message", () => {
        render(<Notification_list days={[]} empty_label="You're all caught up." />);

        expect(screen.getByText("You're all caught up.")).toBeTruthy();
    });
});
