import { Link } from "@tanstack/react-router";
import { ImageOff, MapPin } from "lucide-react";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";
import { formatEuro } from "@/lib/property";
import { getCountry } from "@/lib/locations";
import type { ListingWithPhotos } from "@/lib/listings";
import { Badge } from "@/components/ui/badge";
import { useT, type TranslationKey } from "@/lib/i18n";

export function ListingCard({ listing }: { listing: ListingWithPhotos }) {
  const t = useT();
  const photos = [...(listing.listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const first = photos[0]?.storage_path ?? null;
  const urls = usePhotoUrls([first]);
  const cover = first ? urls[first] : undefined;
  const country = getCountry(listing.country_code);
  const price = formatEuro(listing.price_eur);
  const typeLabel = t(`prop.${listing.property_type}` as TranslationKey);
  const txLabel = t(`tx.${listing.transaction_type}` as TranslationKey);

  return (
    <Link
      to="/listings/$id"
      params={{ id: listing.id }}
      className="shadow-soft group block overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="bg-secondary/60 aspect-[4/3] w-full overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={`${typeLabel} — ${listing.city}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{typeLabel}</Badge>
          <Badge variant="outline">{txLabel}</Badge>
        </div>
        <p className="text-base font-semibold text-foreground">
          {price ?? t("listing.priceOnRequest")}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {[listing.city, listing.region, country?.name].filter(Boolean).join(", ")}
        </p>
        {listing.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{listing.description}</p>
        )}
      </div>
    </Link>
  );
}
