import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

// The form calls the real login server action; only Next's request APIs are stubbed.
vi.mock("next/headers", async () => {
    const { create_cookie_jar } = await import("./helpers/mock_next");
    const jar = create_cookie_jar();
    return { cookies: async () => jar.api };
});
vi.mock("next/navigation", async () => {
    const { create_redirect_mock } = await import("./helpers/mock_next");
    return { redirect: create_redirect_mock() };
});

import { Login_form } from "@/components/login/login_form";

afterEach(() => {
    cleanup();
});

function fill_and_submit(email: string, password: string) {
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: email } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("login form validation messages", () => {
    it("shows required-field errors and marks both inputs invalid", async () => {
        render(<Login_form />);
        fill_and_submit("", "");

        expect(await screen.findByText("Enter your email address.")).toBeTruthy();
        expect(screen.getByText("Enter your password.")).toBeTruthy();

        const email_input = screen.getByLabelText("Email address");
        const password_input = screen.getByLabelText("Password");
        expect(email_input.getAttribute("aria-invalid")).toBe("true");
        expect(email_input.getAttribute("aria-describedby")).toBe("email-error");
        expect(password_input.getAttribute("aria-invalid")).toBe("true");
        expect(password_input.getAttribute("aria-describedby")).toBe("password-error");
    });

    it("shows a format error for an invalid email", async () => {
        render(<Login_form />);
        fill_and_submit("not-an-email", "Admin@2026");

        expect(await screen.findByText("Enter a valid email address.")).toBeTruthy();
        expect(screen.queryByText("Enter your password.")).toBeNull();
    });

    it("shows a generic alert for wrong credentials and keeps the typed email", async () => {
        render(<Login_form />);
        fill_and_submit("admin@cdrrmo.gov.ph", "WrongPass1");

        const alert = await screen.findByRole("alert");
        expect(alert.textContent).toBe("Incorrect email or password.");
        expect((screen.getByLabelText("Email address") as HTMLInputElement).value).toBe("admin@cdrrmo.gov.ph");
        expect(screen.getByLabelText("Email address").getAttribute("aria-invalid")).toBeNull();
    });

    it("clears earlier field errors once the input is fixed", async () => {
        render(<Login_form />);
        fill_and_submit("", "");
        expect(await screen.findByText("Enter your email address.")).toBeTruthy();

        fill_and_submit("admin@cdrrmo.gov.ph", "WrongPass1");

        expect(await screen.findByRole("alert")).toBeTruthy();
        expect(screen.queryByText("Enter your email address.")).toBeNull();
        expect(screen.queryByText("Enter your password.")).toBeNull();
    });

    it("toggles password visibility with the Show/Hide button", () => {
        render(<Login_form />);
        const password_input = screen.getByLabelText("Password");
        expect(password_input.getAttribute("type")).toBe("password");

        fireEvent.click(screen.getByRole("button", { name: "Show password" }));
        expect(password_input.getAttribute("type")).toBe("text");

        fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
        expect(password_input.getAttribute("type")).toBe("password");
    });
});

describe("login form state after an error", () => {
    it("keeps 'Keep me signed in' ticked after a failed sign-in", async () => {
        render(<Login_form />);
        fireEvent.click(screen.getByRole("checkbox"));
        fill_and_submit("admin@cdrrmo.gov.ph", "WrongPass1");

        await screen.findByRole("alert");
        expect(screen.getByRole("checkbox")).toHaveProperty("checked", true);
    });
});
