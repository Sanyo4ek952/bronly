import { expect, test } from "@playwright/test";
import { loginAs } from "./support/auth";
import { e2eEnv, hasRoleCredentials } from "./support/env";

test.use({ serviceWorkers: "block" });

for (const role of ["owner", "agent"] as const) {
  test(`${role}: MAX settings reject an unrelated URL without changing the profile`, async ({ page }) => {
    test.skip(!hasRoleCredentials(role), "Configure the dedicated E2E account.");
    await loginAs(page, role);
    const settings = role === "owner" ? "/dashboard/settings" : "/agent/dashboard/settings";
    await page.goto(settings);
    const maxInput = page.getByLabel("MAX", { exact: true });
    await expect(maxInput).toBeVisible();
    const original = await maxInput.inputValue();
    await maxInput.fill("https://example.com/unrelated");
    await page.getByRole("button", { name: role === "owner" ? "Сохранить изменения" : "Сохранить", exact: true }).click();
    await expect(page).toHaveURL(`${settings}?error=max-url`);
    await expect(page.getByText("Укажите ссылку на профиль MAX вида https://max.ru/u/…")).toBeVisible();
    await expect(maxInput).toHaveValue(original);
    await expect(page.getByText(/WhatsApp/i)).toHaveCount(0);
  });
}

test("public owner contacts have no obsolete messenger links", async ({ page }) => {
  test.skip(!e2eEnv.owner.publicSlug, "Configure the public owner fixture.");
  await page.goto(`/p/${encodeURIComponent(e2eEnv.owner.publicSlug)}`);
  await expect(page.getByRole("heading", { name: "Подберите номер" })).toBeVisible();
  await expect(page.getByRole("link", { name: /WhatsApp/i })).toHaveCount(0);
  await expect(page.locator('a[href*="wa.me"]')).toHaveCount(0);
  const maxLinks = page.getByRole("link", { name: "MAX", exact: true });
  for (const link of await maxLinks.all()) {
    await expect(link).toHaveAttribute("href", /^https:\/\/max\.ru\/.+/);
  }
});
