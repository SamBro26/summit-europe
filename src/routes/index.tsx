import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { LanguageSelect } from "@/components/LanguageSelect";
import { HomeScreen } from "@/components/HomeScreen";
import { useI18n } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/languages";

const SUPPORTED_CODES = new Set(LANGUAGES.map((l) => l.code));

function detectSystemLanguage(): string {
  if (typeof navigator === "undefined") return "en";
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const tag of candidates) {
    const prefix = (tag ?? "").toLowerCase().split("-")[0];
    if (prefix && SUPPORTED_CODES.has(prefix)) return prefix;
  }
  return "en";
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FindMe RealEstate — Property across the Eurozone" },
      {
        name: "description",
        content:
          "Browse offered properties and search requests across every Eurozone country, in your own language.",
      },
      { property: "og:title", content: "FindMe RealEstate — Property across the Eurozone" },
      {
        property: "og:description",
        content:
          "Browse offered properties and search requests across every Eurozone country, in your own language.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Stage = "splash" | "language" | "home";

function Index() {
  const { hydrated, language, setLanguage } = useI18n();
  const [splashDone, setSplashDone] = useState(false);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 2400);
    return () => clearTimeout(t);
  }, []);

  // First visit: auto-detect the device/browser language once and lock it in,
  // skipping the manual onboarding screen entirely.
  useEffect(() => {
    if (hydrated && !language) {
      setLanguage(detectSystemLanguage());
    }
  }, [hydrated, language, setLanguage]);

  const stage: Stage = !hydrated || !splashDone || !language ? "splash" : "home";

  if (stage === "splash") return <SplashScreen />;

  return (
    <>
      <HomeScreen languageCode={language} onChangeLanguage={() => setChanging(true)} />
      {changing && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
          <LanguageSelect
            current={language}
            onConfirm={(code) => {
              setLanguage(code);
              setChanging(false);
            }}
            onCancel={() => setChanging(false)}
          />
        </div>
      )}
    </>
  );
}
