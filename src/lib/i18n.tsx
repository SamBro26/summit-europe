import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useLanguagePreference } from "@/lib/preferences";
import { translate, type TranslationKey } from "@/lib/i18n-data";

export type { TranslationKey };

type I18nContextValue = {
  hydrated: boolean;
  language: string | null;
  setLanguage: (code: string) => void;
  clearLanguage: () => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { hydrated, language, setLanguage, clearLanguage } = useLanguagePreference();

  const t = useCallback((key: TranslationKey) => translate(language, key), [language]);

  const value = useMemo(
    () => ({ hydrated, language, setLanguage, clearLanguage, t }),
    [hydrated, language, setLanguage, clearLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}

export function useT() {
  return useI18n().t;
}
