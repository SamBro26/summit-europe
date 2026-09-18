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
type Municipality = { names: LocationNames };
type Region = { names: LocationNames; municipalities: Municipality[] };
type Country = {
  iso_3166_1: string;
  names: LocationNames;
  regions: Region[];
};

const LOCATION_ASSET_URL = "/euro_multilingual.json";

function isNames(value: unknown): value is LocationNames {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as LocationNames)["en"] === "string"
  );
}

function isMunicipality(value: unknown): value is Municipality {
  return typeof value === "object" && value !== null && isNames((value as Municipality).names);
}

function isRegion(value: unknown): value is Region {
  if (typeof value !== "object" || value === null) return false;
  const region = value as Region;
  return (
    isNames(region.names) &&
    Array.isArray(region.municipalities) &&
    region.municipalities.every(isMunicipality)
  );
}

function isCountry(value: unknown): value is Country {
  if (typeof value !== "object" || value === null) return false;
  const country = value as Country;
  return (
    typeof country.iso_3166_1 === "string" &&
    isNames(country.names) &&
    Array.isArray(country.regions) &&
    country.regions.every(isRegion)
  );
}

function localizedName(names: LocationNames, language: string | null | undefined) {
  return (language ? names[language] : undefined) || names["en"] || "";
}

function canonicalName(names: LocationNames) {
  return names["en"] || "";
}

export function LocationFilter({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
}) {
  const { language, t } = useI18n();
  const [geoData, setGeoData] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLocations() {
      try {
        const response = await fetch(LOCATION_ASSET_URL, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Location data request failed with status ${response.status}`);
        }

        const parsed: unknown = await response.json();
        if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.every(isCountry)) {
          throw new Error("Location data has an invalid structure");
        }

        setGeoData(parsed);
        setLoadFailed(false);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error(`Unable to load location data from ${LOCATION_ASSET_URL}`, error);
        setGeoData([]);
        setLoadFailed(true);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadLocations();
    return () => controller.abort();
  }, []);

  const countries = useMemo(
    () =>
      geoData
        .map((country) => ({
          source: country,
          value: country.iso_3166_1,
          label: localizedName(country.names, language),
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
        source: region,
        value: canonicalName(region.names),
        label: localizedName(region.names, language),
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
        label: localizedName(municipality.names, language),
      })),
    [language, selectedRegion],
  );

  const countryLabel = countries.find((country) => country.value === value.country)?.label;
  const regionLabel = regions.find((region) => region.value === value.region)?.label;
  const cityLabel = cities.find((city) => city.value === value.city)?.label;

  useEffect(() => {
    if (isLoading || loadFailed) return;

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
  }, [cities, isLoading, loadFailed, onChange, selectedCountry, selectedRegion, value]);

  const unavailable = isLoading || loadFailed || geoData.length === 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label={t("filter.country")} icon={<Map className="h-3.5 w-3.5" />} locked={false}>
        <Select
          key={`country-${language}-${geoData.length}`}
          disabled={unavailable}
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