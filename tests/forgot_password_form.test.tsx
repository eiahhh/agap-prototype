import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Forgot_password_form } from "@/components/forgot_password/forgot_password_form";
import { clear_password_reset_requests, list_password_reset_requests } from "@/lib/auth/password_reset_requests";

beforeEach(() => {
    clear_password_reset_requests();
});

afterEach(() => {
    cleanup();
});

function fill(email: string, employee_id: string) {
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: email } });
    fireEvent.change(screen.getByLabelText("Employee ID"), { target: { value: employee_id } });
}

function submit() {
    fireEvent.click(screen.getByRole("button", { name: /request reset/i }));
}

describe("forgot password form", () => {
    it("shows errors for empty fields and marks them invalid", async () => {
        render(<Forgot_password_form />);
        submit();

        expect(await screen.findByText("Enter your email address.")).toBeTruthy();
        expect(screen.getByText("Enter your employee ID.")).toBeTruthy();

        const email_input = screen.getByLabelText("Email address");
        const employee_id_input = screen.getByLabelText("Employee ID");
        expect(email_input.getAttribute("aria-invalid")).toBe("true");
        expect(email_input.getAttribute("aria-describedby")).toBe("email-error");
        expect(employee_id_input.getAttribute("aria-invalid")).toBe("true");
        expect(employee_id_input.getAttribute("aria-describedby")).toBe("employee_id-error");
    });

    it("keeps what was typed when there is an error", async () => {
        render(<Forgot_password_form />);
        fill("ana.cruz@cdrrmo.gov.ph", "0456");
        submit();

        expect(await screen.findByText("Use the format CDRRMO-0000.")).toBeTruthy();
        expect((screen.getByLabelText("Email address") as HTMLInputElement).value).toBe("ana.cruz@cdrrmo.gov.ph");
        expect((screen.getByLabelText("Employee ID") as HTMLInputElement).value).toBe("0456");
        expect(screen.getByLabelText("Email address").getAttribute("aria-invalid")).toBeNull();
    });

    it("shows the Request received screen after a valid submit", async () => {
        render(<Forgot_password_form />);
        fill("ana.cruz@cdrrmo.gov.ph", "CDRRMO-0456");
        submit();

        const heading = await screen.findByRole("heading", { name: "Request received" });
        expect(document.activeElement).toBe(heading);
        expect(screen.getByText(/sent to IT Staff/)).toBeTruthy();
        expect(screen.getByRole("link", { name: /back to sign in/i }).getAttribute("href")).toBe("/login");
        expect(screen.queryByLabelText("Email address")).toBeNull();
        expect(list_password_reset_requests()).toHaveLength(1);
    });

    it("links back to sign in", () => {
        render(<Forgot_password_form />);

        expect(screen.getByRole("link", { name: /back to sign in/i }).getAttribute("href")).toBe("/login");
    });
});
