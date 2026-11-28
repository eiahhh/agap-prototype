// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted runs before the imports below, so the mocks exist when the modules load.
const { cookie_jar } = await vi.hoisted(async () => {
    const { create_cookie_jar } = await import("./helpers/mock_next");
    return { cookie_jar: create_cookie_jar() };
});

vi.mock("next/headers", () => ({ cookies: async () => cookie_jar.api }));

import { NextRequest } from "next/server";
import { GET } from "@/app/dashboard/records/export/route";
import type { user_role } from "@/lib/auth/demo_users";
import { session_cookie_name, sign_session } from "@/lib/auth/session_token";
import { list_advisories, reset_advisories } from "@/lib/cdrrmo/advisories";
import { all_records } from "@/lib/cdrrmo/records";
import { csv_cell, records_to_csv } from "@/lib/cdrrmo/records_csv";

const now = Date.UTC(2026, 10, 26, 2, 0);

async function sign_in_as(user_id: string, role: user_role) {
    const token = await sign_session({ user_id, role, expires_at: Date.now() + 60_000 });
    cookie_jar.store.set(session_cookie_name, { value: token });
}

function download(query = "") {
    return GET(new NextRequest(new URL(`/dashboard/records/export${query}`, "http://localhost:3000")));
}

beforeEach(() => {
    reset_advisories(now);
    cookie_jar.store.clear();
});

describe("csv_cell", () => {
    it.each([
        ["plain", "plain"],
        ["Salitran II, Paliparan III", '"Salitran II, Paliparan III"'],
        ['She said "go"', '"She said ""go"""'],
        ["line\nbreak", '"line\nbreak"'],
        ["=HYPERLINK(1)", "'=HYPERLINK(1)"],
        ["-5", "'-5"],
        ["@cmd", "'@cmd"],
        [12.5, "12.5"],
    ])("writes %j as %s", (value, expected) => {
        expect(csv_cell(value)).toBe(expected);
    });
});

describe("records_to_csv", () => {
    it("has a header and one row per record, in Manila time", () => {
        const records = all_records(list_advisories(), now);
        const lines = records_to_csv(records).replace(/^﻿/, "").trimEnd().split("\r\n");

        expect(lines[0]).toBe(
            "Date (Manila),Title,Levels,Coverage,Outcome,Times updated,Archived,Weather risk,Peak rainfall (mm/hr),Rainfall warning,Message",
        );
        expect(lines).toHaveLength(records.length + 1);
        // The newest sample was published 8 minutes before 10:00 AM.
        expect(lines[1].startsWith("2026-11-26 09:52,")).toBe(true);
    });

    it("starts with a byte order mark so Excel reads it as UTF-8", () => {
        expect(records_to_csv([]).charCodeAt(0)).toBe(0xfeff);
    });
});

describe("GET /dashboard/records/export", () => {
    it("downloads the filtered records as CSV for CDRRMO personnel", async () => {
        await sign_in_as("u_cdrrmo", "cdrrmo");

        const response = await download("?outcome=cancelled");
        const body = await response.text();

        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
        expect(response.headers.get("content-disposition")).toMatch(/^attachment; filename="agap-suspension-records-\d{4}-\d{2}-\d{2}\.csv"$/);
        const rows = body.trimEnd().split("\r\n").slice(1);
        expect(rows.length).toBeGreaterThan(0);
        expect(rows.every((row) => row.includes(",Cancelled,"))).toBe(true);
    });

    it("refuses signed-out visitors", async () => {
        expect((await download()).status).toBe(401);
    });

    it.each([
        ["u_admin", "super_admin"],
        ["u_it", "it_staff"],
    ] as const)("refuses %s", async (user_id, role) => {
        await sign_in_as(user_id, role);

        expect((await download()).status).toBe(403);
    });
});
