import { useMemo } from "react";
import { DIAL_OPTIONS } from "@/lib/locations";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Value is stored as a single E.164-ish string, e.g. "+33 612345678". */
export function PhoneInput({
  value,
  onChange,
  defaultCountry,
}: {
  value: string;
  onChange: (next: string) => void;
  defaultCountry?: string | null;
}) {
  const fallbackDial =
    DIAL_OPTIONS.find((o) => o.code === defaultCountry)?.dial ?? DIAL_OPTIONS[0]!.dial;

  const { dial, rest } = useMemo(() => {
    const match = DIAL_OPTIONS.map((o) => o.dial)
      .sort((a, b) => b.length - a.length)
      .find((d) => value.startsWith(d));
    if (!match) return { dial: fallbackDial, rest: value.replace(/^\+/, "") };
    return { dial: match, rest: value.slice(match.length).trim() };
  }, [value, fallbackDial]);

  const seen = new Set<string>();
  const options = DIAL_OPTIONS.filter((o) => {
    if (seen.has(o.dial)) return false;
    seen.add(o.dial);
    return true;
  });

  return (
    <div className="flex gap-2">
      <Select value={dial} onValueChange={(d) => onChange(rest ? `${d} ${rest}` : d)}>
        <SelectTrigger className="w-32 shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((o) => (
            <SelectItem key={o.code} value={o.dial}>
              <span className="mr-2">{o.flag}</span>
              {o.dial}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        inputMode="tel"
        placeholder="612 345 678"
        maxLength={20}
        value={rest}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d\s]/g, "");
          onChange(digits ? `${dial} ${digits.trim()}` : dial);
        }}
      />
    </div>
  );
}
