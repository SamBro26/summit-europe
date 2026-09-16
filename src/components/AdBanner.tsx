/**
 * Adaptive banner ad slot (AdMob-style).
 *
 * Reserves a fixed-height horizontal container pinned to the bottom of the
 * viewport. Height follows AdMob adaptive banner guidance: 50px on small
 * phones, 90px on tablets/desktop. Pages using it must add matching bottom
 * padding (`pb-[var(--ad-banner-h)]`-style spacing) so nothing is covered.
 */
export function AdBanner({ label = "Advertisement" }: { label?: string }) {
  return (
    <div
      aria-label="Advertisement"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-[50px] w-full max-w-5xl items-center justify-center px-4 sm:h-[90px]">
        <div className="bg-secondary/60 flex h-full w-full max-w-[728px] items-center justify-center rounded-lg border border-dashed border-border">
          <span className="text-[11px] tracking-widest text-muted-foreground uppercase">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Spacer classes for pages that render the banner. */
export const AD_BANNER_SPACING = "pb-[66px] sm:pb-[106px]";
