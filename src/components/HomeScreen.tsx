import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Globe,
  Home,
  LogOut,
  MessageSquare,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { AdBanner, AD_BANNER_SPACING } from "@/components/AdBanner";
import { GoogleBannerAd } from "@/components/GoogleBannerAd";
import { TrialBanner } from "@/components/PlanSelection";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LocationFilter, type LocationValue } from "@/components/LocationFilter";
import { ListingCard } from "@/components/ListingCard";
import { fetchListings } from "@/lib/listings";
import { useAuth } from "@/hooks/useAuth";
import { useAdStatus } from "@/hooks/useAdStatus";
import { supabase } from "@/integrations/supabase/client";
import { useLocationNames } from "@/lib/locations";
import { getLanguage } from "@/lib/languages";
import { useT } from "@/lib/i18n";

export function HomeScreen({
  languageCode,
  onChangeLanguage,
}: {
  languageCode: string | null;
  onChangeLanguage: () => void;
}) {
  const navigate = useNavigate();
  const t = useT();
  const { user } = useAuth();
  const { show_ads } = useAdStatus();
  const { isAdmin } = useIsAdmin();
  const { count: unread } = useUnreadCount();
  const [location, setLocation] = useState<LocationValue>({
    country: null,
    region: null,
    city: null,
  });
  const [tab, setTab] = useState<"supply" | "demand">("supply");
  const [transaction, setTransaction] = useState<"sale" | "rent" | null>(null);
  const language = getLanguage(languageCode);
  const loc = useLocationNames();

  const scope = [
    loc.countryName(location.country),
    loc.regionName(location.country, location.region),
  ]
    .filter(Boolean)
    .join(" › ");

  // Same stored value: shown as "For Sale" on the offers tab, "For Purchase" on the requests tab.
  const transactionOptions =
    tab === "supply"
      ? [
          { value: "sale", label: t("tx.sale") },
          { value: "rent", label: t("tx.rent") },
        ]
      : [
          { value: "sale", label: t("tx.purchase") },
          { value: "rent", label: t("tx.rent") },
        ];

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className={cn("min-h-screen bg-background", show_ads && AD_BANNER_SPACING)}>
      <GoogleBannerAd />
      <div className="mx-auto w-full max-w-5xl px-5 sm:px-10">
        <TrialBanner className="my-3" onChoose={() => navigate({ to: "/account" })} />
      </div>
      <header className="bg-brand-gradient px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-14 sm:px-10">
        <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="col-span-2 flex min-w-0 items-center gap-2.5 sm:col-span-1">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10">
              <Home className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={1.6} />
            </span>
            <span className="min-w-0 truncate font-display text-lg font-semibold text-primary-foreground">
              FindMe <span className="text-accent">RealEstate</span>
            </span>
          </div>
          <nav aria-label={t("common.home")} className="col-span-2 flex min-w-0 items-center gap-1 [&>button]:shrink-0 [&>a]:shrink-0 sm:col-span-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onChangeLanguage}
              aria-label={language.native}
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
                className="relative gap-1.5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                 <Link to="/inbox" aria-label={t("common.inbox")}>
                  <span className="relative">
                    <MessageSquare className="h-4 w-4" />
                    {unread > 0 && (
                      <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4">
                        <span className="absolute inset-0 animate-ping rounded-full bg-destructive opacity-60 motion-reduce:hidden" />
                        <span className="relative flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground ring-2 ring-primary">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      </span>
                    )}
                  </span>
                  <span className="hidden sm:inline">{t("common.inbox")}</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-1.5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                 <Link to="/account" aria-label={t("common.account")}>
                  <UserRound className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("common.account")}</span>
                </Link>
              </Button>
              {isAdmin && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                   <Link to="/admin" aria-label={t("common.admin")}>
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("common.admin")}</span>
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                aria-label={t("common.signOut")}
                className="gap-1.5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("common.signOut")}</span>
              </Button>
              </>
            ) : (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/auth">{t("common.signIn")}</Link>
              </Button>
            )}
          </nav>
        </div>

        <div className="mx-auto mt-10 max-w-5xl">
          <h1 className="text-2xl font-semibold text-primary-foreground sm:text-4xl">
            {t("home.headline")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-primary-foreground/75">{t("home.sub")}</p>
          <Button asChild className="mt-6 gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/post">
              <Plus className="h-4 w-4" /> {t("home.post")}
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto -mt-8 w-full max-w-5xl px-5 sm:px-10">
        <Tabs
          value={tab}
          onValueChange={(next) => setTab(next as "supply" | "demand")}
        >
          <section className="shadow-soft rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-foreground uppercase">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              {t("filter.title")}
            </h2>
            <TabsList className="mt-4 flex h-auto w-full gap-2 bg-transparent p-0 sm:w-auto">
              <TabsTrigger className="h-10 flex-1 flex-grow rounded-md border border-border bg-background px-3 data-[state=active]:border-accent data-[state=active]:bg-accent data-[state=active]:text-accent-foreground sm:flex-none" value="supply">{t("home.tabs.offers")}</TabsTrigger>
              <TabsTrigger className="h-10 flex-1 flex-grow rounded-md border border-border bg-background px-3 data-[state=active]:border-accent data-[state=active]:bg-accent data-[state=active]:text-accent-foreground sm:flex-none" value="demand">{t("home.tabs.requests")}</TabsTrigger>
            </TabsList>
            <div className="mt-5">
              <LocationFilter value={location} onChange={setLocation} />
            </div>
            <div className="mt-5 space-y-1.5">
              <Label className="text-xs tracking-wide text-muted-foreground uppercase">
                {t("filter.transaction")}
              </Label>
              <Select
                key={`transaction-${tab}-${language ?? "en"}`}
                {...(transaction ? { value: transaction } : {})}
                onValueChange={(next) => setTransaction(next as "sale" | "rent")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("filter.selectTransaction")} />
                </SelectTrigger>
                <SelectContent>
                  {transactionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {scope && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  {t("home.searchingIn")}{" "}
                  <span className="font-medium text-foreground">{scope}</span>
                </p>
              </div>
            )}
          </section>

          <TabsContent value="supply" className="mt-6">
            <ListingGrid kind="supply" filter={location} transaction={transaction} />
          </TabsContent>

          <TabsContent value="demand" className="mt-6">
            <ListingGrid kind="demand" filter={location} transaction={transaction} />
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
  transaction,
}: {
  kind: "supply" | "demand";
  filter: LocationValue;
  transaction: "sale" | "rent" | null;
}) {
  const t = useT();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["listings", kind, filter.country, filter.region, filter.city, transaction],
    queryFn: ({ signal }) =>
      fetchListings({
        kind,
        country: filter.country,
        region: filter.region,
        city: filter.city,
        transaction,
        signal,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  if (isLoading) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">{t("home.loadingAds")}</p>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="py-10 text-center">
        <p className="text-sm text-muted-foreground">{t("errors.loadBody")}</p>
        <Button variant="outline" className="mt-3" onClick={() => refetch()}>{t("errors.tryAgain")}</Button>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent/25">
          <Sparkles className="h-5 w-5 text-accent-foreground" />
        </span>
        <h2 className="mt-4 text-base font-semibold text-foreground">
          {kind === "supply" ? t("home.emptyOffers") : t("home.emptyRequests")}
        </h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
          {t("home.emptyHint")}
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
