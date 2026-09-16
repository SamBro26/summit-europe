export const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house_villa", label: "House / Villa" },
  { value: "chalet", label: "Chalet" },
  { value: "commercial_shop", label: "Commercial Shop" },
  { value: "building_land", label: "Building Land" },
  { value: "agricultural_land", label: "Agricultural Land" },
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number]["value"];

export const TRANSACTION_TYPES = [
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number]["value"];

export type AdKind = "supply" | "demand";

export const AD_KINDS = [
  {
    value: "supply" as const,
    label: "Offer a property",
    hint: "You have a property to sell or rent out. Photos required.",
  },
  {
    value: "demand" as const,
    label: "Post a search request",
    hint: "You are looking for a property. Photos optional.",
  },
];

export const propertyTypeLabel = (v: string) =>
  PROPERTY_TYPES.find((p) => p.value === v)?.label ?? v;
export const transactionLabel = (v: string) =>
  TRANSACTION_TYPES.find((p) => p.value === v)?.label ?? v;

export const formatEuro = (value: number | null | undefined) =>
  value == null
    ? null
    : new Intl.NumberFormat("en-IE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(value);
