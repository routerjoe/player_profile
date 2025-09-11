import { test, expect } from "@playwright/test";

test.describe("Dashboard Settings — X Integration (Post Now + Schedule)", () => {
  test.beforeEach(async ({ context, page }) => {
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

    // Mock /api/auth/me to avoid reading local users store
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: { id: "e2e", playerId: "e2e", username: "e2e", email: "e2e@example.com" },
        }),
      });
    });

    // Common mocks for connected state
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

    await page.route("**/api/x/prefs", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ autoShareBlogToX: false }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ autoShareBlogToX: false }),
        });
      }
    });

    await page.route("**/api/x/history", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [] }),
      });
    });
  });

  test("Post Now flow: composer posts text and shows success toast", async ({ page }) => {
    // Mock Post Now
    await page.route("**/api/x/post", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, tweet: { id: "tw_e2e_1", text: "hello e2e" } }),
      });
    });

    await page.goto("/dashboard/settings");

    // Enter text and post
    await page.getByPlaceholder("What's happening?").fill("hello e2e");
    await page.getByRole("button", { name: "Post to X" }).click();

    // Success toast
    await expect(page.getByText(/Posted to X/i)).toBeVisible();
  });

  test("Schedule flow: schedules for now and shows success toast", async ({ page }) => {
    // Mock Schedule
    await page.route("**/api/x/schedule", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          id: "sched_e2e_1",
          scheduledFor: new Date().toISOString(),
          status: "scheduled",
        }),
      });
    });

    // Reset history mock to observe refresh after scheduling
    await page.route("**/api/x/history", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "sched_e2e_1",
              status: "scheduled",
              scheduledFor: new Date().toISOString(),
              postedAt: null,
              errorMsg: null,
            },
          ],
        }),
      });
    });

    await page.goto("/dashboard/settings");

    // Enter text and schedule (leave datetime blank to schedule now)
    await page.getByPlaceholder("What's happening?").fill("hello schedule");
    await page.getByRole("button", { name: "Schedule X post" }).click();

    // Success toast
    await expect(page.getByText(/^Scheduled$/i)).toBeVisible();
  });

  test("Error mapping: 429 on Post Now shows rate-limit message", async ({ page }) => {
    // Simulate 429
    await page.route("**/api/x/post", async (route) => {
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ error: "Too Many Requests" }),
      });
    });

    await page.goto("/dashboard/settings");

    await page.getByLabel("Composer").fill("rate limit test");
    await page.getByRole("button", { name: "Post to X" }).click();

    // Adapter maps 429 to "Rate limit reached — try again in a few minutes."
    await expect(page.getByText(/Rate limit reached/i)).toBeVisible();
  });
});