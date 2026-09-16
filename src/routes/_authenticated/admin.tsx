import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Ban, Flag, ShieldCheck, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { deleteListingAsAdmin, setUserBanned } from "@/lib/admin";
import { getCountry } from "@/lib/locations";
import { formatEuro, propertyTypeLabel } from "@/lib/property";
import { AdBanner, AD_BANNER_SPACING } from "@/components/AdBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
  const { isAdmin, loading } = useIsAdmin();

  if (loading) {
    return (
      <p className="p-16 text-center text-sm text-muted-foreground">Checking your access…</p>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldCheck className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">Admins only</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This dashboard is restricted to the moderation team.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
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
      toast.error(error instanceof Error ? error.message : "Action failed");
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
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="mt-6 flex items-center gap-2 text-2xl font-semibold text-primary-foreground">
            <ShieldCheck className="h-6 w-6" /> Admin dashboard
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/75">
            {openCount} report{openCount === 1 ? "" : "s"} waiting for review across the network.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-8 w-full max-w-4xl px-5 pb-10 sm:px-10">
        <Tabs defaultValue="reports">
          <TabsList className="grid w-full grid-cols-2 sm:inline-grid sm:w-auto">
            <TabsTrigger value="reports">Reported ads</TabsTrigger>
            <TabsTrigger value="people">Accounts</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="mt-5 space-y-3">
            {reports.isLoading && (
              <p className="text-sm text-muted-foreground">Loading reports…</p>
            )}
            {!reports.isLoading && (reports.data?.rows.length ?? 0) === 0 && (
              <div className="shadow-soft rounded-2xl border border-border bg-card p-10 text-center">
                <Flag className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No reports yet — the network is clean.
                </p>
              </div>
            )}

            {(reports.data?.rows ?? []).map((r: any) => {
              const listing: any = reports.data?.listings.get(r.listing_id);
              const country = listing ? getCountry(listing.country_code) : undefined;
              return (
                <article
                  key={r.id}
                  className="shadow-soft rounded-2xl border border-border bg-card p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={r.status === "open" ? "default" : "secondary"}>
                      {r.status === "open" ? "Open" : "Resolved"}
                    </Badge>
                    <Badge variant="outline">{REASON_LABELS[r.reason] ?? r.reason}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-medium">
                    {listing
                      ? `${propertyTypeLabel(listing.property_type)} · ${[listing.city, country?.name].filter(Boolean).join(", ")}`
                      : "Listing already removed"}
                  </p>
                  {listing && (
                    <p className="text-sm text-muted-foreground">
                      {formatEuro(listing.price_eur) ?? "Price on request"}
                    </p>
                  )}
                  {r.details && (
                    <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">
                      “{r.details}”
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Reported by {reports.data?.reporters.get(r.reporter_id) ?? "a user"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {listing && (
                      <Button asChild variant="outline" size="sm">
                        <Link to="/listings/$id" params={{ id: listing.id }}>
                          View listing
                        </Link>
                      </Button>
                    )}
                    {listing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive gap-1.5"
                        onClick={() =>
                          run(() => deleteListingAsAdmin(listing.id), "Listing deleted")
                        }
                      >
                        <Trash2 className="h-4 w-4" /> Delete ad
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
                            "Account banned",
                          )
                        }
                      >
                        <Ban className="h-4 w-4" /> Ban author
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
                          }, "Report resolved")
                        }
                      >
                        Mark resolved
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
                          }, "Report reopened")
                        }
                      >
                        Reopen
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
              placeholder="Search by name…"
              className="mb-4 bg-card"
            />
            <div className="shadow-soft divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {people.isLoading && (
                <p className="p-6 text-sm text-muted-foreground">Loading accounts…</p>
              )}
              {filteredPeople.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-4">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {p.display_name ?? "FindMe user"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {p.banned_at
                        ? `Banned ${new Date(p.banned_at).toLocaleDateString()}${p.ban_reason ? ` — ${p.ban_reason}` : ""}`
                        : `Joined ${new Date(p.created_at).toLocaleDateString()}`}
                    </span>
                  </span>
                  {p.banned_at ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => run(() => setUserBanned(p.id, false), "Account restored")}
                    >
                      <Undo2 className="h-4 w-4" /> Unban
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive gap-1.5"
                      onClick={() =>
                        run(
                          () => setUserBanned(p.id, true, "Banned from the admin dashboard"),
                          "Account banned",
                        )
                      }
                    >
                      <Ban className="h-4 w-4" /> Ban
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
