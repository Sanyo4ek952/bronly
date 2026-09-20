import { expect, test } from "@playwright/test";

import { loginAs } from "./support/auth";
import { e2eEnv, hasRoleCredentials } from "./support/env";

test.describe("owner", () => {
  test("registration surface and owner role are available", async ({ page }) => {
    await page.goto("/register?role=owner");

    await expect(page.getByRole("heading", { name: "Создайте аккаунт" })).toBeVisible();
    const roleSelect = page.getByLabel("Роль", { exact: true });

    await expect(roleSelect).toHaveText("Владелец");
    await roleSelect.click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(roleSelect).toHaveText("Агент");
    await expect(page.locator('select[name="role"]')).toHaveValue("agent");

    await page.locator("form").evaluate((form) => (form as HTMLFormElement).reset());
    await expect(roleSelect).toHaveText("Владелец");
    await expect(page.locator('select[name="role"]')).toHaveValue("owner");
  });

  test("owner reaches inventory, standalone room, calendar and public link", async ({ page }) => {
    test.skip(!hasRoleCredentials("owner"), "Configure the dedicated E2E owner account.");
    await loginAs(page, "owner");

    await expect(page.getByText("Быстрые действия", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Добавить номер", exact: true })).toBeVisible();

    await page.goto("/dashboard/properties");
    await expect(page.getByRole("heading", { name: "Объекты и номера" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Добавить объект" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Отдельный номер/ }).first()).toBeVisible();

    await page.goto("/dashboard/properties/new");
    await expect(page.getByRole("heading", { name: "Новый объект" })).toBeVisible();
    await expect(page.getByLabel("Название объекта")).toBeVisible();
    await expect(page.getByLabel("Фотографии объекта")).toBeVisible();

    await page.goto("/dashboard/rooms/new");
    await expect(page.getByRole("heading", { name: "Новый отдельный номер" })).toBeVisible();
    await expect(page.getByLabel("Базовая цена за ночь")).toBeVisible();
    await expect(page.getByText("Занятые даты", { exact: true })).toBeVisible();

    await page.goto("/dashboard/calendar");
    await expect(page.getByRole("heading", { name: "Календарь занятости" })).toBeVisible();

    await page.goto("/dashboard/settings");
    await expect(page.getByRole("heading", { name: "Профиль владельца" })).toBeVisible();

    if (e2eEnv.owner.publicSlug) {
      await expect(page.getByRole("link", { name: "Открыть страницу" })).toHaveAttribute(
        "href",
        `/p/${e2eEnv.owner.publicSlug}`,
      );
    }
  });

  test("mobile inventory select closes before its filter sheet", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes("mobile"), "This interaction is specific to the mobile filter sheet.");
    test.skip(!hasRoleCredentials("owner"), "Configure the dedicated E2E owner account.");
    await loginAs(page, "owner");
    await page.goto("/dashboard/properties");

    await page.getByRole("button", { name: "Открыть фильтры" }).click();
    const sheetHeading = page.getByRole("heading", { name: "Фильтры" });
    await expect(sheetHeading).toBeVisible();

    await page.getByLabel("Статус", { exact: true }).click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toBeHidden();
    await expect(sheetHeading).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(sheetHeading).toBeHidden();
  });

  test("owner cannot enter agent or admin role surfaces", async ({ page }) => {
    test.skip(!hasRoleCredentials("owner"), "Configure the dedicated E2E owner account.");
    await loginAs(page, "owner");

    await page.goto("/agent/dashboard");
    await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
  });
});
