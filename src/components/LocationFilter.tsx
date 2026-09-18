import { Building2, Lock, MapPin, Map } from "lucide-react";
import { useLocationNames } from "@/lib/locations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n";

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
  const t = useT();
  const loc = useLocationNames();
  const countries = loc.countryOptions;
  const regions = loc.regionOptions(value.country);
  const cities = loc.cityOptions(value.country, value.region);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label={t("filter.country")} icon={<Map className="h-3.5 w-3.5" />} locked={false}>
        <Select
          {...(value.country ? { value: value.country } : {})}
          onValueChange={(country) => onChange({ country, region: null, city: null })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("filter.selectCountry")} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="mr-2">{c.flag}</span>
                {c.name}
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
          disabled={!value.country}
          {...(value.region ? { value: value.region } : {})}
          onValueChange={(region) => onChange({ ...value, region, city: null })}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={value.country ? t("filter.selectRegion") : t("filter.countryFirst")}
            />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {regions.map((r) => (
              <SelectItem key={r.name} value={r.name}>
                {r.name}
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
          disabled={!value.region}
          {...(value.city ? { value: value.city } : {})}
          onValueChange={(city) => onChange({ ...value, city })}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={value.region ? t("filter.selectCity") : t("filter.regionFirst")}
            />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
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
