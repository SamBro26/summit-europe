import { describe, test } from "node:test";
import { strictEqual } from "node:assert";
import { isPremiumSubscription, QUARTERLY } from "./billing";
import { BILLING_EN, BILLING_I18N } from "./i18n-billing";
import { LANGUAGES } from "./languages";

const now = Date.parse("2026-10-12T00:00:00Z");
const future = "2026-11-12T00:00:00Z";
const past = "2026-10-01T00:00:00Z";

describe("isPremiumSubscription", () => {
  test("active subscription is ad-free", () => strictEqual(isPremiumSubscription("active", future, now), true));
  test("cancelled keeps ad-free until period end", () => strictEqual(isPremiumSubscription("canceled", future, now), true));
  test("cancelled after period end shows ads", () => strictEqual(isPremiumSubscription("canceled", past, now), false));
  test("failed payment keeps grace period", () => strictEqual(isPremiumSubscription("past_due", future, now), true));
  test("unpaid after retries shows ads", () => strictEqual(isPremiumSubscription("unpaid", future, now), false));
});

test("quarterly costs €4.99 every 3 months", () => {
  strictEqual(QUARTERLY.unitAmount, 499);
  strictEqual(QUARTERLY.intervalCount, 3);
});

describe("Open in Browser label (Play Store share button)", () => {
  const key = "billing.openBrowser";
  test("English source label is set", () => strictEqual(BILLING_EN[key], "Open in Browser"));
  for (const lang of LANGUAGES.filter((l) => l.code !== "en")) {
    test(`${lang.code} translates the label`, () => {
      const value = BILLING_I18N[lang.code]?.[key];
      strictEqual(typeof value, "string");
      strictEqual((value ?? "").length > 0, true);
    });
  }
});
