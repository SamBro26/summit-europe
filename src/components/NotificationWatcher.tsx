import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/lib/i18n";

/**
 * Listens for incoming messages anywhere in the app and raises a
 * push-notification style toast (mockup for native push).
 */
export function NotificationWatcher() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const t = useT();

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`inbox-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { body: string; listing_id: string };
          queryClient.invalidateQueries({ queryKey: ["inbox"] });
          queryClient.invalidateQueries({ queryKey: ["unread", user.id] });
          toast(t("chat.newMessage"), {
            description: row.body.slice(0, 90),
            action: {
              label: t("chat.open"),
              onClick: () => navigate({ to: "/inbox" }),
            },
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as { title: string; body: string | null };
          queryClient.invalidateQueries({ queryKey: ["unread", user.id] });
          toast(row.title || t("notif.new"), {
            description: row.body?.slice(0, 120),
            action: {
              label: t("chat.open"),
              onClick: () => navigate({ to: "/inbox" }),
            },
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, queryClient, t]);

  return null;
}
