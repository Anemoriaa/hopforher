import assert from "node:assert/strict";
import test from "node:test";
import { formatDateForLocales, getPreferredLocales } from "../../apps/web/src/lib/locale.js";

test("getPreferredLocales keeps valid locales when invalid tokens are mixed in", () => {
  assert.deepEqual(getPreferredLocales(["es-ES", "*", "en_US", ""]), ["es-ES", "en-US"]);
});

test("getPreferredLocales falls back to the default locale when every token is invalid", () => {
  assert.deepEqual(getPreferredLocales(["*", "not a locale"]), ["en-US"]);
});

test("formatDateForLocales ignores malformed locale tokens instead of forcing en-US fallback", () => {
  const value = "2026-03-05T19:00:00Z";
  const options = {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  };

  assert.equal(
    formatDateForLocales(value, ["es-ES", "*", "en-US"], options),
    new Intl.DateTimeFormat(["es-ES", "en-US"], options).format(new Date(value))
  );
});
