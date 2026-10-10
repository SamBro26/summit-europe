import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — FindMe RealEstate" },
      { name: "description", content: "Choose a new password for your FindMe RealEstate account." },
      { property: "og:title", content: "Reset password — FindMe RealEstate" },
      { property: "og:description", content: "Choose a new password for your FindMe RealEstate account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const t = useT();
  const navigate = useNavigate();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setTimeout(() => setReady((r) => r ?? false), 2500);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return void toast.error(t("auth.shortPassword"));
    if (password !== confirm) return void toast.error(t("auth.passwordMismatch"));
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success(t("auth.passwordUpdated"));
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="bg-brand-gradient flex h-9 w-9 items-center justify-center rounded-xl">
            <Home className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={1.6} />
          </span>
          <span className="font-display text-lg font-semibold">
            FindMe <span className="text-primary-ink">RealEstate</span>
          </span>
        </Link>
        <div className="shadow-soft rounded-2xl border border-border bg-card p-6">
          <h1 className="text-xl font-semibold">{t("auth.resetTitle")}</h1>
          {ready === false ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">{t("auth.invalidLink")}</p>
              <Button asChild className="w-full">
                <Link to="/auth">{t("common.signIn")}</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
                <Input id="new-password" type="password" autoComplete="new-password" maxLength={72}
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">{t("auth.confirmPassword")}</Label>
                <Input id="confirm-password" type="password" autoComplete="new-password" maxLength={72}
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={busy || !ready}>
                {t("auth.updatePassword")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
