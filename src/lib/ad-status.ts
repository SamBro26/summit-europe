export const TRIAL_DAYS = 30;
export const DAY_MS = 24 * 60 * 60 * 1000;

export type AdStatusReason = "loading" | "guest" | "trial" | "premium" | "free_with_ads";
export type TrialProfile = { trial_start_date: string; is_premium: boolean };

export function computeShowAds(
  profile: TrialProfile | null,
  now = Date.now(),
): { show_ads: boolean; reason: AdStatusReason; trialDaysLeft: number } {
  if (!profile) return { show_ads: true, reason: "guest", trialDaysLeft: 0 };
  if (profile.is_premium) return { show_ads: false, reason: "premium", trialDaysLeft: 0 };
  const remaining = new Date(profile.trial_start_date).getTime() + TRIAL_DAYS * DAY_MS - now;
  if (remaining > 0) {
    return { show_ads: false, reason: "trial", trialDaysLeft: Math.ceil(remaining / DAY_MS) };
  }
  return { show_ads: true, reason: "free_with_ads", trialDaysLeft: 0 };
}