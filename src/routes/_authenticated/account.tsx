import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, Pencil, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ListingCard } from "@/components/ListingCard";
import { AdBanner, AD_BANNER_SPACING } from "@/components/AdBanner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import type { ListingWithPhotos } from "@/lib/listings";
import { useState } from "react";
import { Crown } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyAccount } from "@/lib/account.functions";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlanSelection, TrialBanner } from "@/components/PlanSelection";
import { useAdStatus } from "@/hooks/useAdStatus";
import { createPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "My account — FindMe RealEstate" },
      {
        name: "description",
        content: "Manage your published property ads and the listings you saved as favorites.",
      },
      { property: "og:title", content: "My account — FindMe RealEstate" },
      {
        property: "og:description",
        content: "Manage your published property ads and the listings you saved as favorites.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountPage,
});

const SELECT = "*, listing_photos(id, url, storage_path, sort_order)";

function AccountPage() {
  const t = useT();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [plansOpen, setPlansOpen] = useState(false);
  const adStatus = useAdStatus();
  const isPaid = adStatus.subscription_status === "active_paid";
  const openPortal = useServerFn(createPortalSession);
  async function manageSubscription() {
    const tab = window.open("", "_blank");
    try {
      const r = await openPortal({ data: { environment: getStripeEnvironment(), returnUrl: window.location.href } });
      if ("error" in r) throw new Error(r.error);
      if (tab) tab.location.href = r.url; else window.location.href = r.url;
    } catch {
      tab?.close();
      toast.error(t("common.actionFailed"));
    }
  }
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const deleteAccountFn = useServerFn(deleteMyAccount);

  async function deleteAccount() {
    setDeleting(true);
    try {
      await deleteAccountFn();
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut({ scope: "local" });
      toast.success(t("delAcc.success"));
      navigate({ to: "/", replace: true });
    } catch {
      toast.error(t("common.actionFailed"));
      setDeleting(false);
    }
  }

  const mine = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(SELECT)
        .eq("author_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ListingWithPhotos[];
    },
  });

  const favorites = useQuery({
    queryKey: ["my-favorites", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: likes } = await supabase
        .from("listing_likes")
        .select("listing_id")
        .eq("user_id", user!.id);
      const ids = (likes ?? []).map((l) => l.listing_id);
      if (!ids.length) return [] as ListingWithPhotos[];
      const { data, error } = await supabase.from("listings").select(SELECT).in("id", ids);
      if (error) throw error;
      return (data ?? []) as unknown as ListingWithPhotos[];
    },
  });

  async function remove(id: string) {
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      toast.error(t("common.actionFailed"));
      return;
    }
    toast.success(t("account.deleted"));
    queryClient.invalidateQueries({ queryKey: ["my-listings", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
  }

  return (
    <div className={cn("min-h-screen bg-background", AD_BANNER_SPACING)}>
      <header className="bg-brand-gradient px-5 pt-6 pb-6 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <nav className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" /> {t("common.home")}
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-auto min-h-9 max-w-48 gap-1.5 whitespace-normal border-destructive/50 bg-card text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" /> {t("delAcc.button")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("delAcc.title")}</AlertDialogTitle>
                <AlertDialogDescription className="text-destructive">{t("delAcc.body")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={(e) => { e.preventDefault(); deleteAccount(); }}
                >
                  {deleting ? t("common.loading") : t("delAcc.confirm")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </nav>
          <h1 className="mt-6 flex items-center gap-2 text-2xl font-semibold text-primary-foreground">
            <UserRound className="h-6 w-6" /> {t("account.title")}
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/75">{t("account.subtitle")}</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pt-5 pb-10 sm:px-10">
        <TrialBanner className="mb-4 bg-secondary text-center [&>div]:justify-center" onChoose={() => setPlansOpen(true)} />
        <div className="mb-5 flex flex-wrap items-center justify-end gap-2">
          {isPaid ? (
            <>
              <span className="text-sm font-medium text-primary-ink">{t("billing.premiumActive")}</span>
              <Button variant="outline" size="sm" className="h-auto min-h-9 gap-1.5 whitespace-normal" onClick={manageSubscription}>
                <Crown className="h-4 w-4" /> {t("billing.manageSub")}
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPlansOpen(true)}>
              <Crown className="h-4 w-4" /> {t("plan.manage")}
            </Button>
          )}
        </div>
        <Dialog open={plansOpen} onOpenChange={setPlansOpen}>
          <DialogContent className="plan-dialog">
            <DialogTitle className="sr-only">{t("plan.chooseTitle")}</DialogTitle>
            <DialogDescription className="sr-only">{t("plan.subtitle")}</DialogDescription>
            <PlanSelection onDone={() => setPlansOpen(false)} />
          </DialogContent>
        </Dialog>
        <Tabs defaultValue="listings">
          <TabsList className="grid w-full grid-cols-2 sm:inline-grid sm:w-auto">
            <TabsTrigger value="listings">{t("account.myListings")}</TabsTrigger>
            <TabsTrigger value="favorites">{t("account.myFavorites")}</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-5">
            {mine.isLoading && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("common.loading")}
              </p>
            )}
            {!mine.isLoading && (mine.data?.length ?? 0) === 0 && (
              <EmptyState title={t("account.noListings")} body={t("account.noListingsBody")}>
                <Button asChild className="mt-5">
                  <Link to="/post">{t("home.post")}</Link>
                </Button>
              </EmptyState>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(mine.data ?? []).map((listing) => (
                <div key={listing.id} className="space-y-2">
                  <ListingCard listing={listing} />
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1 gap-1.5">
                      <Link to="/listings/$id/edit" params={{ id: listing.id }}>
                        <Pencil className="h-4 w-4" /> {t("account.edit")}
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive flex-1 gap-1.5">
                          <Trash2 className="h-4 w-4" /> {t("common.delete")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("account.deleteTitle")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("account.deleteBody")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(listing.id)}>
                            {t("common.delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="favorites" className="mt-5">
            {favorites.isLoading && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("common.loading")}
              </p>
            )}
            {!favorites.isLoading && (favorites.data?.length ?? 0) === 0 && (
              <EmptyState title={t("account.noFavorites")} body={t("account.noFavoritesBody")}>
                <Button asChild className="mt-5">
                  <Link to="/">{t("inbox.browse")}</Link>
                </Button>
              </EmptyState>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(favorites.data ?? []).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </TabsContent>
        </Tabs>


      </main>

      <AdBanner />
    </div>
  );
}

function EmptyState({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-10 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent/25">
        <Heart className="h-5 w-5 text-accent-foreground" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-foreground">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">{body}</p>
      {children}
    </div>
  );
}
