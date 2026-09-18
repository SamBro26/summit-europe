import { useCallback, useEffect, useState } from "react";

const LANG_KEY = "findme.language";

export function readStoredLanguage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LANG_KEY);
  } catch {
    return null;
  }
}

export function storeLanguage(code: string) {
  try {
    window.localStorage.setItem(LANG_KEY, code);
  } catch {
    /* ignore */
  }
}

export function useLanguagePreference() {
  const [hydrated, setHydrated] = useState(false);
  const [language, setLanguageState] = useState<string | null>(null);

  useEffect(() => {
    setLanguageState(readStoredLanguage());
    setHydrated(true);

    const syncLanguage = (event: StorageEvent) => {
      if (event.key === LANG_KEY) setLanguageState(event.newValue);
    };
    window.addEventListener("storage", syncLanguage);
    return () => window.removeEventListener("storage", syncLanguage);
  }, []);

  const setLanguage = useCallback((code: string) => {
    storeLanguage(code);
    setLanguageState(code);
  }, []);

  const clearLanguage = useCallback(() => {
    try {
      window.localStorage.removeItem(LANG_KEY);
    } catch {
      /* ignore */
    }
    setLanguageState(null);
  }, []);

  return { hydrated, language, setLanguage, clearLanguage };
}
