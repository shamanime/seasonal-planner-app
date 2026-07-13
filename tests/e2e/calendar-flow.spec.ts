import { expect, test } from "@playwright/test";
import { stringToBase64URL } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const email = `calendar-e2e-${Date.now()}@example.com`;
const password = "browser-test-password";

async function signIn(page: import("@playwright/test").Page) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  expect(createError).toBeNull();

  const supabase = createClient(url, publicKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  expect(error).toBeNull();
  expect(data.session).not.toBeNull();

  const projectRef = new URL(url).hostname.split(".")[0];
  await page.context().addCookies([
    {
      name: `sb-${projectRef}-auth-token`,
      value: `base64-${stringToBase64URL(JSON.stringify(data.session))}`,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
  await page.goto("/dashboard");
}

test("a family can clone, customize, and navigate its calendar", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=(?:%2F|\/)dashboard$/);

  await signIn(page);
  await expect(page.getByRole("heading", { name: "Your seasonal calendars" })).toBeVisible();

  await page.getByPlaceholder("Family name").fill("Integration Test Family");
  await page.getByRole("button", { name: "Clone template" }).click();
  await expect(page).toHaveURL(/\/calendar\/[0-9a-f-]+\/edit$/);
  await expect(
    page.getByRole("heading", {
      name: "Integration Test Family Seasonal Activity Calendar",
    }),
  ).toBeVisible();

  const activityTitle = `Browser test activity ${Date.now()}`;
  const addActivity = page.locator("aside form");
  await addActivity.getByPlaceholder("Activity title").fill(activityTitle);
  await addActivity.getByPlaceholder("Timing").fill("Next weekend");
  await addActivity.getByPlaceholder("Description").fill("Added from Playwright");
  await addActivity.getByRole("button", { name: "Add custom activity" }).click();

  await expect(page.locator(`input[value="${activityTitle}"]`)).toBeVisible();
  await expect(page.locator('input[value="Next weekend"]')).toBeVisible();

  await page.getByRole("link", { name: "Dashboard" }).first().click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", {
      name: "Integration Test Family Seasonal Activity Calendar",
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page.locator(`input[value="${activityTitle}"]`)).toBeVisible();

  await page.getByRole("link", { name: "Share view" }).first().click();
  await expect(page).toHaveURL(/\/c\/[a-z0-9-]+-[A-Za-z0-9_-]{16}$/);
  await expect(page.getByText(activityTitle)).toBeVisible();
});
