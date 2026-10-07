import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  const [busy, setBusy] = useState(false);
  const status = useAdStatus();

  async function chooseFree() {
    setBusy(true);
    if (status.reason === "trial") {
      // Still in trial: nothing to change yet, ads start automatically when it ends.
      toast.success(t("plan.freeChosen"));
    } else {
      const { error } = await supabase.rpc("choose_free_plan" as never);
      if (error) {
        setBusy(false);
        toast.error(t("common.actionFailed"));
        return;
      }
      toast.success(t("plan.freeChosen"));
      await queryClient.invalidateQueries({ queryKey: ["ad-status", user?.id] });
    }
    setBusy(false);
    onDone?.();
  }

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
          <Button variant="outline" className="mt-5" disabled={busy} onClick={chooseFree}>
            {t("plan.freeCta")}
          </Button>
        </div>
        <div className="flex flex-col rounded-2xl border-2 border-primary bg-card p-5">
          <Crown className="h-6 w-6 text-primary" />
          <h3 className="mt-3 font-semibold text-foreground">{t("plan.premiumName")}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("plan.premiumDesc")}</p>
          <div role="radiogroup" className="mt-4 space-y-2">
            {PLAN_TIERS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={tier === p.id}
                onClick={() => setTier(p.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                  tier === p.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/50",
                )}
              >
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <span className={cn("flex h-4 w-4 items-center justify-center rounded-full border", tier === p.id ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                    {tier === p.id && <Check className="h-3 w-3" />}
                  </span>
                  {t(p.label)}
                </span>
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">€{p.price.toFixed(2)}</span> / {t(p.period)}
                </span>
              </button>
            ))}
          </div>
          <Button className="mt-5" onClick={() => toast.info(t("plan.paymentsSoon"))}>
            {t("plan.subscribeCta")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Blocking overlay shown when the trial is over and no plan was chosen yet. */
export function PlanGate() {
  const status = useAdStatus();
  const [closed, setClosed] = useState(false);
  const open = status.reason === "free_with_ads" && status.subscription_status === "trial" && !closed;
  return (
    <Dialog open={open}>
      <DialogContent
        className="max-h-[90vh] max-w-3xl overflow-y-auto [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Plan</DialogTitle>
        <DialogDescription className="sr-only">Plan</DialogDescription>
        <PlanSelection expired onDone={() => setClosed(true)} />
      </DialogContent>
    </Dialog>
  );
}

/** Countdown banner during the trial; also posts the one-time 5-day warning. */
export function TrialBanner({ onChoose, className }: { onChoose?: () => void; className?: string }) {
  const t = useT();
  const status = useAdStatus();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const sent = useRef(false);
  const inTrial = status.reason === "trial";
  const days = status.trialDaysLeft;

  useEffect(() => {
    if (!inTrial || days > 5 || sent.current || !user) return;
    sent.current = true;
    supabase
      .rpc("ensure_trial_warning" as never, { _title: t("plan.warnTitle"), _body: t("plan.warnBody") } as never)
      .then(() => queryClient.invalidateQueries({ queryKey: ["unread", user.id] }));
  }, [inTrial, days, user, t, queryClient]);

  if (!inTrial) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-sm", days <= 5 && "border-primary", className)}>
      <Clock className="h-4 w-4 shrink-0 text-primary" />
      <span className="flex-1 text-foreground">{t("plan.trialBanner").replace("{n}", String(days))}</span>
      {onChoose && (
        <button type="button" onClick={onChoose} className="font-medium text-primary hover:underline">
          {t("plan.manage")}
        </button>
      )}
    </div>
  );
}
