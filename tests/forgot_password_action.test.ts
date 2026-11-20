// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { request_password_reset } from "@/app/forgot-password/actions";
import { clear_password_reset_requests, list_password_reset_requests } from "@/lib/auth/password_reset_requests";
import { make_form_data } from "./helpers/mock_next";

const valid_fields = {
    email: "ana.cruz@cdrrmo.gov.ph",
    employee_id: "CDRRMO-0456",
};

function submit(overrides: Partial<Record<keyof typeof valid_fields, string | null>> = {}) {
    const fields: Record<string, string> = {};
    for (const [name, value] of Object.entries({ ...valid_fields, ...overrides })) {
        if (value !== null) fields[name] = value;
    }
    return request_password_reset({}, make_form_data(fields));
}

beforeEach(() => {
    clear_password_reset_requests();
});

describe("forgot password: field validation", () => {
    it("reports every missing field at once", async () => {
        const state = await request_password_reset({}, new FormData());

        expect(state.field_errors).toEqual({
            email: "Enter your email address.",
            employee_id: "Enter your employee ID.",
        });
        expect(state.is_submitted).toBeUndefined();
        expect(list_password_reset_requests()).toHaveLength(0);
    });

    it("rejects an invalid email", async () => {
        const state = await submit({ email: "not-an-email" });

        expect(state.field_errors).toEqual({ email: "Enter a valid email address." });
        expect(list_password_reset_requests()).toHaveLength(0);
    });

    it("rejects an employee ID in the wrong format", async () => {
        for (const employee_id of ["0456", "CDRRMO-45", "CDRRMO-04567", "XYZ-0456"]) {
            const state = await submit({ employee_id });
            expect(state.field_errors).toEqual({ employee_id: "Use the format CDRRMO-0000." });
        }
        expect(list_password_reset_requests()).toHaveLength(0);
    });

    it("echoes the typed values back when there are errors", async () => {
        const state = await submit({ email: " ana.cruz@cdrrmo ", employee_id: "cdrrmo-0456" });

        expect(state.values).toEqual({ email: "ana.cruz@cdrrmo", employee_id: "CDRRMO-0456" });
    });
});

describe("forgot password: saving the request", () => {
    it("saves a pending request for IT Staff and reports success", async () => {
        const state = await submit();

        expect(state).toEqual({ is_submitted: true });
        const requests = list_password_reset_requests();
        expect(requests).toHaveLength(1);
        expect(requests[0]).toMatchObject({
            email: "ana.cruz@cdrrmo.gov.ph",
            employee_id: "CDRRMO-0456",
            status: "pending",
        });
        expect(requests[0].id).toBeTruthy();
    });

    it("normalizes the email and employee ID before saving", async () => {
        await submit({ email: "  Ana.Cruz@CDRRMO.gov.ph ", employee_id: " cdrrmo-0456 " });

        expect(list_password_reset_requests()[0]).toMatchObject({
            email: "ana.cruz@cdrrmo.gov.ph",
            employee_id: "CDRRMO-0456",
        });
    });

    it("keeps one pending request per email but still reports success", async () => {
        const first = await submit();
        const second = await submit({ email: "ANA.CRUZ@cdrrmo.gov.ph" });

        expect(first).toEqual({ is_submitted: true });
        expect(second).toEqual({ is_submitted: true });
        expect(list_password_reset_requests()).toHaveLength(1);
    });

    it("never stores a password", async () => {
        await request_password_reset({}, make_form_data({ ...valid_fields, password: "ShouldNotBeKept1" }));

        expect(JSON.stringify(list_password_reset_requests())).not.toContain("ShouldNotBeKept1");
    });
});
