import { describe, expect, it } from "vitest";
import { isPremiumSubscription, QUARTERLY } from "./billing";

const now = Date.parse("2026-10-12T00:00:00Z");
const future = "2026-11-12T00:00:00Z";
const past = "2026-10-01T00:00:00Z";

describe("isPremiumSubscription", () => {
  it("active subscription is ad-free", () => expect(isPremiumSubscription("active", future, now)).toBe(true));
  it("cancelled keeps ad-free until period end", () => expect(isPremiumSubscription("canceled", future, now)).toBe(true));
  it("cancelled after period end shows ads", () => expect(isPremiumSubscription("canceled", past, now)).toBe(false));
  it("failed payment keeps grace period", () => expect(isPremiumSubscription("past_due", future, now)).toBe(true));
  it("unpaid after retries shows ads", () => expect(isPremiumSubscription("unpaid", future, now)).toBe(false));
});

it("quarterly costs €4.99 every 3 months", () => {
  expect(QUARTERLY.unitAmount).toBe(499);
  expect(QUARTERLY.intervalCount).toBe(3);
});
