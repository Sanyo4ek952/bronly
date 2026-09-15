import { expect, test } from "@playwright/test";

import { assertSafeMutationTarget, e2eEnv, hasGuestFixture } from "./support/env";
import { deleteGuestRequestByName, getGuestRequestByName } from "./support/staging-db";

function requestPath() {
  const params = new URLSearchParams({
    roomId: e2eEnv.owner.roomId,
    checkIn: e2eEnv.guest.checkIn,
    checkOut: e2eEnv.guest.checkOut,
    adults: "2",
    rooms: "1",
  });

  return `/p/${e2eEnv.owner.publicSlug}/request?${params.toString()}`;
}

test.describe("guest", () => {
  test("guest filters one owner storefront and keeps a concrete room_id", async ({ page }) => {
    test.skip(!hasGuestFixture(), "Configure the public owner slug, room and dates for the guest fixture.");
    await page.goto(`/p/${e2eEnv.owner.publicSlug}`);

    await expect(page.getByRole("heading", { name: "Подберите номер" })).toBeVisible();
    await expect(page.getByText("Заявка всегда создаётся на конкретный номер.")).toBeVisible();

    await page.getByLabel("Заезд", { exact: true }).fill(e2eEnv.guest.checkIn);
    await page.getByLabel("Выезд", { exact: true }).fill(e2eEnv.guest.checkOut);
    await page.getByLabel("Гости", { exact: true }).selectOption("2");
    await page.getByLabel("Комнаты", { exact: true }).selectOption("1");
    await page.getByRole("button", { name: "Подобрать номера" }).click();

    await expect(page).toHaveURL(new RegExp(`checkIn=${e2eEnv.guest.checkIn}`));
    await expect(page).toHaveURL(new RegExp(`checkOut=${e2eEnv.guest.checkOut}`));

    await page.goto(requestPath());
    await expect(page.getByRole("heading", { name: "Оставить заявку" })).toBeVisible();
    await expect(page.locator('input[name="roomId"]')).toHaveValue(e2eEnv.owner.roomId);
    await expect(page.getByLabel("Номер", { exact: true })).toHaveValue(e2eEnv.owner.roomId);
  });

  test("guest submits a request with a persisted pricing snapshot", async ({ page }, testInfo) => {
    test.skip(!hasGuestFixture(), "Configure the public owner slug, room and dates for the guest fixture.");
    test.skip(!e2eEnv.allowMutations, "Set E2E_ALLOW_MUTATIONS=true for the reversible staging write smoke.");
    assertSafeMutationTarget();

    const guestName = `E2E Guest ${testInfo.project.name} ${Date.now()}`;

    try {
      await page.goto(requestPath());
      await page.getByLabel("Ваше имя").fill(guestName);
      await page.getByLabel("Телефон").fill("+79990000000");
      await page.getByLabel("Комментарий").fill("Автоматический Playwright smoke, запись будет удалена.");
      await page.getByRole("checkbox").check();
      await page.getByRole("button", { name: "Отправить заявку", exact: true }).click();

      await expect(page).toHaveURL(/\/request\/success(?:[/?#]|$)/);
      await expect(page.getByRole("heading", { name: "Заявка отправлена" })).toBeVisible();
      await expect(page.getByText("Владелец свяжется с вами", { exact: false })).toBeVisible();

      const request = await getGuestRequestByName(guestName);

      expect(request).not.toBeNull();
      expect(request?.source).toBe("owner");
      expect(request?.room_id).toBe(e2eEnv.owner.roomId);
      expect(request?.base_price_per_night).not.toBeNull();
      expect(request?.total_price).not.toBeNull();
      expect(request?.pricing_snapshot).not.toEqual({});
    } finally {
      await deleteGuestRequestByName(guestName);
    }
  });

  test("anonymous guest is redirected from protected role surfaces", async ({ page }) => {
    for (const protectedPath of ["/dashboard", "/agent/dashboard", "/admin"]) {
      await page.goto(protectedPath);
      await expect(page).toHaveURL(/\/login(?:[/?#]|$)/);
    }
  });
});
