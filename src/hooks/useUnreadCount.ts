import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Unread messages + unread admin notifications for the signed-in user.
 * Subscribes to realtime inserts so the header badge lights up instantly.
 */
export function useUnreadCount() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["unread", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const [messages, notifications] = await Promise.all([
        supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("recipient_id", user!.id)
          .is("read_at", null),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .is("read_at", null),
      ]);
      return (messages.count ?? 0) + (notifications.count ?? 0);
    },
  });

  useEffect(() => {
    if (!user) return;
    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: ["unread", user.id] });

    const channel = supabase
      .channel(`unread-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        invalidate,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        invalidate,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return { count: query.data ?? 0 };
}
