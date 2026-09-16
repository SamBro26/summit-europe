import { useState } from "react";
import { Globe, Home, Search, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LocationFilter, type LocationValue } from "@/components/LocationFilter";
import { getCountry } from "@/lib/locations";
import { getLanguage } from "@/lib/languages";

export function HomeScreen({
  languageCode,
  onChangeLanguage,
}: {
  languageCode: string | null;
  onChangeLanguage: () => void;
}) {
  const [location, setLocation] = useState<LocationValue>({
    country: null,
    region: null,
    city: null,
  });
  const language = getLanguage(languageCode);
  const country = location.country ? getCountry(location.country) : undefined;

  const scope = [country?.name, location.region, location.city].filter(Boolean).join(" › ");

  return (
    <div className="min-h-screen bg-background pb-16">
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
        </div>

        <div className="mx-auto mt-10 max-w-5xl">
          <h1 className="text-2xl font-semibold text-primary-foreground sm:text-4xl">
            Property across the Eurozone, in one place.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-primary-foreground/75">
            Start with a country — regions and cities unlock as you go.
          </p>
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
            <Button disabled={!location.country} className="gap-2">
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
            <MarketPanel
              title="Offered Properties"
              body={
                location.country
                  ? `Listings for ${scope} will appear here once the listing wizard is live.`
                  : "Pick a country above to load available supply in that market."
              }
            />
          </TabsContent>

          <TabsContent value="requests" className="mt-5">
            <MarketPanel
              title="Search Requests"
              body={
                location.country
                  ? `Buyer and tenant requests for ${scope} will appear here.`
                  : "Pick a country above to see what buyers and tenants are looking for."
              }
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function MarketPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent/25">
        <Sparkles className="h-5 w-5 text-accent-foreground" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
