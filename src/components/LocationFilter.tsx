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

export type LocationValue = {
  country: string | null;
  region: string | null;
  city: string | null;
};

type LocationNames = Record<string, string>;

type GeoItem = {
  iso_3166_1?: string;
  names: LocationNames;
  regions?: GeoItem[];
  municipalities?: GeoItem[];
};

const LOCATION_ASSET_URL = "/euro_multilingual.json";

/** Tolerant shape check: keeps every entry the asset provides instead of dropping partial ones. */
function isGeoItem(value: unknown): value is GeoItem {
  if (typeof value !== "object" || value === null) return false;
  const names = (value as GeoItem).names;
  if (typeof names !== "object" || names === null) return false;
  return Object.values(names).some((name) => typeof name === "string" && name.length > 0);
}

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
  const [geoData, setGeoData] = useState<GeoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(LOCATION_ASSET_URL, { signal: controller.signal, cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`Network response was not ok (${res.status})`);
        return res.json();
      })
      .then((data: unknown) => {
        const list = Array.isArray(data) ? data.filter(isGeoItem) : [];
        if (list.length === 0) throw new Error("Location asset is empty or malformed");
        setGeoData(list);
        setError(false);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error("Error loading multilingual geo asset:", err);
        setError(true);
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  // Every derivation is keyed on `language`, so a global language change re-renders all labels.
  const countries = useMemo(
    () =>
      geoData
        .filter((country) => typeof country.iso_3166_1 === "string")
        .map((country) => ({
          value: country.iso_3166_1 as string,
          label: getLocalizedName(country.names, language),
        }))
        .sort((left, right) => left.label.localeCompare(right.label, language ?? "en")),
    [geoData, language],
  );

  const selectedCountry = useMemo(
    () => geoData.find((country) => country.iso_3166_1 === value.country),
    [geoData, value.country],
  );

  const regions = useMemo(
    () =>
      (selectedCountry?.regions ?? []).map((region) => ({
        value: canonicalName(region.names),
        label: getLocalizedName(region.names, language),
      })),
    [language, selectedCountry],
  );

  const selectedRegion = useMemo(
    () =>
      (selectedCountry?.regions ?? []).find(
        (region) => canonicalName(region.names) === value.region,
      ),
    [selectedCountry, value.region],
  );

  const cities = useMemo(
    () =>
      (selectedRegion?.municipalities ?? []).map((municipality) => ({
        value: canonicalName(municipality.names),
        label: getLocalizedName(municipality.names, language),
      })),
    [language, selectedRegion],
  );

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
