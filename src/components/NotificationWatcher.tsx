import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Listens for incoming messages anywhere in the app and raises a
 * push-notification style toast (mockup for native push).
 */
export function NotificationWatcher() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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
          toast("New message", {
            description: row.body.slice(0, 90),
            action: {
              label: "Open",
              onClick: () => navigate({ to: "/inbox" }),
            },
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, queryClient]);

  return null;
}
