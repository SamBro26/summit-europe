import { Building2, Lock, MapPin, Map } from "lucide-react";
import { COUNTRIES, regionsFor } from "@/lib/locations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
  const regions = value.country ? regionsFor(value.country) : [];
  const cities = regions.find((r) => r.name === value.region)?.cities ?? [];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Country" icon={<Map className="h-3.5 w-3.5" />} locked={false}>
        <Select
          value={value.country ?? undefined}
          onValueChange={(country) => onChange({ country, region: null, city: null })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a country" />
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
        label="Region / State"
        icon={<MapPin className="h-3.5 w-3.5" />}
        locked={!value.country}
      >
        <Select
          disabled={!value.country}
          value={value.region ?? undefined}
          onValueChange={(region) => onChange({ ...value, region, city: null })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={value.country ? "Select a region" : "Select country first"} />
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
        label="City / Municipality"
        icon={<Building2 className="h-3.5 w-3.5" />}
        locked={!value.region}
      >
        <Select
          disabled={!value.region}
          value={value.city ?? undefined}
          onValueChange={(city) => onChange({ ...value, city })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={value.region ? "Select a city" : "Select region first"} />
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
