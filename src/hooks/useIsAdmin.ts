import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** True when the signed-in account holds the admin role. */
export function useIsAdmin() {
  const { user, loading } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .limit(1);
      if (error) throw error;
      return (rows ?? []).length > 0;
    },
  });

  return { isAdmin: Boolean(data), loading: loading || (Boolean(user) && isLoading) };
}
