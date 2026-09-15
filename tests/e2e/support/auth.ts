import { expect, type Page } from "@playwright/test";

import { getRoleCredentials, type AuthRole } from "./env";

const expectedRolePath: Record<AuthRole, RegExp> = {
  owner: /\/dashboard(?:[/?#]|$)/,
  agent: /\/agent\/dashboard(?:[/?#]|$)/,
  admin: /\/admin(?:[/?#]|$)/,
};

export async function loginAs(page: Page, role: AuthRole) {
  const credentials = getRoleCredentials(role);

  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(credentials.email);
  await page.getByLabel("Пароль", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page).toHaveURL(expectedRolePath[role]);
  await expect(page.getByText("Не удалось загрузить", { exact: false })).toHaveCount(0);
}
