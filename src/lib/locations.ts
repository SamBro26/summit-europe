import divisions from "@/data/euroDivisions.json";
import { useI18n } from "@/lib/i18n";

type Names = Record<string, string>;
type RawMunicipality = { names: Names };
type RawRegion = { names: Names; municipalities?: RawMunicipality[] };
type RawCountry = { iso_3166_1: string; names: Names; regions?: RawRegion[] };

const DATA = divisions as unknown as RawCountry[];

export type Region = { name: string; cities: string[] };
export type Country = { code: string; name: string; flag: string; regions: Region[] };

const flagOf = (code: string) =>
  code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

const pick = (names: Names, lang: string | null | undefined) =>
  (lang ? names[lang] : undefined) ?? names["en"] ?? Object.values(names)[0] ?? "";

export const COUNTRIES: Country[] = DATA.map((c) => ({
  code: c.iso_3166_1,
  name: pick(c.names, "en"),
  flag: flagOf(c.iso_3166_1),
  regions: (c.regions ?? []).map((r) => ({
    name: pick(r.names, "en"),
    cities: (r.municipalities ?? []).map((m) => pick(m.names, "en")),
  })),
}));

export const getCountry = (code: string) => COUNTRIES.find((c) => c.code === code);

const rawCountry = (code: string) => DATA.find((c) => c.iso_3166_1 === code);
const rawRegion = (code: string, regionEn: string) =>
  (rawCountry(code)?.regions ?? []).find((r) => pick(r.names, "en") === regionEn);

/** Localized display names — stored values stay canonical English. */
export const countryName = (code: string | null | undefined, lang?: string | null) => {
  if (!code) return "";
  const c = rawCountry(code);
  return c ? pick(c.names, lang) : code;
};

export const regionName = (
  code: string | null | undefined,
  regionEn: string | null | undefined,
  lang?: string | null,
) => {
  if (!regionEn) return "";
  if (!code) return regionEn;
  const r = rawRegion(code, regionEn);
  return r ? pick(r.names, lang) : regionEn;
};

export const cityName = (
  code: string | null | undefined,
  regionEn: string | null | undefined,
  cityEn: string | null | undefined,
  lang?: string | null,
) => {
  if (!cityEn) return "";
  if (!code || !regionEn) return cityEn;
  const m = (rawRegion(code, regionEn)?.municipalities ?? []).find(
    (x) => pick(x.names, "en") === cityEn,
  );
  return m ? pick(m.names, lang) : cityEn;
};

/** Hook that re-renders with the active app language. */
export function useLocationNames() {
  const { language } = useI18n();
  return {
    language,
    countryName: (code: string | null | undefined) => countryName(code, language),
    regionName: (code: string | null | undefined, region: string | null | undefined) =>
      regionName(code, region, language),
    cityName: (
      code: string | null | undefined,
      region: string | null | undefined,
      city: string | null | undefined,
    ) => cityName(code, region, city, language),
    countryOptions: COUNTRIES.map((c) => ({
      code: c.code,
      flag: c.flag,
      label: countryName(c.code, language),
    })).sort((a, b) => a.label.localeCompare(b.label)),
    regionOptions: (code: string | null | undefined) =>
      code
        ? regionsFor(code).map((r) => ({ value: r.name, label: regionName(code, r.name, language) }))
        : [],
    cityOptions: (code: string | null | undefined, region: string | null | undefined) =>
      code && region
        ? (regionsFor(code).find((r) => r.name === region)?.cities ?? []).map((city) => ({
            value: city,
            label: cityName(code, region, city, language),
          }))
        : [],
  };
}

export const DIAL_CODES: Record<string, string> = {
  FR: "+33",
  DE: "+49",
  ES: "+34",
  IT: "+39",
  BE: "+32",
  NL: "+31",
  IE: "+353",
  PT: "+351",
  AT: "+43",
  GR: "+30",
  CY: "+357",
  EE: "+372",
  FI: "+358",
  LV: "+371",
  LT: "+370",
  LU: "+352",
  MT: "+356",
  SK: "+421",
  SI: "+386",
  HR: "+385",
  BG: "+359",
  AD: "+376",
  MC: "+377",
  SM: "+378",
  VA: "+379",
};

export const DIAL_OPTIONS = COUNTRIES.map((c) => ({
  code: c.code,
  flag: c.flag,
  name: c.name,
  dial: DIAL_CODES[c.code] ?? "+",
}));

/** Regions from the dataset, with a smart placeholder when a country has none. */
export const regionsFor = (code: string): Region[] => {
  const country = getCountry(code);
  if (!country) return [];
  if (country.regions.length) return country.regions;
  return [
    { name: `${country.name} — Capital Area`, cities: ["Capital District", "Inner Suburbs"] },
    { name: `${country.name} — North`, cities: ["Northern Hub", "Coastal North"] },
    { name: `${country.name} — South`, cities: ["Southern Hub", "Coastal South"] },
  ];
};
