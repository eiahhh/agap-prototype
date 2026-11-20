// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
    clear_account_requests,
    list_account_requests,
    list_pending_account_requests,
    review_account_request,
    submit_account_request,
} from "@/lib/auth/account_requests";

async function add_request(email: string) {
    await submit_account_request({
        full_name: "Maria Cruz",
        email,
        role: "cdrrmo",
        employee_id: "CDRRMO-0123",
        password: "SafePass123",
    });
    return list_account_requests().find((request) => request.email === email)!;
}

beforeEach(() => {
    clear_account_requests();
    // Only fake the clock, so scrypt's real async work still runs.
    vi.useFakeTimers({ toFake: ["Date"] });
});

afterEach(() => {
    vi.useRealTimers();
});

describe("list_pending_account_requests", () => {
    it("lists pending requests oldest first", async () => {
        vi.setSystemTime(new Date("2026-11-20T09:00:00Z"));
        await add_request("newer@cdrrmo.gov.ph");
        vi.setSystemTime(new Date("2026-11-20T08:00:00Z"));
        await add_request("older@cdrrmo.gov.ph");

        expect(list_pending_account_requests().map((request) => request.email)).toEqual([
            "older@cdrrmo.gov.ph",
            "newer@cdrrmo.gov.ph",
        ]);
    });

    it("leaves out approved and rejected requests", async () => {
        const approved = await add_request("approved@cdrrmo.gov.ph");
        const rejected = await add_request("rejected@cdrrmo.gov.ph");
        await add_request("pending@cdrrmo.gov.ph");

        review_account_request(approved.id, "approved", "u_admin");
        review_account_request(rejected.id, "rejected", "u_admin");

        expect(list_pending_account_requests().map((request) => request.email)).toEqual(["pending@cdrrmo.gov.ph"]);
    });
});

describe("review_account_request", () => {
    it("returns true and records the review time", async () => {
        vi.setSystemTime(new Date("2026-11-20T10:30:00Z"));
        const request = await add_request("maria.cruz@cdrrmo.gov.ph");

        expect(review_account_request(request.id, "approved", "u_admin")).toBe(true);
        expect(request.reviewed_at).toBe(new Date("2026-11-20T10:30:00Z").getTime());
    });

    it("returns false for an unknown id or a request that was already reviewed", async () => {
        const request = await add_request("maria.cruz@cdrrmo.gov.ph");
        review_account_request(request.id, "rejected", "u_admin");

        expect(review_account_request("does-not-exist", "approved", "u_admin")).toBe(false);
        expect(review_account_request(request.id, "approved", "u_admin")).toBe(false);
        expect(request.status).toBe("rejected");
    });
});
