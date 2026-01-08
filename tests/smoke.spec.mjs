import { test, expect } from "@playwright/test";

test("home loads UI shell and overlay", async ({ page }) => {
  await page.goto("/?skipIntro=1");
  await expect(page.locator("#overlay")).toBeVisible();
  await expect(page.locator("#wallet-connect")).toHaveText(/connect wallet/i);
  await expect(page.locator("#ui")).toBeVisible();
});
