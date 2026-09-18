import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { LanguageSelect } from "@/components/LanguageSelect";
import { HomeScreen } from "@/components/HomeScreen";
import { useI18n } from "@/lib/i18n";

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

  const stage: Stage = !hydrated || !splashDone ? "splash" : changing || !language ? "language" : "home";

  if (stage === "splash") return <SplashScreen />;

  if (stage === "language")
    return (
      <LanguageSelect
        current={language}
        onConfirm={(code) => {
          setLanguage(code);
          setChanging(false);
        }}
        {...(language ? { onCancel: () => setChanging(false) } : {})}
      />
    );

  return <HomeScreen languageCode={language} onChangeLanguage={() => setChanging(true)} />;
}
