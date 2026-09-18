import { Check, Globe } from "lucide-react";
import { useState } from "react";
import { LANGUAGES } from "@/lib/languages";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { translate } from "@/lib/i18n";

export function LanguageSelect({
  current,
  onConfirm,
  onCancel,
}: {
  current?: string | null;
  onConfirm: (code: string) => void;
  onCancel?: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(current ?? null);
  // Preview the chosen language immediately on this screen.
  const t = (key: Parameters<typeof translate>[1]) => translate(selected ?? current ?? null, key);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-brand-gradient px-5 pt-12 pb-10 sm:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs tracking-widest text-primary-foreground/80 uppercase">
            <Globe className="h-3.5 w-3.5" /> FindMe RealEstate
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-primary-foreground sm:text-4xl">
            {t("lang.title")}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-primary-foreground/75 sm:text-base">
            {t("lang.subtitle")}
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-6 sm:px-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {LANGUAGES.map((lang) => {
            const active = selected === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setSelected(lang.code)}
                className={cn(
                  "group relative flex flex-col items-start gap-1 rounded-xl border bg-card p-3.5 text-left transition-all",
                  active
                    ? "border-primary shadow-soft ring-2 ring-primary/25"
                    : "border-border hover:border-primary/40 hover:-translate-y-0.5",
                )}
              >
                <span className="text-xl leading-none">{lang.flag}</span>
                <span className="text-sm font-semibold text-card-foreground">{lang.native}</span>
                <span className="text-xs text-muted-foreground">{lang.name}</span>
                {active && (
                  <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </main>

      <div className="sticky bottom-0 border-t border-border bg-background/90 px-5 py-4 backdrop-blur sm:px-10">
        <div className="mx-auto flex max-w-4xl gap-3">
          {onCancel && (
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={onCancel}>
              {t("lang.cancel")}
            </Button>
          )}
          <Button
            className="flex-1"
            size="lg"
            disabled={!selected}
            onClick={() => selected && onConfirm(selected)}
          >
            {t("lang.continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}
