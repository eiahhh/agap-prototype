import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Register_form } from "@/components/register/register_form";
import { clear_account_requests, requestable_role_options } from "@/lib/auth/account_requests";

beforeEach(() => {
    clear_account_requests();
});

afterEach(() => {
    cleanup();
});

function render_form() {
    render(<Register_form role_options={requestable_role_options} />);
}

function fill(fields: Partial<Record<string, string>>) {
    for (const [label, value] of Object.entries(fields)) {
        fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
}

function fill_valid_form() {
    fill({
        "Full name": "Maria Cruz",
        "Email address": "maria.cruz@cdrrmo.gov.ph",
        "Requested role": "cdrrmo",
        "Employee ID": "CDRRMO-0123",
        Password: "SafePass123",
        "Confirm password": "SafePass123",
    });
    fireEvent.click(screen.getByRole("checkbox"));
}

function submit() {
    fireEvent.click(screen.getByRole("button", { name: /submit request/i }));
}

describe("register form", () => {
    it("offers only the roles that can be requested", () => {
        render_form();
        const options = Array.from((screen.getByLabelText("Requested role") as HTMLSelectElement).options);

        expect(options.map((option) => option.textContent)).toEqual(["Select role", "CDRRMO Personnel", "IT Staff"]);
    });

    it("shows errors for every empty field and marks them invalid", async () => {
        render_form();
        submit();

        expect(await screen.findByText("Enter your full name.")).toBeTruthy();
        for (const message of [
            "Enter your email address.",
            "Select a role.",
            "Enter your employee ID.",
            "Enter a password.",
            "Re-enter your password.",
            "Confirm this to continue.",
        ]) {
            expect(screen.getByText(message)).toBeTruthy();
        }

        const name_input = screen.getByLabelText("Full name");
        expect(name_input.getAttribute("aria-invalid")).toBe("true");
        expect(name_input.getAttribute("aria-describedby")).toBe("full_name-error");
        expect(screen.getByRole("checkbox").getAttribute("aria-describedby")).toBe("agreement-error");
    });

    it("keeps typed values after an error", async () => {
        render_form();
        fill_valid_form();
        fill({ "Confirm password": "Different123" });
        submit();

        expect(await screen.findByText("Passwords do not match.")).toBeTruthy();
        expect((screen.getByLabelText("Full name") as HTMLInputElement).value).toBe("Maria Cruz");
        expect((screen.getByLabelText("Requested role") as HTMLSelectElement).value).toBe("cdrrmo");
        expect((screen.getByLabelText("Employee ID") as HTMLInputElement).value).toBe("CDRRMO-0123");
        expect(screen.getByRole("checkbox")).toHaveProperty("checked", true);
    });

    it("toggles both password fields with Show/Hide", () => {
        render_form();
        fireEvent.click(screen.getByRole("button", { name: "Show password" }));

        expect(screen.getByLabelText("Password").getAttribute("type")).toBe("text");
        expect(screen.getByLabelText("Confirm password").getAttribute("type")).toBe("text");

        fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
        expect(screen.getByLabelText("Password").getAttribute("type")).toBe("password");
    });

    it("shows the Request received screen after a valid submission", async () => {
        render_form();
        fill_valid_form();
        submit();

        const heading = await screen.findByRole("heading", { name: "Request received" });
        expect(document.activeElement).toBe(heading);
        expect(screen.getByRole("link", { name: /back to sign in/i }).getAttribute("href")).toBe("/login");
        expect(screen.queryByRole("button", { name: /submit request/i })).toBeNull();
    });
});
