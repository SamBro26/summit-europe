import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Building2, Lock, Map, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import bundledGeo from "@/data/euroCountries.json";

export type LocationValue = {
  country: string | null;
  region: string | null;
  city: string | null;
};

type LocationNames = Record<string, string>;

type MunicipalityItem = {
  municipality_id?: string;
  name?: string;
};

type Level2Division = {
  names?: LocationNames;
  municipalities?: MunicipalityItem[];
};

type AdminDivision = {
  names?: LocationNames;
  level2_divisions?: Level2Division[];
};

type GeoCountry = {
  iso_code?: string;
  name_translations?: LocationNames;
  administrative_divisions?: AdminDivision[];
};

const LOCATION_ASSET_URL = "/euro.countries.json";

/** Tolerant shape check: keeps every country entry the asset provides. */
function isGeoCountry(value: unknown): value is GeoCountry {
  if (typeof value !== "object" || value === null) return false;
  const country = value as GeoCountry;
  if (typeof country.iso_code !== "string" || country.iso_code.length === 0) return false;
  const names = country.name_translations;
  if (typeof names !== "object" || names === null) return false;
  return Object.values(names).some((name) => typeof name === "string" && name.length > 0);
}

/** Parse the `/euro.countries.json` payload: `{ countries: [...] }`. */
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
}: {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
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
        division,
      })),
    [language, selectedCountry],
  );

  const selectedRegion = useMemo(
    () => regions.find((region) => region.value === value.region)?.division,
    [regions, value.region],
  );

  const cities = useMemo(() => {
    const level2 = selectedRegion?.level2_divisions ?? [];
    const names = level2.flatMap((division) => {
      const municipalities = division.municipalities ?? [];
      if (municipalities.length > 0) {
        return municipalities
          .map((municipality) => municipality.name)
          .filter((name): name is string => typeof name === "string" && name.length > 0);
      }
      const fallback = canonicalName(division.names);
      return fallback ? [fallback] : [];
    });
    return Array.from(new Set(names)).map((name) => ({ value: name, label: name }));
  }, [selectedRegion]);

  const countryLabel = countries.find((country) => country.value === value.country)?.label;
  const regionLabel = regions.find((region) => region.value === value.region)?.label;
  const cityLabel = cities.find((city) => city.value === value.city)?.label;

  // Drop selections that no longer exist in the loaded asset.
  useEffect(() => {
    if (loading || error) return;
    if (value.country && !selectedCountry) {
      onChange({ country: null, region: null, city: null });
      return;
    }
    if (value.region && !selectedRegion) {
      onChange({ country: value.country, region: null, city: null });
      return;
    }
    if (value.city && !cities.some((city) => city.value === value.city)) {
      onChange({ ...value, city: null });
    }
  }, [cities, error, loading, onChange, selectedCountry, selectedRegion, value]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  if (error || geoData.length === 0) {
    return <p className="text-sm text-destructive">{t("errors.loadBody")}</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label={t("filter.country")} icon={<Map className="h-3.5 w-3.5" />} locked={false}>
        <Select
          key={`country-${language}-${geoData.length}`}
          {...(value.country ? { value: value.country } : {})}
          onValueChange={(country) => onChange({ country, region: null, city: null })}
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
          {...(value.region ? { value: value.region } : {})}
          onValueChange={(region) => onChange({ country: value.country, region, city: null })}
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

      <Field
        label={t("filter.city")}
        icon={<Building2 className="h-3.5 w-3.5" />}
        locked={!selectedRegion}
      >
        <Select
          key={`city-${language}-${value.country ?? "none"}-${value.region ?? "none"}-${cities.length}`}
          disabled={!selectedRegion}
          {...(value.city ? { value: value.city } : {})}
          onValueChange={(city) => onChange({ ...value, city })}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={selectedRegion ? t("filter.selectCity") : t("filter.regionFirst")}
            >
              {cityLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {cities.map((city) => (
              <SelectItem key={city.value} value={city.value}>
                {city.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
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
