import { describe, expect, test } from "bun:test";
import { computeShowAds, DAY_MS } from "./ad-status";

const start = Date.UTC(2026, 9, 1);
const profile = { trial_start_date: new Date(start).toISOString(), is_premium: false };

describe("ad-free trial and subscription", () => {
  test("trial is ad-free for strictly less than 30 days", () => {
    expect(computeShowAds(profile, start + 30 * DAY_MS - 1)).toEqual({
      show_ads: false, reason: "trial", trialDaysLeft: 1,
    });
  });
  test("non-premium users see ads at the 30-day boundary", () => {
    expect(computeShowAds(profile, start + 30 * DAY_MS)).toEqual({
      show_ads: true, reason: "free_with_ads", trialDaysLeft: 0,
    });
  });
  test("premium users stay ad-free after trial expiry", () => {
    expect(computeShowAds({ ...profile, is_premium: true }, start + 31 * DAY_MS).show_ads).toBe(false);
  });
  test("countdown changes only at the next trial-day boundary", () => {
    expect(computeShowAds(profile, start + 24 * DAY_MS).trialDaysLeft).toBe(6);
    expect(computeShowAds(profile, start + 25 * DAY_MS).trialDaysLeft).toBe(5);
  });
});