import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Heart, ImageOff, MapPin, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";
import { fetchListing } from "@/lib/listings";
import { formatEuro, propertyTypeLabel, transactionLabel } from "@/lib/property";
import { getCountry } from "@/lib/locations";
import { StarRating } from "@/components/StarRating";
import { ContactActions } from "@/components/ContactActions";
import { ChatPanel } from "@/components/ChatPanel";
import { AdBanner, AD_BANNER_SPACING } from "@/components/AdBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const { id } = useParams({ from: "/listings/$id" });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [chatOpen, setChatOpen] = useState(false);
  const [active, setActive] = useState(0);

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

  async function toggleLike() {
    if (!user) {
      toast.error("Sign in to like this listing.");
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
      toast.error("Sign in to rate this listing.");
      return;
    }
    await supabase
      .from("listing_ratings")
      .upsert({ listing_id: id, user_id: user.id, stars }, { onConflict: "listing_id,user_id" });
    queryClient.invalidateQueries({ queryKey: ["ratings", id] });
  }

  if (listingQuery.isLoading) {
    return <p className="p-10 text-center text-sm text-muted-foreground">Loading listing…</p>;
  }

  if (!listing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5">
        <h1 className="text-xl font-semibold">This listing is no longer available</h1>
        <Button asChild>
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  const isAuthor = user?.id === listing.author_id;
  const country = getCountry(listing.country_code);
  const cover = photos[active]?.storage_path;

  return (
    <div className={cn("min-h-screen bg-background", AD_BANNER_SPACING)}>
      <header className="bg-brand-gradient px-5 pt-6 pb-16 sm:px-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          {isAuthor && (
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/listings/$id/edit" params={{ id }}>
                <Pencil className="h-4 w-4" /> Edit ad
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
                alt={`${propertyTypeLabel(listing.property_type)} in ${listing.city}`}
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
            <Badge variant="secondary">{propertyTypeLabel(listing.property_type)}</Badge>
            <Badge variant="outline">{transactionLabel(listing.transaction_type)}</Badge>
            <Badge>{listing.kind === "supply" ? "Offered" : "Wanted"}</Badge>
          </div>
          <h1 className="text-2xl font-semibold">
            {formatEuro(listing.price_eur) ?? "Price on request"}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {[listing.city, listing.region, country?.name].filter(Boolean).join(", ")}
          </p>
          {listing.description && (
            <p className="text-sm leading-relaxed whitespace-pre-line text-foreground">
              {listing.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 border-t border-border pt-4">
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Rating</p>
              <div className="mt-1.5 flex items-center gap-2">
                <StarRating value={myRating || average} onRate={rate} />
                <span className="text-sm text-muted-foreground">
                  {ratings.length ? `${average.toFixed(1)} (${ratings.length})` : "No ratings yet"}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">Likes</p>
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
            <h2 className="text-base font-semibold">Contact — always free</h2>
            <p className="text-sm text-muted-foreground">
              Message in the app, call, or reach the advertiser on WhatsApp.
            </p>
          </div>
          <ContactActions
            phone={listing.phone}
            onMessage={() => {
              if (!user) {
                toast.error("Sign in to send a message.");
                return;
              }
              if (isAuthor) {
                toast.info("This is your own ad.");
                return;
              }
              setChatOpen(true);
            }}
          />
          {!listing.phone && (
            <p className="text-xs text-muted-foreground">
              This advertiser has not shared a phone number — use in-app messaging.
            </p>
          )}
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
