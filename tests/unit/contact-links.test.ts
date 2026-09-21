import assert from "node:assert/strict";
import test from "node:test";
import { toMaxHref, toPhoneHref, toTelegramHref } from "../../src/shared/lib/contact-links.ts";

test("MAX preserves an explicit profile URL and normalizes a copied URL without protocol", () => {
  assert.equal(toMaxHref(" https://max.ru/u/Abc_123-def "), "https://max.ru/u/Abc_123-def");
  assert.equal(toMaxHref("max.ru/u/Abc_123-def"), "https://max.ru/u/Abc_123-def");
});

test("MAX does not create a messenger contact from a phone, handle or empty value", () => {
  for (const value of [null, undefined, "", "   ", "+7 900 123-45-67", "79001234567", "@username", "https://max.ru/"]) {
    assert.equal(toMaxHref(value), undefined, String(value));
  }
});

test("MAX rejects external destinations, credentials, unsafe schemes and malformed URLs", () => {
  for (const value of ["javascript:alert(1)", "http://max.ru/u/abc", "https://max.ru.evil.test/u/abc", "https://evil.test/max.ru/u/abc", "https://max.ru@evil.test/u/abc", "https://user:secret@max.ru/u/abc", "https://max.ru:9999/u/abc", "https://max.ru/u/ab c", "https://max.ru\\@evil.test/u/abc", "https://max.ru/u/" + "a".repeat(2048)]) {
    assert.equal(toMaxHref(value), undefined, value);
  }
});

test("existing telephone and Telegram links still work", () => {
  assert.equal(toPhoneHref("+7 (900) 123-45-67"), "tel:+79001234567");
  assert.equal(toTelegramHref("@example"), "https://t.me/example");
});
