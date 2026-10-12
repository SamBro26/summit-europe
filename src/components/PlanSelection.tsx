import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Crown, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdStatus } from "@/hooks/useAdStatus";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export const PLAN_TIERS = [
  { id: "monthly", label: "plan.monthly", price: 1.99, period: "plan.perMonth" },
  { id: "quarterly", label: "plan.quarterly", price: 4.99, period: "plan.per3Months" },
  { id: "annual", label: "plan.annual", price: 17.99, period: "plan.perYear" },
] as const;

export function PlanSelection({ expired, onDone }: { expired?: boolean; onDone?: () => void }) {
  const t = useT();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tier, setTier] = useState<(typeof PLAN_TIERS)[number]["id"]>("monthly");
  const status = useAdStatus();

  const freePlan = useMutation({
    mutationFn: async () => {
      if (status.reason === "trial") return;
      if (!user) throw new Error("Authentication required");
      const { error } = await supabase.rpc("choose_free_plan" as never);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success(t("plan.freeChosen"));
      await queryClient.invalidateQueries({ queryKey: ["ad-status", user?.id] });
      onDone?.();
    },
    onError: () => toast.error(t("common.actionFailed")),
  });

  return (
    <div className="w-full">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
          {expired ? t("plan.expiredTitle") : t("plan.chooseTitle")}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("plan.subtitle")}</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
          <Megaphone className="h-6 w-6 text-muted-foreground" />
          <h3 className="mt-3 font-semibold text-foreground">{t("plan.freeName")}</h3>
          <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{t("plan.freeDesc")}</p>
          <Button variant="outline" className="mt-5 whitespace-normal" disabled={freePlan.isPending || status.reason === "loading"} onClick={() => freePlan.mutate()}>
            {t("plan.freeCta")}
          </Button>
        </div>
        <div className="flex flex-col rounded-2xl border-2 border-primary bg-card p-5">
          <Crown className="h-6 w-6 text-primary-ink" />
          <h3 className="mt-3 font-semibold text-foreground">{t("plan.premiumName")}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("plan.premiumDesc")}</p>
          <div role="radiogroup" className="mt-4 space-y-2">
            {PLAN_TIERS.map((p) => (
               <Button
                 variant="outline"
                key={p.id}
                type="button"
                role="radio"
                aria-checked={tier === p.id}
                onClick={() => setTier(p.id)}
                className={cn(
                   "flex h-auto min-h-14 w-full flex-wrap items-center justify-between gap-x-3 gap-y-1 whitespace-normal rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                  tier === p.id ? "border-accent bg-accent/10 hover:bg-accent/20 hover:text-foreground" : "border-border hover:bg-secondary/50",
                )}
              >
                 <span className="flex min-w-0 flex-[1_1_auto] items-center gap-2 break-words font-medium text-foreground">
                   <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border", tier === p.id ? "border-accent bg-accent text-accent-foreground" : "border-border")}>
                    {tier === p.id && <Check className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0">{t(p.label)}</span>
                </span>
                 <span className="ml-auto min-w-0 text-right text-muted-foreground">
                  <span className="whitespace-nowrap font-semibold text-foreground">€{p.price.toFixed(2)}</span> / {t(p.period)}
                </span>
               </Button>
            ))}
          </div>
          <Button className="mt-5 whitespace-normal" onClick={() => toast.info(t("plan.paymentsSoon"))}>
            {t("plan.subscribeCta")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Blocking overlay shown when the trial is over and no plan was chosen yet. */
export function PlanGate() {
  const t = useT();
  const status = useAdStatus();
  const open = status.reason === "free_with_ads" && status.subscription_status === "trial";
  return (
    <Dialog open={open}>
      <DialogContent
        className="plan-dialog [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{t("plan.expiredTitle")}</DialogTitle>
        <DialogDescription className="sr-only">{t("plan.subtitle")}</DialogDescription>
        <PlanSelection expired />
      </DialogContent>
    </Dialog>
  );
}

/** Mounted once globally, not once per countdown banner or page. */
export function TrialWarning() {
  const t = useT();
  const status = useAdStatus();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const sent = useRef<string | null>(null);
  const inTrial = status.reason === "trial";
  const days = status.trialDaysLeft;

  useEffect(() => {
    if (!inTrial || days > 5 || sent.current === user?.id || !user) return;
    sent.current = user.id;
    supabase
      .rpc("ensure_trial_warning" as never, { _title: t("plan.warnTitle"), _body: t("plan.warnBody") } as never)
      .then(({ error }) => {
        if (!error) queryClient.invalidateQueries({ queryKey: ["unread", user.id] });
      });
  }, [inTrial, days, user, t, queryClient]);
  return null;
}

export function TrialBanner({ onChoose, className }: { onChoose?: () => void; className?: string }) {
  const t = useT();
  const status = useAdStatus();
  const days = status.trialDaysLeft;
  if (status.reason !== "trial") return null;
  return (
    <div className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-border bg-secondary/60 px-4 py-2.5 text-sm", days <= 5 && "border-primary", className)}>
      <div className="flex min-w-0 items-center gap-2">
        <Clock className="h-4 w-4 shrink-0 text-primary-ink" />
        <span className="min-w-0 text-foreground">{t("plan.trialBanner").replace("{n}", String(days))}</span>
      </div>
      {onChoose && (
        <Button type="button" variant="link" onClick={onChoose} className="h-auto max-w-28 shrink-0 whitespace-normal p-0 text-right font-medium text-primary-ink">
          {t("plan.manage")}
        </Button>
      )}
    </div>
  );
}
