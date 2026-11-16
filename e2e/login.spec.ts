import { test, expect } from "@playwright/test";

test.describe("AGAP Root Redirection", () => {
  test("visiting '/' redirects to '/login'", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe("AGAP Login Page - UI & Responsive Layout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("displays brand panel and marketing details on desktop viewport", async ({ page, isMobile }) => {
    test.skip(isMobile, "This test only runs on desktop viewports.");

    const brandPanel = page.locator("aside");
    await expect(brandPanel).toBeVisible();
    await expect(brandPanel).toContainText("CDRRMO · Dasmariñas City");
    await expect(brandPanel).toContainText("Verified information for faster, calmer decisions.");

    // Mobile-only logo should be hidden on desktop
    const mobileLogo = page.locator(".lg\\:hidden");
    await expect(mobileLogo).toBeHidden();
  });

  test("displays mobile logo and hides brand panel on mobile screens", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone viewport

    const brandPanel = page.locator("aside");
    await expect(brandPanel).toBeHidden();

    const mobileLogo = page.locator(".lg\\:hidden");
    await expect(mobileLogo).toBeVisible();
  });
});

test.describe("AGAP Login Page - Form Interactions & Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("requires email and password inputs", async ({ page }) => {
    const emailInput = page.getByLabel("Email address");
    const passwordInput = page.getByLabel("Password");

    await expect(emailInput).toHaveAttribute("required", "");
    await expect(passwordInput).toHaveAttribute("required", "");
    await expect(emailInput).toHaveAttribute("type", "email");
  });

  test("toggles password visibility between masked and plain text", async ({ page }) => {
    const passwordInput = page.getByLabel("Password");
    const toggleButton = page.getByRole("button", { name: /Show|Hide/i });

    // Initial state: hidden (password type)
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(toggleButton).toHaveText("Show");

    // Click Show
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "text");
    await expect(toggleButton).toHaveText("Hide");

    // Click Hide
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(toggleButton).toHaveText("Show");
  });

  test("toggles the 'Keep me signed in' checkbox", async ({ page }) => {
    const checkbox = page.getByRole("checkbox", { name: /Keep me signed in/i });

    await expect(checkbox).not.toBeChecked();
    await checkbox.check();
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test("shows 'Signing in…' state during form submission", async ({ page }) => {
    await page.getByLabel("Email address").fill("officer@cdrrmo.gov.ph");
    await page.getByLabel("Password").fill("Secret123!");

    const submitButton = page.getByRole("button", { name: "Sign in" });
    await submitButton.click();

    // Verify submission button enters loading state
    await expect(page.getByRole("button", { name: "Signing in…" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Signing in…" })).toBeDisabled();
  });
});

test.describe("AGAP Navigation Links & Route Health", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("verifies 'Forgot password?' link route exists", async ({ page }) => {
    const forgotLink = page.getByRole("link", { name: "Forgot password?" });
    await expect(forgotLink).toHaveAttribute("href", "/forgot-password");

    const response = await page.goto("/forgot-password");
    // This assertion checks if the route exists or returns a 404
    expect(response?.status(), "Route /forgot-password should return 200 OK").toBe(200);
  });

  test("verifies 'Request an account' link route exists", async ({ page }) => {
    const requestLink = page.getByRole("link", { name: "Request an account" });
    await expect(requestLink).toHaveAttribute("href", "/request-account");

    const response = await page.goto("/request-account");
    // This assertion checks if the route exists or returns a 404
    expect(response?.status(), "Route /request-account should return 200 OK").toBe(200);
  });
});

