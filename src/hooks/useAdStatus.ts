import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

import { computeShowAds, DAY_MS, TRIAL_DAYS, type AdStatusReason } from "@/lib/ad-status";
export { computeShowAds, TRIAL_DAYS } from "@/lib/ad-status";
export type { AdStatusReason } from "@/lib/ad-status";

type AdStatus = ReturnType<typeof computeShowAds> & { subscription_status?: string | null };
const AdStatusContext = createContext<AdStatus | null>(null);

/** Whether ads should be shown to the current visitor. */
export function AdStatusProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const userId = user?.id;
  const [now, setNow] = useState(0);
  const { data, isLoading } = useQuery({
    queryKey: ["ad-status", userId],
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    queryFn: async ({ signal }) => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("trial_start_date, is_premium, subscription_status")
        .eq("id", userId)
        .abortSignal(signal)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => { setNow(Date.now()); }, [userId]);

  // Wake only when the displayed day count changes, not on scroll or every render.
  useEffect(() => {
    if (!data || data.is_premium || !now) return;
    const remaining = Date.parse(data.trial_start_date) + TRIAL_DAYS * DAY_MS - now;
    if (!Number.isFinite(remaining) || remaining <= 0) return;
    const delay = remaining - (Math.ceil(remaining / DAY_MS) - 1) * DAY_MS;
    const timer = setTimeout(() => setNow(Date.now()), delay + 20);
    return () => clearTimeout(timer);
  }, [data, now]);

  const value = useMemo<AdStatus>(() => {
    // Profile errors never gate the feed or misclassify a signed-in trial as a guest.
    if (loading || (userId && (isLoading || !data || !now))) {
      return { show_ads: false, reason: "loading" as AdStatusReason, trialDaysLeft: 0 };
    }
    return { ...computeShowAds(userId ? (data ?? null) : null, now), subscription_status: data?.subscription_status ?? null };
  }, [loading, userId, isLoading, data, now]);
  return createElement(AdStatusContext.Provider, { value }, children);
}

export function useAdStatus() {
  const status = useContext(AdStatusContext);
  if (!status) throw new Error("useAdStatus must be used inside <AdStatusProvider>");
  return status;
}
