import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

export function StarRating({
  value,
  onRate,
  size = "md",
}: {
  value: number;
  onRate?: (stars: number) => void;
  size?: "sm" | "md";
}) {
  const t = useT();
  const px = size === "sm" ? "h-3.5 w-3.5" : "h-6 w-6";
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onRate}
          aria-label={t("listing.rateStars").replace("{count}", String(n))}
          onClick={() => onRate?.(n)}
          className={cn("transition-transform", onRate && "hover:scale-110")}
        >
          <Star
            className={cn(
              px,
              n <= Math.round(value)
                ? "fill-accent text-primary-ink"
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}
