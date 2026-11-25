import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";

const { refresh_mock } = vi.hoisted(() => ({ refresh_mock: vi.fn() }));
const router = { refresh: refresh_mock };
vi.mock("next/navigation", () => ({ useRouter: () => router }));

import { Auto_refresh } from "@/components/cdrrmo/auto_refresh";

let visibility: DocumentVisibilityState = "visible";

function set_visibility(state: DocumentVisibilityState) {
    visibility = state;
    act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
    });
}

beforeEach(() => {
    vi.useFakeTimers();
    visibility = "visible";
    vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
    refresh_mock.mockClear();
});

afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe("Auto_refresh", () => {
    it("refreshes the dashboard every interval", () => {
        render(<Auto_refresh interval_ms={60_000} />);

        vi.advanceTimersByTime(59_999);
        expect(refresh_mock).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(refresh_mock).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(60_000);
        expect(refresh_mock).toHaveBeenCalledTimes(2);
    });

    it("pauses while the tab is hidden and catches up when it comes back", () => {
        render(<Auto_refresh interval_ms={60_000} />);

        set_visibility("hidden");
        vi.advanceTimersByTime(180_000);
        expect(refresh_mock).not.toHaveBeenCalled();

        set_visibility("visible");
        expect(refresh_mock).toHaveBeenCalledTimes(1);
    });

    it("doesn't refresh on return when the last refresh was recent", () => {
        render(<Auto_refresh interval_ms={60_000} />);

        set_visibility("hidden");
        vi.advanceTimersByTime(10_000);
        set_visibility("visible");

        expect(refresh_mock).not.toHaveBeenCalled();
    });

    it("stops after it unmounts", () => {
        const { unmount } = render(<Auto_refresh interval_ms={60_000} />);
        unmount();

        vi.advanceTimersByTime(120_000);
        set_visibility("visible");
        expect(refresh_mock).not.toHaveBeenCalled();
    });
});
