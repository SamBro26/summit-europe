import { describe, test } from "node:test";
import { deepStrictEqual, strictEqual } from "node:assert";
import { computeShowAds, DAY_MS } from "./ad-status";

const start = Date.UTC(2026, 9, 1);
const profile = { trial_start_date: new Date(start).toISOString(), is_premium: false };

describe("ad-free trial and subscription", () => {
  test("trial is ad-free for strictly less than 30 days", () => {
    deepStrictEqual(computeShowAds(profile, start + 30 * DAY_MS - 1), {
      show_ads: false, reason: "trial", trialDaysLeft: 1,
    });
  });
  test("non-premium users see ads at the 30-day boundary", () => {
    deepStrictEqual(computeShowAds(profile, start + 30 * DAY_MS), {
      show_ads: true, reason: "free_with_ads", trialDaysLeft: 0,
    });
  });
  test("premium users stay ad-free after trial expiry", () => {
    strictEqual(computeShowAds({ ...profile, is_premium: true }, start + 31 * DAY_MS).show_ads, false);
  });
  test("countdown changes only at the next trial-day boundary", () => {
    strictEqual(computeShowAds(profile, start + 24 * DAY_MS).trialDaysLeft, 6);
    strictEqual(computeShowAds(profile, start + 25 * DAY_MS).trialDaysLeft, 5);
  });
});