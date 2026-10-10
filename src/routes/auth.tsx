import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useT } from "@/lib/i18n";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — FindMe RealEstate" },
      {
        name: "description",
        content: "Sign in or create a free account to post and manage property ads in the Eurozone.",
      },
      { property: "og:title", content: "Sign in — FindMe RealEstate" },
      {
        property: "og:description",
        content: "Sign in or create a free account to post and manage property ads in the Eurozone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const t = useT();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().trim().email(t("auth.invalidEmail")).max(255).safeParse(resetEmail);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("auth.resetSent"));
    setResetOpen(false);
  }

  const target = search.redirect && search.redirect.startsWith("/") ? search.redirect : "/";

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: target, replace: true });
    });
  }, [navigate, target]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const credentials = z.object({
      email: z.string().trim().email(t("auth.invalidEmail")).max(255),
      password: z.string().min(6, t("auth.shortPassword")).max(72),
    });
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data.session) {
        toast.success(t("auth.confirmEmail"));
        return;
      }
      navigate({ to: target, replace: true });
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      navigate({ to: target, replace: true });
    }
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(t("auth.googleError"));
      return;
    }
    if (result.redirected) return;
    navigate({ to: target, replace: true });
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
          <h1 className="text-xl font-semibold">
            {mode === "signin" ? t("auth.welcomeBack") : t("auth.createAccount")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.free")}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                maxLength={255}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                maxLength={72}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode === "signin" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground underline hover:text-foreground"
                    onClick={() => {
                      setResetEmail(email);
                      setResetOpen(true);
                    }}
                  >
                    {t("auth.forgot")}
                  </button>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "signin" ? t("common.signIn") : t("auth.signUp")}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> {t("auth.or")}{" "}
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={google}>
            {t("auth.google")}
          </Button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
            <button
              type="button"
              className="font-medium text-foreground underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? t("auth.signUp") : t("common.signIn")}
            </button>
          </p>
        </div>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("auth.resetTitle")}</DialogTitle>
            <DialogDescription>{t("auth.resetBody")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={sendReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-email">{t("auth.email")}</Label>
              <Input
                id="reset-email"
                type="email"
                autoComplete="email"
                value={resetEmail}
                maxLength={255}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {t("auth.sendLink")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
