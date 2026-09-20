import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Lock, Map, MapPin, Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import bundledGeo from "@/data/euroDivisionsSource.json";

export type LocationValue = {
  country: string | null;
  region: string | null;
  city: string | null;
};

type LocationNames = Record<string, string>;

type AdminDivision = {
  names?: LocationNames;
};

type GeoCountry = {
  iso_code?: string;
  name_translations?: LocationNames;
  administrative_divisions?: AdminDivision[];
};

const LOCATION_ASSET_URL = "/euro.divisions.json";

/** Tolerant shape check: keeps every country entry the asset provides. */
function isGeoCountry(value: unknown): value is GeoCountry {
  if (typeof value !== "object" || value === null) return false;
  const country = value as GeoCountry;
  if (typeof country.iso_code !== "string" || country.iso_code.length === 0) return false;
  const names = country.name_translations;
  if (typeof names !== "object" || names === null) return false;
  return Object.values(names).some((name) => typeof name === "string" && name.length > 0);
}

/** Parse the `/euro.divisions.json` payload: `{ countries: [...] }`. */
function parseGeoPayload(data: unknown): GeoCountry[] {
  const raw = typeof data === "object" && data !== null ? (data as { countries?: unknown }).countries : null;
  return Array.isArray(raw) ? raw.filter(isGeoCountry) : [];
}

// Bundled copy of the same asset: instant first render, immune to network failures.
const BUNDLED_GEO_DATA = parseGeoPayload(bundledGeo);

/** names[activeLanguage] → names.en → first available translation. */
function getLocalizedName(names: LocationNames | undefined, language: string | null | undefined) {
  if (!names) return "";
  const active = language ? names[language] : undefined;
  return active || names["en"] || Object.values(names).find(Boolean) || "";
}

/** Stable stored value, independent of the active language. */
function canonicalName(names: LocationNames | undefined) {
  if (!names) return "";
  return names["en"] || Object.values(names).find(Boolean) || "";
}

export function LocationFilter({
  value,
  onChange,
  cityMode = "none",
}: {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  /** "text" shows an optional free-text city field (ad wizard); "none" hides it (search). */
  cityMode?: "none" | "text";
}) {
  const { language, t } = useI18n();
  const [geoData, setGeoData] = useState<GeoCountry[]>(BUNDLED_GEO_DATA);
  const [loading, setLoading] = useState(BUNDLED_GEO_DATA.length === 0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(LOCATION_ASSET_URL, { signal: controller.signal, cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`Network response was not ok (${res.status})`);
        return res.json();
      })
      .then((data: unknown) => {
        const list = parseGeoPayload(data);
        if (list.length === 0) throw new Error("Location asset is empty or malformed");
        setGeoData(list);
        setError(false);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error("Error loading multilingual geo asset:", err);
        // Keep the bundled data so the selectors stay usable offline.
        setError(BUNDLED_GEO_DATA.length === 0);
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  // Every derivation is keyed on `language`, so a global language change re-renders all labels.
  const countries = useMemo(
    () =>
      geoData
        .map((country) => ({
          value: country.iso_code as string,
          label: getLocalizedName(country.name_translations, language),
        }))
        .sort((left, right) => left.label.localeCompare(right.label, language ?? "en")),
    [geoData, language],
  );

  const selectedCountry = useMemo(
    () => geoData.find((country) => country.iso_code === value.country),
    [geoData, value.country],
  );

  const regions = useMemo(
    () =>
      (selectedCountry?.administrative_divisions ?? []).map((division) => ({
        value: canonicalName(division.names),
        label: getLocalizedName(division.names, language),
      })),
    [language, selectedCountry],
  );

  const countryLabel = countries.find((country) => country.value === value.country)?.label;
  const regionLabel = regions.find((region) => region.value === value.region)?.label;
  const hasRegion = Boolean(value.region && regions.some((region) => region.value === value.region));

  // Drop selections that no longer exist in the loaded asset.
  useEffect(() => {
    if (loading || error) return;
    if (value.country && !selectedCountry) {
      onChange({ country: null, region: null, city: null });
      return;
    }
    if (value.region && !regions.some((region) => region.value === value.region)) {
      onChange({ country: value.country, region: null, city: value.city });
    }
  }, [error, loading, onChange, regions, selectedCountry, value]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  if (error || geoData.length === 0) {
    return <p className="text-sm text-destructive">{t("errors.loadBody")}</p>;
  }

  return (
    <div className={cityMode === "text" ? "grid gap-4 sm:grid-cols-3" : "grid gap-4 sm:grid-cols-2"}>
      <Field label={t("filter.country")} icon={<Map className="h-3.5 w-3.5" />} locked={false}>
        <Select
          key={`country-${language}-${geoData.length}`}
          {...(value.country ? { value: value.country } : {})}
          onValueChange={(country) => onChange({ country, region: null, city: value.city })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("filter.selectCountry")}>
              {countryLabel ? (
                <span>
                  <span className="mr-2">{flagOf(value.country ?? "")}</span>
                  {countryLabel}
                </span>
              ) : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {countries.map((country) => (
              <SelectItem key={country.value} value={country.value}>
                <span className="mr-2">{flagOf(country.value)}</span>
                {country.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label={t("filter.region")}
        icon={<MapPin className="h-3.5 w-3.5" />}
        locked={!selectedCountry}
      >
        <Select
          key={`region-${language}-${value.country ?? "none"}-${regions.length}`}
          disabled={!selectedCountry}
          {...(hasRegion ? { value: value.region as string } : {})}
          onValueChange={(region) => onChange({ country: value.country, region, city: value.city })}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={selectedCountry ? t("filter.selectRegion") : t("filter.countryFirst")}
            >
              {regionLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {regions.map((region) => (
              <SelectItem key={region.value} value={region.value}>
                {region.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {cityMode === "text" && (
        <Field label={t("filter.city")} icon={<Building2 className="h-3.5 w-3.5" />} locked={false}>
          <Input
            type="text"
            maxLength={120}
            value={value.city ?? ""}
            placeholder={t("filter.selectCity")}
            onChange={(event) =>
              onChange({ ...value, city: event.target.value.length ? event.target.value : null })
            }
          />
        </Field>
      )}
    </div>
  );
}

function flagOf(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (character) => String.fromCodePoint(127397 + character.charCodeAt(0)));
}

function Field({
  label,
  icon,
  locked,
  children,
}: {
  label: string;
  icon: ReactNode;
  locked: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase">
        {icon}
        {label}
        {locked && <Lock className="h-3 w-3" />}
      </Label>
      {children}
    </div>
  );
}
