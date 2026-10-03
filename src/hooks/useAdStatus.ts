import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const TRIAL_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export type AdStatusReason = "loading" | "guest" | "trial" | "premium" | "free_with_ads";

export function computeShowAds(
  profile: { trial_start_date: string; is_premium: boolean } | null,
  now = Date.now(),
): { show_ads: boolean; reason: AdStatusReason; trialDaysLeft: number } {
  if (!profile) return { show_ads: true, reason: "guest", trialDaysLeft: 0 };
  if (profile.is_premium) return { show_ads: false, reason: "premium", trialDaysLeft: 0 };
  const elapsed = now - new Date(profile.trial_start_date).getTime();
  if (elapsed < TRIAL_DAYS * DAY_MS) {
    return {
      show_ads: false,
      reason: "trial",
      trialDaysLeft: Math.ceil((TRIAL_DAYS * DAY_MS - elapsed) / DAY_MS),
    };
  }
  return { show_ads: true, reason: "free_with_ads", trialDaysLeft: 0 };
}

/** Whether ads should be shown to the current visitor. */
export function useAdStatus() {
  const { user, loading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["ad-status", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("trial_start_date, is_premium, subscription_status")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (loading || (user && isLoading)) {
    return { show_ads: false, reason: "loading" as const, trialDaysLeft: 0 };
  }
  return { ...computeShowAds(user ? (data ?? null) : null), subscription_status: data?.subscription_status };
}
