// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { register } from "@/app/register/actions";
import { clear_account_requests, list_account_requests } from "@/lib/auth/account_requests";
import { make_form_data } from "./helpers/mock_next";

const valid_fields = {
    full_name: "Maria Cruz",
    email: "maria.cruz@cdrrmo.gov.ph",
    role: "cdrrmo",
    employee_id: "CDRRMO-0123",
    password: "SafePass123",
    confirm_password: "SafePass123",
    agreement: "on",
};

function submit(overrides: Partial<Record<keyof typeof valid_fields, string | null>> = {}) {
    const fields: Record<string, string> = {};
    for (const [name, value] of Object.entries({ ...valid_fields, ...overrides })) {
        if (value !== null) fields[name] = value;
    }
    return register({}, make_form_data(fields));
}

beforeEach(() => {
    clear_account_requests();
});

describe("register: field validation", () => {
    it("reports every missing field at once", async () => {
        const state = await register({}, new FormData());

        expect(state.field_errors).toEqual({
            full_name: "Enter your full name.",
            email: "Enter your email address.",
            role: "Select a role.",
            employee_id: "Enter your employee ID.",
            password: "Enter a password.",
            confirm_password: "Re-enter your password.",
            agreement: "Confirm this to continue.",
        });
        expect(state.is_submitted).toBeUndefined();
        expect(list_account_requests()).toHaveLength(0);
    });

    it.each([
        ["full_name", "   ", "Enter your full name."],
        ["full_name", "A", "Enter your full name."],
        ["full_name", "x".repeat(101), "Full name is too long."],
        ["email", "not-an-email", "Enter a valid email address."],
        ["email", "name@cdrrmo", "Enter a valid email address."],
        ["role", "super_admin", "Select a valid role."],
        ["role", "hacker", "Select a valid role."],
        ["employee_id", "12345", "Use the format CDRRMO-0000."],
        ["employee_id", "CDRRMO-12", "Use the format CDRRMO-0000."],
        ["password", "short1", "Use at least 8 characters."],
        ["password", "x".repeat(129), "Use 128 characters or fewer."],
    ] as const)("rejects %s = %j", async (field, value, message) => {
        const overrides: Record<string, string> = { [field]: value };
        if (field === "password") overrides.confirm_password = value;

        const state = await submit(overrides);

        expect(state.field_errors).toEqual({ [field]: message });
        expect(list_account_requests()).toHaveLength(0);
    });

    it("rejects a confirm password that does not match", async () => {
        const state = await submit({ confirm_password: "SafePass124" });

        expect(state.field_errors).toEqual({ confirm_password: "Passwords do not match." });
    });

    it("requires the official-use agreement", async () => {
        const state = await submit({ agreement: null });

        expect(state.field_errors).toEqual({ agreement: "Confirm this to continue." });
        expect(list_account_requests()).toHaveLength(0);
    });

    it("returns the typed values (but never the passwords) so the form can keep them", async () => {
        const state = await submit({ full_name: "  Maria   Cruz ", agreement: null });

        expect(state.values).toEqual({
            full_name: "Maria Cruz",
            email: "maria.cruz@cdrrmo.gov.ph",
            role: "cdrrmo",
            employee_id: "CDRRMO-0123",
        });
        expect(JSON.stringify(state)).not.toContain("SafePass123");
    });
});

describe("register: submitting a request", () => {
    it("stores a pending request with normalized fields", async () => {
        const state = await submit({ email: "  Maria.Cruz@CDRRMO.gov.ph ", employee_id: "cdrrmo-0123", role: "it_staff" });

        expect(state).toEqual({ is_submitted: true });
        const [request] = list_account_requests();
        expect(request).toMatchObject({
            full_name: "Maria Cruz",
            email: "maria.cruz@cdrrmo.gov.ph",
            role: "it_staff",
            employee_id: "CDRRMO-0123",
            status: "pending",
        });
    });

    it("stores a salted hash, never the plain password", async () => {
        await submit();
        await submit({ email: "other@cdrrmo.gov.ph" });

        const [first, second] = list_account_requests();
        expect(JSON.stringify(list_account_requests())).not.toContain("SafePass123");
        expect(first.password_hash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
        expect(first.password_hash).not.toBe(second.password_hash);
    });

    it("shows the same success for an email that already has an account, without storing it", async () => {
        const state = await submit({ email: "admin@cdrrmo.gov.ph" });

        expect(state).toEqual({ is_submitted: true });
        expect(list_account_requests()).toHaveLength(0);
    });

    it("does not store a second request for the same email", async () => {
        await submit();
        const state = await submit({ email: "MARIA.CRUZ@cdrrmo.gov.ph" });

        expect(state).toEqual({ is_submitted: true });
        expect(list_account_requests()).toHaveLength(1);
    });
});
