import { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

type Message = {
  id: string;
  listing_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
};

export function ChatPanel({
  listingId,
  meId,
  otherId,
  onClose,
}: {
  listingId: string;
  meId: string;
  otherId: string;
  onClose: () => void;
}) {
  const t = useT();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("messages")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (active) setMessages((data ?? []) as Message[]);
      });

    const channel = supabase
      .channel(`messages-${listingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `listing_id=eq.${listingId}`,
        },
        (payload) => {
          const row = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [listingId]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || body.length > 2000) return;
    setSending(true);
    const { error } = await supabase
      .from("messages")
      .insert({ listing_id: listingId, sender_id: meId, recipient_id: otherId, body });
    setSending(false);
    if (!error) setDraft("");
  }

  return (
    <div className="shadow-soft fixed right-4 bottom-[74px] z-50 flex h-[26rem] max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card sm:bottom-[114px]">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold">{t("chat.title")}</span>
        <button onClick={onClose} aria-label={t("chat.close")}>
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            {t("chat.empty")}
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
              m.sender_id === meId
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-secondary text-foreground",
            )}
          >
            {m.body}
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <div className="flex items-end gap-2 border-t border-border p-3">
        <Textarea
          rows={1}
          value={draft}
          maxLength={2000}
          placeholder={t("chat.placeholder")}
          onChange={(e) => setDraft(e.target.value)}
          className="max-h-24 min-h-9 resize-none"
        />
        <Button size="icon" onClick={send} disabled={sending || !draft.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
