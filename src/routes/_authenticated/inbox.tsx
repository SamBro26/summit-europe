import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Inbox as InboxIcon, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getCountry } from "@/lib/locations";
import { propertyTypeLabel } from "@/lib/property";
import { ChatPanel } from "@/components/ChatPanel";
import { AdBanner, AD_BANNER_SPACING } from "@/components/AdBanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — FindMe RealEstate" },
      {
        name: "description",
        content:
          "All your property conversations with buyers and sellers across Europe in one inbox.",
      },
      { property: "og:title", content: "Inbox — FindMe RealEstate" },
      {
        property: "og:description",
        content:
          "All your property conversations with buyers and sellers across Europe in one inbox.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InboxPage,
});

type MessageRow = {
  id: string;
  listing_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

type Thread = {
  key: string;
  listingId: string;
  otherId: string;
  last: MessageRow;
  unread: number;
};

function InboxPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState<Thread | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["inbox", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      const messages = (rows ?? []) as MessageRow[];

      const listingIds = [...new Set(messages.map((m) => m.listing_id))];
      const partnerIds = [
        ...new Set(
          messages.map((m) => (m.sender_id === user!.id ? m.recipient_id : m.sender_id)),
        ),
      ];

      const [{ data: listings }, { data: profiles }] = await Promise.all([
        listingIds.length
          ? supabase
              .from("listings")
              .select("id, property_type, city, region, country_code")
              .in("id", listingIds)
          : Promise.resolve({ data: [] as never[] }),
        partnerIds.length
          ? supabase.from("profiles").select("id, display_name").in("id", partnerIds)
          : Promise.resolve({ data: [] as never[] }),
      ]);

      return { messages, listings: listings ?? [], profiles: profiles ?? [] };
    },
  });

  const threads: Thread[] = useMemo(() => {
    if (!data || !user) return [];
    const map = new Map<string, Thread>();
    for (const m of data.messages) {
      const otherId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      const key = `${m.listing_id}:${otherId}`;
      const existing = map.get(key);
      const unread = m.recipient_id === user.id && !m.read_at ? 1 : 0;
      if (!existing) {
        map.set(key, { key, listingId: m.listing_id, otherId, last: m, unread });
      } else {
        existing.unread += unread;
      }
    }
    return [...map.values()].sort(
      (a, b) => Date.parse(b.last.created_at) - Date.parse(a.last.created_at),
    );
  }, [data, user]);

  const listingById = useMemo(
    () => new Map((data?.listings ?? []).map((l: any) => [l.id, l])),
    [data],
  );
  const nameById = useMemo(
    () => new Map((data?.profiles ?? []).map((p: any) => [p.id, p.display_name as string])),
    [data],
  );

  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("listing_id", open.listingId)
      .eq("recipient_id", user.id)
      .is("read_at", null)
      .then(() => refetch());
  }, [open, user, refetch]);

  return (
    <div className={cn("min-h-screen bg-background", AD_BANNER_SPACING)}>
      <header className="bg-brand-gradient px-5 pt-6 pb-14 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-primary-foreground">Inbox</h1>
          <p className="mt-1 text-sm text-primary-foreground/75">
            Every conversation with buyers and sellers, across all countries.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-8 w-full max-w-3xl px-5 pb-10 sm:px-10">
        <section className="shadow-soft overflow-hidden rounded-2xl border border-border bg-card">
          {isLoading && (
            <p className="p-10 text-center text-sm text-muted-foreground">Loading conversations…</p>
          )}

          {!isLoading && threads.length === 0 && (
            <div className="p-10 text-center">
              <span className="bg-secondary mx-auto flex h-11 w-11 items-center justify-center rounded-full">
                <InboxIcon className="h-5 w-5 text-muted-foreground" />
              </span>
              <h2 className="mt-4 text-base font-semibold">No conversations yet</h2>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                Open a listing and tap “Send message” to start talking to an advertiser.
              </p>
              <Button asChild className="mt-5">
                <Link to="/">Browse listings</Link>
              </Button>
            </div>
          )}

          <ul className="divide-y divide-border">
            {threads.map((t) => {
              const listing: any = listingById.get(t.listingId);
              const country = listing ? getCountry(listing.country_code) : undefined;
              return (
                <li key={t.key}>
                  <button
                    onClick={() => setOpen(t)}
                    className="hover:bg-secondary/40 flex w-full items-start gap-3 p-4 text-left transition-colors"
                  >
                    <span className="bg-brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-primary-foreground">
                      {(nameById.get(t.otherId) ?? "?").slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {nameById.get(t.otherId) ?? "FindMe user"}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {new Date(t.last.created_at).toLocaleDateString()}
                        </span>
                      </span>
                      {listing && (
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {propertyTypeLabel(listing.property_type)} ·{" "}
                          {[listing.city, country?.name].filter(Boolean).join(", ")}
                        </span>
                      )}
                      <span className="mt-1 block truncate text-sm text-muted-foreground">
                        {t.last.sender_id === user?.id ? "You: " : ""}
                        {t.last.body}
                      </span>
                    </span>
                    {t.unread > 0 && <Badge className="shrink-0">{t.unread}</Badge>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      {open && user && (
        <ChatPanel
          listingId={open.listingId}
          meId={user.id}
          otherId={open.otherId}
          onClose={() => setOpen(null)}
        />
      )}

      <AdBanner />
    </div>
  );
}
