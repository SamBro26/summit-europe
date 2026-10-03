import { useAdStatus } from "@/hooks/useAdStatus";
import { useT } from "@/lib/i18n";

/** Top banner ad slot — renders nothing for trial/premium users. */
export function GoogleBannerAd() {
  const { show_ads } = useAdStatus();
  const t = useT();
  if (!show_ads) return null;
  return (
    <div aria-label={t("common.advertisement")} className="mx-auto w-full max-w-5xl px-4 py-2">
      <div className="bg-secondary/60 flex h-[50px] w-full items-center justify-center rounded-lg border border-dashed border-border sm:h-[90px]">
        <span className="text-[11px] tracking-widest text-muted-foreground uppercase">
          {t("common.advertisement")}
        </span>
      </div>
    </div>
  );
}
