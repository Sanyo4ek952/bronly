import { expect, test } from "@playwright/test";

import { loginAs } from "./support/auth";
import { e2eEnv, hasRoleCredentials } from "./support/env";

test.describe("admin", () => {
  test.skip(!hasRoleCredentials("admin"), "Configure the dedicated E2E admin account.");

  test("admin reaches moderation, subscription and referral controls", async ({ page }) => {
    await loginAs(page, "admin");

    await expect(page.getByText("Админка Bronly", { exact: true }).first()).toBeVisible();

    await page.goto("/admin/reviews");
    await expect(page.getByRole("heading", { name: "Проверки" })).toBeVisible();
    await expect(page.getByText("Как применяется бонус", { exact: true })).toBeVisible();

    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Пользователи" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Скрыты/ })).toBeVisible();

    if (e2eEnv.owner.profileQuery) {
      await page.getByLabel("Поиск", { exact: true }).fill(e2eEnv.owner.profileQuery);
      await expect(page.getByText(e2eEnv.owner.profileQuery, { exact: false }).first()).toBeVisible();
    }

    await page.goto("/admin/subscriptions");
    await expect(page.getByRole("heading", { name: "Подписки" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Owner", exact: true })).toBeVisible();

    if (e2eEnv.owner.profileQuery) {
      await page.getByLabel("Поиск", { exact: true }).fill(e2eEnv.owner.profileQuery);
      const subscriptionCard = page.getByRole("button").filter({ hasText: e2eEnv.owner.profileQuery }).first();
      await expect(subscriptionCard).toBeVisible();
      await subscriptionCard.click();
      await expect(page.getByRole("button", { name: "Продлить на 30 дней" })).toBeVisible();
    }

    await page.goto("/admin/properties");
    await expect(page.getByRole("heading", { name: "Объекты" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Заморожены/ })).toBeVisible();

    if (e2eEnv.testPropertyQuery) {
      await page.getByLabel("Поиск", { exact: true }).fill(e2eEnv.testPropertyQuery);
      const propertyCard = page.getByRole("button").filter({ hasText: e2eEnv.testPropertyQuery }).first();
      await expect(propertyCard).toBeVisible();
      await propertyCard.click();
      await expect(page.getByRole("button", { name: /Заморозить объект|Разморозить объект/ })).toBeVisible();
    }
  });
});
