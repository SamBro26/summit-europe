import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, Heart, ImageOff, MapPin, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";
import { fetchListing } from "@/lib/listings";
import { formatEuro } from "@/lib/property";
import { useLocationNames } from "@/lib/locations";
import { StarRating } from "@/components/StarRating";
import { ContactActions } from "@/components/ContactActions";
import { ChatPanel } from "@/components/ChatPanel";
import { AdBanner, AD_BANNER_SPACING } from "@/components/AdBanner";
import { ReportListingDialog } from "@/components/ReportListingDialog";
import { AdminListingActions } from "@/components/AdminListingActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT, type TranslationKey } from "@/lib/i18n";

export const Route = createFileRoute("/listings/$id")({
  head: () => ({
    meta: [
      { title: "Property listing — FindMe RealEstate" },
      {
        name: "description",
        content: "View full property details, photos and contact the advertiser directly for free.",
      },
      { property: "og:title", content: "Property listing — FindMe RealEstate" },
      {
        property: "og:description",
        content: "View full property details, photos and contact the advertiser directly for free.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ListingDetails,
});

function ListingDetails() {
  const t = useT();
  const { id } = useParams({ from: "/listings/$id" });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [chatOpen, setChatOpen] = useState(false);
  const [active, setActive] = useState(0);
  const loc = useLocationNames();

  const listingQuery = useQuery({ queryKey: ["listing", id], queryFn: () => fetchListing(id) });
  const listing = listingQuery.data;

  const photos = [...(listing?.listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const urls = usePhotoUrls(photos.map((p) => p.storage_path));

  const likesQuery = useQuery({
    queryKey: ["likes", id],
    queryFn: async () => {
      const { data } = await supabase.from("listing_likes").select("user_id").eq("listing_id", id);
      return data ?? [];
    },
  });
  const ratingsQuery = useQuery({
    queryKey: ["ratings", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("listing_ratings")
        .select("user_id, stars")
        .eq("listing_id", id);
      return data ?? [];
    },
  });

  const likes = likesQuery.data ?? [];
  const ratings = ratingsQuery.data ?? [];
  const liked = Boolean(user && likes.some((l) => l.user_id === user.id));
  const myRating = ratings.find((r) => user && r.user_id === user.id)?.stars ?? 0;
  const average = ratings.length
    ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
    : 0;

  useEffect(() => setActive(0), [id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `findme.viewed.${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase
      .rpc("increment_listing_views", { _listing_id: id })
      .then(() => queryClient.invalidateQueries({ queryKey: ["listing", id] }));
  }, [id, queryClient]);

  async function toggleLike() {
    if (!user) {
      toast.error(t("listing.signInLike"));
      return;
    }
    if (liked) {
      await supabase.from("listing_likes").delete().eq("listing_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("listing_likes").insert({ listing_id: id, user_id: user.id });
    }
    queryClient.invalidateQueries({ queryKey: ["likes", id] });
  }

  async function rate(stars: number) {
    if (!user) {
      toast.error(t("listing.signInRate"));
      return;
    }
    await supabase
      .from("listing_ratings")
      .upsert({ listing_id: id, user_id: user.id, stars }, { onConflict: "listing_id,user_id" });
    queryClient.invalidateQueries({ queryKey: ["ratings", id] });
  }

  if (listingQuery.isLoading) {
    return (
      <p className="p-10 text-center text-sm text-muted-foreground">{t("listing.loading")}</p>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5">
        <h1 className="text-xl font-semibold">{t("listing.unavailable")}</h1>
        <Button asChild>
          <Link to="/">{t("listing.backHome")}</Link>
        </Button>
      </div>
    );
  }

  const isAuthor = user?.id === listing.author_id;
  const cover = photos[active]?.storage_path;

  return (
    <div className={cn("min-h-screen bg-background", AD_BANNER_SPACING)}>
      <header className="bg-brand-gradient px-5 pt-6 pb-16 sm:px-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {t("common.back")}
          </Link>
          {isAuthor && (
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/listings/$id/edit" params={{ id }}>
                <Pencil className="h-4 w-4" /> {t("listing.edit")}
              </Link>
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto -mt-10 w-full max-w-4xl space-y-5 px-5 sm:px-10">
        <section className="shadow-soft overflow-hidden rounded-2xl border border-border bg-card">
          <div className="bg-secondary/60 aspect-[16/10] w-full">
            {cover && urls[cover] ? (
              <img
                src={urls[cover]}
                alt={`${t(`prop.${listing.property_type}` as TranslationKey)} — ${listing.city}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageOff className="h-8 w-8" />
              </div>
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setActive(i)}
                  className={cn(
                    "h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2",
                    i === active ? "border-primary" : "border-transparent",
                  )}
                >
                  {p.storage_path && urls[p.storage_path] && (
                    <img src={urls[p.storage_path]} alt="" className="h-full w-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="shadow-soft space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">
              {t(`prop.${listing.property_type}` as TranslationKey)}
            </Badge>
            <Badge variant="outline">
              {t(`tx.${listing.transaction_type}` as TranslationKey)}
            </Badge>
            <Badge>{listing.kind === "supply" ? t("listing.offered") : t("listing.wanted")}</Badge>
          </div>
          <h1 className="text-2xl font-semibold">
            {formatEuro(listing.price_eur) ?? t("listing.priceOnRequest")}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {[
              loc.cityName(listing.country_code, listing.region, listing.city),
              loc.regionName(listing.country_code, listing.region),
              loc.countryName(listing.country_code),
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            {listing.views_count ?? 0} {t("listing.views")}
          </p>
          {listing.description && (
            <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">
              {listing.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 border-t border-border pt-4">
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                {t("listing.rating")}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <StarRating value={myRating || average} onRate={rate} />
                <span className="text-sm text-muted-foreground">
                  {ratings.length
                    ? `${average.toFixed(1)} (${ratings.length})`
                    : t("listing.noRatings")}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                {t("listing.likes")}
              </p>
              <Button
                variant={liked ? "default" : "outline"}
                size="sm"
                onClick={toggleLike}
                className="mt-1.5 gap-2"
              >
                <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                {likes.length}
              </Button>
            </div>
          </div>
        </section>

        <section className="shadow-soft space-y-3 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div>
            <h2 className="text-base font-semibold">{t("listing.contactTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("listing.contactSub")}</p>
          </div>
          <ContactActions
            phone={listing.phone}
            onMessage={() => {
              if (!user) {
                toast.error(t("listing.signInMessage"));
                return;
              }
              if (isAuthor) {
                toast.info(t("listing.ownAd"));
                return;
              }
              setChatOpen(true);
            }}
          />
          {!listing.phone && (
            <p className="text-xs text-muted-foreground">
              {t("listing.noPhone")}
            </p>
          )}
        </section>

        <section className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <ReportListingDialog listingId={id} />
          <AdminListingActions listingId={id} authorId={listing.author_id} />
        </section>
      </main>

      {chatOpen && user && (
        <ChatPanel
          listingId={id}
          meId={user.id}
          otherId={listing.author_id}
          onClose={() => setChatOpen(false)}
        />
      )}

      <AdBanner />
    </div>
  );
}
