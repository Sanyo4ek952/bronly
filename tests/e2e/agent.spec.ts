import { expect, test } from "@playwright/test";

import { loginAs } from "./support/auth";
import { e2eEnv, hasRoleCredentials } from "./support/env";

test.describe("agent", () => {
  test("registration surface exposes the agent role", async ({ page }) => {
    await page.goto("/register?role=agent");

    await expect(page.getByRole("heading", { name: "Создайте аккаунт" })).toBeVisible();
    await expect(page.getByLabel("Роль", { exact: true })).toHaveValue("agent");
    await expect(page.locator('option[value="agent"]')).toHaveText("Агент");
  });

  test("agent reaches storefront, collaborations, requests and read-only calendar", async ({ page }) => {
    test.skip(!hasRoleCredentials("agent"), "Configure the dedicated E2E agent account.");
    await loginAs(page, "agent");

    await expect(page.getByText("Агентская витрина", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Публичная ссылка агента", { exact: true })).toBeVisible();

    await page.goto("/agent/dashboard/settings");
    await expect(page.getByRole("heading", { name: "Профиль агента" })).toBeVisible();

    if (e2eEnv.agent.publicId) {
      await expect(page.getByRole("link", { name: "Открыть витрину" })).toHaveAttribute(
        "href",
        `/a/${e2eEnv.agent.publicId}`,
      );
    }

    await page.goto("/agent/dashboard/opportunities");
    await expect(page.getByText("К сотрудничеству", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("не дает права редактировать данные владельца", { exact: false })).toBeVisible();

    await page.goto("/agent/dashboard/collaborations");
    await expect(page.getByText("Связи с владельцами", { exact: true }).first()).toBeVisible();

    await page.goto("/agent/dashboard/calendar");
    await expect(page.getByText("Календарь занятости", { exact: true }).first()).toBeVisible();
    await expect(page.locator('input[name="startsOn"], input[name="endsOn"]')).toHaveCount(0);

    await page.goto("/agent/dashboard/requests");
    await expect(page.getByText("Агентские заявки", { exact: true }).first()).toBeVisible();

    await page.goto("/agent/dashboard/deals");
    await expect(page.getByText("Кто завершает", { exact: true })).toBeVisible();
    await expect(page.getByText("Владелец", { exact: true }).first()).toBeVisible();
  });

  test("agent is redirected away from owner and admin surfaces", async ({ page }) => {
    test.skip(!hasRoleCredentials("agent"), "Configure the dedicated E2E agent account.");
    await loginAs(page, "agent");

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/agent\/dashboard(?:[/?#]|$)/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/agent\/dashboard(?:[/?#]|$)/);
  });
});
