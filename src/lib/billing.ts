/** Price lookup keys for each Premium tier (same in test and live). */
export const TIER_PRICE_IDS = {
  monthly: "premium_monthly",
  quarterly: "premium_quarterly",
  annual: "premium_annual",
} as const;

export type TierId = keyof typeof TIER_PRICE_IDS;

/** Quarterly is billed every 3 months at €4.99; built inline on the Premium product. */
export const QUARTERLY = { unitAmount: 499, currency: "eur", interval: "month" as const, intervalCount: 3 };

/**
 * Whether a subscription keeps the user ad-free.
 * - active / trialing: yes
 * - past_due: yes (grace period while payment retries run)
 * - canceled: only until the paid period ends
 * - anything else (unpaid, incomplete, ...): no
 */
export function isPremiumSubscription(status: string, periodEnd: string | null, now = Date.now()): boolean {
  const end = periodEnd ? Date.parse(periodEnd) : null;
  const notExpired = end === null || end > now;
  if (status === "active" || status === "trialing" || status === "past_due") return notExpired;
  if (status === "canceled") return end !== null && end > now;
  return false;
}
