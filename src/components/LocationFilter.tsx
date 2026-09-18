import { useEffect, useMemo } from "react";
import { Building2, Lock, MapPin, Map } from "lucide-react";
import {
  LOCATION_DATA,
  localizedLocationName,
} from "@/lib/locations";
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

export function LocationFilter({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
}) {
  const { language, t } = useI18n();

  const countries = useMemo(
    () =>
      LOCATION_DATA.map((country) => ({
        value: country.iso_3166_1,
        flag: flagOf(country.iso_3166_1),
        label: localizedLocationName(country.names, language),
      })).sort((a, b) => a.label.localeCompare(b.label, language ?? "en")),
    [language],
  );

  const selectedCountry = useMemo(
    () => LOCATION_DATA.find((country) => country.iso_3166_1 === value.country),
    [value.country],
  );

  const regions = useMemo(
    () =>
      (selectedCountry?.regions ?? []).map((region) => ({
        source: region,
        value: localizedLocationName(region.names, "en"),
        label: localizedLocationName(region.names, language),
      })),
    [language, selectedCountry],
  );

  const selectedRegion = useMemo(
    () => regions.find((region) => region.value === value.region)?.source,
    [regions, value.region],
  );

  const cities = useMemo(
    () =>
      (selectedRegion?.municipalities ?? []).map((municipality) => ({
        value: localizedLocationName(municipality.names, "en"),
        label: localizedLocationName(municipality.names, language),
      })),
    [language, selectedRegion],
  );

  const countryLabel = countries.find((country) => country.value === value.country)?.label;
  const regionLabel = regions.find((region) => region.value === value.region)?.label;
  const cityLabel = cities.find((city) => city.value === value.city)?.label;

  useEffect(() => {
    if (value.region && !regions.some((region) => region.value === value.region)) {
      onChange({ country: value.country, region: null, city: null });
      return;
    }
    if (value.city && !cities.some((city) => city.value === value.city)) {
      onChange({ ...value, city: null });
    }
  }, [cities, onChange, regions, value]);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label={t("filter.country")} icon={<Map className="h-3.5 w-3.5" />} locked={false}>
        <Select
          key={`country-${language ?? "en"}`}
          {...(value.country ? { value: value.country } : {})}
          onValueChange={(country) => onChange({ country, region: null, city: null })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("filter.selectCountry")}>
              {countryLabel ? (
                <span><span className="mr-2">{flagOf(value.country ?? "")}</span>{countryLabel}</span>
              ) : undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {countries.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                <span className="mr-2">{c.flag}</span>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label={t("filter.region")}
        icon={<MapPin className="h-3.5 w-3.5" />}
        locked={!value.country}
      >
        <Select
          key={`region-${language ?? "en"}-${value.country ?? "none"}`}
          disabled={!value.country}
          {...(value.region ? { value: value.region } : {})}
          onValueChange={(region) => onChange({ ...value, region, city: null })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={value.country ? t("filter.selectRegion") : t("filter.countryFirst")}>
              {regionLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {regions.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field
        label={t("filter.city")}
        icon={<Building2 className="h-3.5 w-3.5" />}
        locked={!value.region}
      >
        <Select
          key={`city-${language ?? "en"}-${value.country ?? "none"}-${value.region ?? "none"}`}
          disabled={!value.region}
          {...(value.city ? { value: value.city } : {})}
          onValueChange={(city) => onChange({ ...value, city })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={value.region ? t("filter.selectCity") : t("filter.regionFirst")}>
              {cityLabel}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {cities.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
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
  icon: React.ReactNode;
  locked: boolean;
  children: React.ReactNode;
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
