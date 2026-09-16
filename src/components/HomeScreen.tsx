import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Globe,
  Home,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AdBanner, AD_BANNER_SPACING } from "@/components/AdBanner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LocationFilter, type LocationValue } from "@/components/LocationFilter";
import { ListingCard } from "@/components/ListingCard";
import { fetchListings } from "@/lib/listings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getCountry } from "@/lib/locations";
import { getLanguage } from "@/lib/languages";

export function HomeScreen({
  languageCode,
  onChangeLanguage,
}: {
  languageCode: string | null;
  onChangeLanguage: () => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [location, setLocation] = useState<LocationValue>({
    country: null,
    region: null,
    city: null,
  });
  const [applied, setApplied] = useState<LocationValue>({
    country: null,
    region: null,
    city: null,
  });
  const language = getLanguage(languageCode);
  const country = location.country ? getCountry(location.country) : undefined;

  const scope = [country?.name, location.region, location.city].filter(Boolean).join(" › ");

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className={cn("min-h-screen bg-background", AD_BANNER_SPACING)}>
      <header className="bg-brand-gradient px-5 pt-8 pb-14 sm:px-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/10">
              <Home className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={1.6} />
            </span>
            <span className="font-display text-lg font-semibold text-primary-foreground">
              FindMe <span className="text-accent">RealEstate</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onChangeLanguage}
              className="gap-1.5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{language.native}</span>
              <span className="sm:hidden">{language.flag}</span>
            </Button>
            {user ? (
              <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-1.5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/inbox">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Inbox</span>
                </Link>
              </Button>
              {isAdmin && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Link to="/admin">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="gap-1.5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
              </>
            ) : (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-5xl">
          <h1 className="text-2xl font-semibold text-primary-foreground sm:text-4xl">
            Property across the Eurozone, in one place.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-primary-foreground/75">
            Start with a country — regions and cities unlock as you go.
          </p>
          <Button asChild className="mt-6 gap-2">
            <Link to="/post">
              <Plus className="h-4 w-4" /> Post a free ad
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto -mt-8 w-full max-w-5xl px-5 sm:px-10">
        <section className="shadow-soft rounded-2xl border border-border bg-card p-5 sm:p-6">
          <LocationFilter value={location} onChange={setLocation} />
          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {scope ? (
                <>
                  Searching in <span className="font-medium text-foreground">{scope}</span>
                </>
              ) : (
                "Select a country to begin — it is required."
              )}
            </p>
            <Button disabled={!location.country} onClick={() => setApplied(location)} className="gap-2">
              <Search className="h-4 w-4" /> Search
            </Button>
          </div>
        </section>

        <Tabs defaultValue="offers" className="mt-8">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
            <TabsTrigger value="offers">Offered Properties</TabsTrigger>
            <TabsTrigger value="requests">Search Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="offers" className="mt-5">
            <ListingGrid kind="supply" filter={applied} />
          </TabsContent>

          <TabsContent value="requests" className="mt-5">
            <ListingGrid kind="demand" filter={applied} />
          </TabsContent>
        </Tabs>
      </main>

      <AdBanner />
    </div>
  );
}

function ListingGrid({
  kind,
  filter,
}: {
  kind: "supply" | "demand";
  filter: LocationValue;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["listings", kind, filter.country, filter.region, filter.city],
    queryFn: () =>
      fetchListings({
        kind,
        country: filter.country,
        region: filter.region,
        city: filter.city,
      }),
  });

  if (isLoading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading ads…</p>;
  }

  if (!data?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent/25">
          <Sparkles className="h-5 w-5 text-accent-foreground" />
        </span>
        <h2 className="mt-4 text-base font-semibold text-foreground">
          {kind === "supply" ? "No properties listed yet" : "No search requests yet"}
        </h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          Be the first to post — it is completely free.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
