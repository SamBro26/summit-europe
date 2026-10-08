import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = { session: Session | null; user: User | null; loading: boolean };
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let receivedAuthEvent = false;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      receivedAuthEvent = true;
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!active || receivedAuthEvent) return;
      setSession(data.session);
      setLoading(false);
    }).catch(() => {
      if (active && !receivedAuthEvent) setLoading(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ session, user: session?.user ?? null, loading }), [session, loading]);
  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside <AuthProvider>");
  return auth;
}
