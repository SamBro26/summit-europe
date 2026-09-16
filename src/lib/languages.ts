export type Language = {
  code: string;
  name: string;
  native: string;
  flag: string;
};

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italian", native: "Italiano", flag: "🇮🇹" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
  { code: "nl", name: "Dutch", native: "Nederlands", flag: "🇳🇱" },
  { code: "el", name: "Greek", native: "Ελληνικά", flag: "🇬🇷" },
  { code: "ga", name: "Irish", native: "Gaeilge", flag: "🇮🇪" },
  { code: "fi", name: "Finnish", native: "Suomi", flag: "🇫🇮" },
  { code: "et", name: "Estonian", native: "Eesti", flag: "🇪🇪" },
  { code: "lv", name: "Latvian", native: "Latviešu", flag: "🇱🇻" },
  { code: "lt", name: "Lithuanian", native: "Lietuvių", flag: "🇱🇹" },
  { code: "mt", name: "Maltese", native: "Malti", flag: "🇲🇹" },
  { code: "sk", name: "Slovak", native: "Slovenčina", flag: "🇸🇰" },
  { code: "sl", name: "Slovenian", native: "Slovenščina", flag: "🇸🇮" },
  { code: "bg", name: "Bulgarian", native: "Български", flag: "🇧🇬" },
  { code: "sv", name: "Swedish", native: "Svenska", flag: "🇸🇪" },
  { code: "tr", name: "Turkish", native: "Türkçe", flag: "🇹🇷" },
  { code: "lb", name: "Luxembourgish", native: "Lëtzebuergesch", flag: "🇱🇺" },
  { code: "ca", name: "Catalan", native: "Català", flag: "🏴" },
  { code: "hr", name: "Croatian", native: "Hrvatski", flag: "🇭🇷" },
];

export const getLanguage = (code: string | null): Language =>
  LANGUAGES.find((l) => l.code === code) ?? (LANGUAGES[0] as Language);
