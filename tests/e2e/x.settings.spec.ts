import { test, expect } from "@playwright/test";

test.describe("Dashboard Settings — X Integration (Disconnect modal + success toast)", () => {
  test.beforeEach(async ({ context, page }) => {
    // Middleware only checks existence of pp_session cookie, not validity.
    await context.addCookies([
      {
        name: "pp_session",
        value: "dummy",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    // Mock /api/auth/me to avoid depending on local JSON users
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: "e2e", playerId: "e2e", username: "e2e", email: "e2e@example.com" },
        }),
      });
    });
  });

  test("shows connected state and supports disconnect via custom modal", async ({ page }) => {
    // Mock /api/x/status as connected
    await page.route("**/api/x/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          connected: true,
          handle: "@e2e_user",
          tokenExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
        }),
      });
    });

    // Mock /api/x/history (empty)
    await page.route("**/api/x/history", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [] }),
      });
    });

    // Visit settings
    await page.goto("/dashboard/settings");

    // Connected banner
    await expect(page.getByText(/Connected/i)).toBeVisible();

    // Open custom disconnect modal
    await page.getByRole("button", { name: "Disconnect" }).click();
    await expect(page.getByRole("dialog", { name: "Disconnect X" })).toBeVisible();
    await expect(page.getByText(/Are you sure you want to disconnect your X account\?/i)).toBeVisible();

    // Mock disconnect endpoint to succeed
    await page.route("**/api/x/disconnect", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    // Confirm in modal
    const modal = page.getByRole("dialog", { name: "Disconnect X" });
    await modal.getByRole("button", { name: "Disconnect" }).click();

    // Success toast appears (aria-live region)
    await expect(page.getByText(/Disconnected from X/i)).toBeVisible();
  });
});