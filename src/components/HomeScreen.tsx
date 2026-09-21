import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
                className="relative gap-1.5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/inbox">
                  <span className="relative">
                    <MessageSquare className="h-4 w-4" />
                    {unread > 0 && (
                      <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                        {unread > 99 ? "99+" : unread}
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
                <Link to="/account">
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
                  <Link to="/admin">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("common.admin")}</span>
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
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-5xl">
          <h1 className="text-2xl font-semibold text-primary-foreground sm:text-4xl">
            {t("home.headline")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-primary-foreground/75">{t("home.sub")}</p>
          <Button asChild className="mt-6 gap-2">
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
            <TabsList className="mt-4 grid w-full grid-cols-2 sm:inline-grid sm:w-auto">
              <TabsTrigger value="offers">{t("home.tabs.offers")}</TabsTrigger>
              <TabsTrigger value="requests">{t("home.tabs.requests")}</TabsTrigger>
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
            <div className="mt-5 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                {scope ? (
                  <>
                    {t("home.searchingIn")}{" "}
                    <span className="font-medium text-foreground">{scope}</span>
                  </>
                ) : (
                  t("home.selectCountryFirst")
                )}
              </p>
            </div>
          </section>

          <TabsContent value="offers" className="mt-6">
            <ListingGrid kind="supply" filter={location} transaction={transaction} />
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
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
  const { data, isLoading } = useQuery({
    queryKey: ["listings", kind, filter.country, filter.region, filter.city, transaction],
    queryFn: () =>
      fetchListings({
        kind,
        country: filter.country,
        region: filter.region,
        city: filter.city,
        transaction,
      }),
  });

  if (isLoading) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">{t("home.loadingAds")}</p>
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
