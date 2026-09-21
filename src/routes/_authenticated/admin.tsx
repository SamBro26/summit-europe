import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Ban, Flag, Megaphone, ShieldCheck, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { deleteListingAsAdmin, setUserBanned } from "@/lib/admin";
import { useLocationNames } from "@/lib/locations";
import { formatEuro } from "@/lib/property";
import { AdBanner, AD_BANNER_SPACING } from "@/components/AdBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useT, type TranslationKey } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — FindMe RealEstate" },
      {
        name: "description",
        content: "Moderation dashboard for reported listings and user accounts.",
      },
      { property: "og:title", content: "Admin dashboard — FindMe RealEstate" },
      {
        property: "og:description",
        content: "Moderation dashboard for reported listings and user accounts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const REASON_LABELS: Record<string, string> = {
  fraud: "Suspected fraud",
  wrong_info: "Misleading information",
  duplicate: "Duplicate listing",
  offensive: "Offensive content",
  sold: "Already sold / rented",
  other: "Other",
};

function AdminPage() {
  const t = useT();
  const { isAdmin, loading } = useIsAdmin();

  if (loading) {
    return (
      <p className="p-16 text-center text-sm text-muted-foreground">{t("admin.checking")}</p>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldCheck className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">{t("admin.only")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.restricted")}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">{t("listing.backHome")}</Link>
        </Button>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const t = useT();
  const loc = useLocationNames();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const reports = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("listing_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      const listingIds = [...new Set((rows ?? []).map((r) => r.listing_id))];
      const reporterIds = [...new Set((rows ?? []).map((r) => r.reporter_id))];

      const [{ data: listings }, { data: profiles }] = await Promise.all([
        listingIds.length
          ? supabase.from("listings").select("*").in("id", listingIds)
          : Promise.resolve({ data: [] as any[] }),
        reporterIds.length
          ? supabase.from("profiles").select("id, display_name").in("id", reporterIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      return {
        rows: rows ?? [],
        listings: new Map((listings ?? []).map((l: any) => [l.id, l])),
        reporters: new Map((profiles ?? []).map((p: any) => [p.id, p.display_name as string])),
      };
    },
  });

  const people = useQuery({
    queryKey: ["admin", "people"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, banned_at, ban_reason, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  }

  async function run(fn: () => Promise<void>, ok: string) {
    try {
      await fn();
      toast.success(ok);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.actionFailed"));
    }
  }

  const openCount = (reports.data?.rows ?? []).filter((r: any) => r.status === "open").length;
  const filteredPeople = (people.data ?? []).filter((p: any) =>
    search.trim()
      ? (p.display_name ?? "").toLowerCase().includes(search.trim().toLowerCase())
      : true,
  );

  return (
    <div className={cn("min-h-screen bg-background", AD_BANNER_SPACING)}>
      <header className="bg-brand-gradient px-5 pt-6 pb-14 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {t("common.home")}
          </Link>
          <h1 className="mt-6 flex items-center gap-2 text-2xl font-semibold text-primary-foreground">
            <ShieldCheck className="h-6 w-6" /> {t("admin.dashboard")}
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/75">
            {t("admin.waiting").replace("{count}", String(openCount))}
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-8 w-full max-w-4xl px-5 pb-10 sm:px-10">
        <Tabs defaultValue="reports">
          <TabsList className="grid w-full grid-cols-3 sm:inline-grid sm:w-auto">
            <TabsTrigger value="reports">{t("admin.reportedAds")}</TabsTrigger>
            <TabsTrigger value="people">{t("admin.accounts")}</TabsTrigger>
            <TabsTrigger value="broadcast">{t("admin.broadcast")}</TabsTrigger>
          </TabsList>

          <TabsContent value="broadcast" className="mt-5">
            <BroadcastPanel />
          </TabsContent>

          <TabsContent value="reports" className="mt-5 space-y-3">
            {reports.isLoading && (
              <p className="text-sm text-muted-foreground">{t("admin.loadingReports")}</p>
            )}
            {!reports.isLoading && (reports.data?.rows.length ?? 0) === 0 && (
              <div className="shadow-soft rounded-2xl border border-border bg-card p-10 text-center">
                <Flag className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("admin.noReports")}
                </p>
              </div>
            )}

            {(reports.data?.rows ?? []).map((r: any) => {
              const listing: any = reports.data?.listings.get(r.listing_id);

              return (
                <article
                  key={r.id}
                  className="shadow-soft rounded-2xl border border-border bg-card p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={r.status === "open" ? "default" : "secondary"}>
                      {r.status === "open" ? t("admin.open") : t("admin.resolved")}
                    </Badge>
                    <Badge variant="outline">{REASON_LABELS[r.reason] ?? r.reason}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-medium">
                    {listing
                      ? `${t(`prop.${listing.property_type}` as TranslationKey)} · ${[loc.cityName(listing.country_code, listing.region, listing.city), loc.countryName(listing.country_code)].filter(Boolean).join(", ")}`
                      : t("admin.listingRemoved")}
                  </p>
                  {listing && (
                    <p className="text-sm text-muted-foreground">
                      {formatEuro(listing.price_eur) ?? t("listing.priceOnRequest")}
                    </p>
                  )}
                  {r.details && (
                    <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">
                      “{r.details}”
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("admin.reportedBy").replace("{name}", reports.data?.reporters.get(r.reporter_id) ?? t("admin.aUser"))}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {listing && (
                      <Button asChild variant="outline" size="sm">
                        <Link to="/listings/$id" params={{ id: listing.id }}>
                          {t("admin.viewListing")}
                        </Link>
                      </Button>
                    )}
                    {listing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive gap-1.5"
                        onClick={() =>
                          run(() => deleteListingAsAdmin(listing.id), t("admin.listingDeleted"))
                        }
                      >
                        <Trash2 className="h-4 w-4" /> {t("admin.deleteAd")}
                      </Button>
                    )}
                    {listing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive gap-1.5"
                        onClick={() =>
                          run(
                            () => setUserBanned(listing.author_id, true, "Banned after a report"),
                            t("admin.accountBanned"),
                          )
                        }
                      >
                        <Ban className="h-4 w-4" /> {t("admin.banAuthor")}
                      </Button>
                    )}
                    {r.status === "open" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          run(async () => {
                            const { error } = await supabase
                              .from("listing_reports")
                              .update({ status: "resolved" })
                              .eq("id", r.id);
                            if (error) throw error;
                          }, t("admin.reportResolved"))
                        }
                      >
                        {t("admin.markResolved")}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          run(async () => {
                            const { error } = await supabase
                              .from("listing_reports")
                              .update({ status: "open" })
                              .eq("id", r.id);
                            if (error) throw error;
                          }, t("admin.reportReopened"))
                        }
                      >
                        {t("admin.reopen")}
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </TabsContent>

          <TabsContent value="people" className="mt-5">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.searchName")}
              className="mb-4 bg-card"
            />
            <div className="shadow-soft divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {people.isLoading && (
                <p className="p-6 text-sm text-muted-foreground">{t("admin.loadingAccounts")}</p>
              )}
              {filteredPeople.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-4">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {p.display_name ?? t("common.user")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {p.banned_at
                        ? `${t("admin.bannedOn").replace("{date}", new Date(p.banned_at).toLocaleDateString())}${p.ban_reason ? ` — ${p.ban_reason}` : ""}`
                        : t("admin.joinedOn").replace("{date}", new Date(p.created_at).toLocaleDateString())}
                    </span>
                  </span>
                  {p.banned_at ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => run(() => setUserBanned(p.id, false), t("admin.accountRestored"))}
                    >
                      <Undo2 className="h-4 w-4" /> {t("admin.unban")}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive gap-1.5"
                      onClick={() =>
                        run(
                          () => setUserBanned(p.id, true, "Banned from the admin dashboard"),
                          t("admin.accountBanned"),
                        )
                      }
                    >
                      <Ban className="h-4 w-4" /> {t("admin.ban")}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AdBanner />
    </div>
  );
}

function BroadcastPanel() {
  const t = useT();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    setSending(true);
    const { error } = await supabase.rpc("broadcast_notification", {
      _title: title.trim(),
      _body: body.trim(),
    });
    setSending(false);
    if (error) {
      toast.error(t("common.actionFailed"));
      return;
    }
    toast.success(t("admin.broadcastSent"));
    setTitle("");
    setBody("");
  }

  return (
    <div className="shadow-soft space-y-3 rounded-2xl border border-border bg-card p-5">
      <Input
        value={title}
        maxLength={120}
        placeholder={t("admin.broadcastTitle")}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        value={body}
        rows={4}
        maxLength={1000}
        placeholder={t("admin.broadcastBody")}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button onClick={send} disabled={sending || !title.trim()} className="gap-1.5">
        <Megaphone className="h-4 w-4" /> {t("admin.broadcastSend")}
      </Button>
    </div>
  );
}
