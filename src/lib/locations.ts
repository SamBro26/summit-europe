export type Region = { name: string; cities: string[] };
export type Country = { code: string; name: string; flag: string; regions: Region[] };

// Phase 1: detailed data for FR / DE / ES, smart placeholders elsewhere.
export const COUNTRIES: Country[] = [
  {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    regions: [
      { name: "Île-de-France", cities: ["Paris", "Versailles", "Boulogne-Billancourt"] },
      { name: "Auvergne-Rhône-Alpes", cities: ["Lyon", "Grenoble", "Annecy"] },
      { name: "Provence-Alpes-Côte d'Azur", cities: ["Marseille", "Nice", "Aix-en-Provence"] },
      { name: "Occitanie", cities: ["Toulouse", "Montpellier", "Nîmes"] },
    ],
  },
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    regions: [
      { name: "Bavaria", cities: ["Munich", "Nuremberg", "Augsburg"] },
      { name: "Berlin", cities: ["Berlin", "Potsdam"] },
      { name: "North Rhine-Westphalia", cities: ["Cologne", "Düsseldorf", "Dortmund"] },
      { name: "Hamburg", cities: ["Hamburg"] },
    ],
  },
  {
    code: "ES",
    name: "Spain",
    flag: "🇪🇸",
    regions: [
      { name: "Catalonia", cities: ["Barcelona", "Girona", "Tarragona"] },
      { name: "Community of Madrid", cities: ["Madrid", "Alcalá de Henares"] },
      { name: "Andalusia", cities: ["Seville", "Málaga", "Granada"] },
      { name: "Valencian Community", cities: ["Valencia", "Alicante"] },
    ],
  },
  { code: "IT", name: "Italy", flag: "🇮🇹", regions: [] },
  { code: "BE", name: "Belgium", flag: "🇧🇪", regions: [] },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", regions: [] },
  { code: "IE", name: "Ireland", flag: "🇮🇪", regions: [] },
  { code: "PT", name: "Portugal", flag: "🇵🇹", regions: [] },
  { code: "AT", name: "Austria", flag: "🇦🇹", regions: [] },
  { code: "GR", name: "Greece", flag: "🇬🇷", regions: [] },
  { code: "CY", name: "Cyprus", flag: "🇨🇾", regions: [] },
  { code: "EE", name: "Estonia", flag: "🇪🇪", regions: [] },
  { code: "FI", name: "Finland", flag: "🇫🇮", regions: [] },
  { code: "LV", name: "Latvia", flag: "🇱🇻", regions: [] },
  { code: "LT", name: "Lithuania", flag: "🇱🇹", regions: [] },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", regions: [] },
  { code: "MT", name: "Malta", flag: "🇲🇹", regions: [] },
  { code: "SK", name: "Slovakia", flag: "🇸🇰", regions: [] },
  { code: "SI", name: "Slovenia", flag: "🇸🇮", regions: [] },
  { code: "HR", name: "Croatia", flag: "🇭🇷", regions: [] },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬", regions: [] },
  { code: "AD", name: "Andorra", flag: "🇦🇩", regions: [] },
  { code: "MC", name: "Monaco", flag: "🇲🇨", regions: [] },
  { code: "SM", name: "San Marino", flag: "🇸🇲", regions: [] },
  { code: "VA", name: "Vatican City", flag: "🇻🇦", regions: [] },
];

export const getCountry = (code: string) => COUNTRIES.find((c) => c.code === code);

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

// Smart placeholder hierarchy for countries without curated data.
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
