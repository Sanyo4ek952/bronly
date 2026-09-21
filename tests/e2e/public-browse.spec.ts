import { expect, test } from "@playwright/test";
import { e2eEnv } from "./support/env";

test.setTimeout(120_000);
test.use({ serviceWorkers: "block" });
const expectNavigation = expect.configure({ timeout: 30_000 });

const contexts = [
  { kind: "owner", base: e2eEnv.owner.publicSlug ? `/p/${encodeURIComponent(e2eEnv.owner.publicSlug)}` : "" },
  { kind: "agent", base: e2eEnv.agent.publicId ? `/a/${encodeURIComponent(e2eEnv.agent.publicId)}` : "" },
  { kind: "collection", base: process.env.E2E_COLLECTION_SLUG ? `/c/${encodeURIComponent(process.env.E2E_COLLECTION_SLUG)}` : "" },
];

for (const { kind, base } of contexts) {
  test(`${kind}: property → room → request keeps the source and returns to details`, async ({ page }) => {
    test.skip(!base, "Configure the public context fixture.");
    await page.goto(`${base}?adults=1&rooms=1`);
    test.skip(await page.getByRole("heading", { name: "Страница временно недоступна", exact: true }).isVisible(), "The configured public context is restricted; its blocked detail state is checked separately.");
    await expect(page.locator('a[href*="/request?"]')).toHaveCount(0);
    const property = page.getByRole("link", { name: /^Об объекте и номерах:/ }).first();
    const propertyHref = await property.getAttribute("href");
    await property.press("Enter");
    await expectNavigation(page).toHaveURL(new RegExp(`${base}/properties/`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('a[href*="/request?"]')).toHaveCount(0);
    const roomLink = page.getByRole("link", { name: /^Подробнее:/ }).first();
    await roomLink.click();
    await expectNavigation(page).toHaveURL(new RegExp(`${base}/rooms/`));
    const roomUrl = new URL(page.url());
    expect(roomUrl.searchParams.get("adults")).toBe("1");
    expect(roomUrl.searchParams.get("rooms")).toBe("1");
    const roomId = roomUrl.pathname.split("/").pop();
    await expect(page.getByRole("link", { name: "← К объекту" })).toHaveAttribute("href", propertyHref!);
    await page.getByRole("link", { name: "Оставить заявку", exact: true }).click();
    await expectNavigation(page).toHaveURL(new RegExp(`${base}/request\\?`));
    expect(new URL(page.url()).searchParams.get("roomId")).toBe(roomId);
    await expect(page.locator('select[name="roomId"]')).toHaveValue(roomId!);
    const close = page.getByRole("link", { name: "Закрыть", exact: true }).first();
    await expect(close).toHaveAttribute("href", roomUrl.pathname + roomUrl.search);
    await close.click();
    await expectNavigation(page).toHaveURL(roomUrl.href);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.locator("a a, a button")).toHaveCount(0);
  });

  test(`${kind}: unknown details do not expose a different room`, async ({ page }) => {
    test.skip(!base, "Configure the public context fixture.");
    await page.goto(`${base}/rooms/00000000-0000-0000-0000-000000000000`);
    await expect(page.getByRole("link", { name: "Оставить заявку", exact: true })).toHaveCount(0);
    await expect(page.getByText(/404|не найдена|не найден|Страница временно недоступна/).first()).toBeVisible();
  });
}

test("standalone room opens directly and retains dates through the request form", async ({ page }) => {
  test.skip(!e2eEnv.owner.publicSlug, "Configure the owner fixture.");
  await page.goto(`/p/${e2eEnv.owner.publicSlug}?checkIn=2027-10-01&checkOut=2027-10-03&adults=1&rooms=1`);
  const room = page.getByRole("link", { name: /^Подробнее:/ }).first();
  await room.click();
  await expectNavigation(page).toHaveURL(/\/rooms\//);
  await expect(page.getByText("Отдельный номер", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Заезд", { exact: true })).toHaveValue("2027-10-01");
  await expect(page.getByLabel("Выезд", { exact: true })).toHaveValue("2027-10-03");
  await page.getByRole("link", { name: "Оставить заявку", exact: true }).click();
  await expectNavigation(page).toHaveURL(/\/request\?/);
  const url = new URL(page.url());
  expect(url.searchParams.get("propertySlug")).toBeNull();
  expect(url.searchParams.get("checkIn")).toBe("2027-10-01");
  expect(url.searchParams.get("checkOut")).toBe("2027-10-03");
});

test("collection does not reveal a room outside its selection", async ({ page }) => {
  const slug = process.env.E2E_COLLECTION_SLUG;
  const excludedId = process.env.E2E_COLLECTION_EXCLUDED_ROOM_ID;
  test.skip(!slug || !excludedId, "Configure a collection and a known excluded room.");
  await page.goto(`/c/${slug}/rooms/${excludedId}`);
  await expect(page.getByText(/404|не найдена|не найден/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Оставить заявку", exact: true })).toHaveCount(0);
});

test("unsuitable room stays viewable and can be recalculated without losing the detail route", async ({ page }, testInfo) => {
  test.skip(!e2eEnv.owner.publicSlug, "Configure the owner fixture.");
  await page.goto(`/p/${e2eEnv.owner.publicSlug}?adults=20&rooms=1`);
  await expect(page.locator('a[href*="/request?"]')).toHaveCount(0);
  await page.getByRole("link", { name: /^Подробнее:/ }).first().click();
  await expectNavigation(page).toHaveURL(/\/rooms\//);
  const pathname = new URL(page.url()).pathname;
  await expect(page.getByText("Меньше гостей, чем в вашем запросе")).toBeVisible();
  await expect(page.getByRole("link", { name: "Оставить заявку", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Изменить параметры", exact: true }).click();
  await page.getByRole("combobox", { name: "Гости", exact: true }).click();
  await page.getByRole("option", { name: "1 гость", exact: true }).click();
  await page.getByRole("button", { name: "Рассчитать стоимость", exact: true }).click();
  await expectNavigation(page).toHaveURL((url) => url.pathname === pathname && url.searchParams.get("adults") === "1" && url.searchParams.get("rooms") === "1");
  await expect(page.getByRole("link", { name: "Оставить заявку", exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("room-detail.png"), fullPage: true });
});
