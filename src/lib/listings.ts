import { supabase } from "@/integrations/supabase/client";

export type Photo = { id: string; url: string; storage_path: string | null; sort_order: number };

export type Listing = {
  id: string;
  author_id: string;
  kind: "supply" | "demand";
  property_type: string;
  transaction_type: string;
  country_code: string;
  region: string;
  city: string;
  price_eur: number | null;
  description: string | null;
  phone: string | null;
  created_at: string;
  views_count?: number | null;
};

export type ListingWithPhotos = Listing & { listing_photos: Photo[] };

const SELECT = "*, listing_photos(id, url, storage_path, sort_order)";

export async function fetchListings(params: {
  kind: "supply" | "demand";
  country?: string | null;
  region?: string | null;
  city?: string | null;
  transaction?: "sale" | "rent" | null;
}) {
  let q = supabase
    .from("listings")
    .select(SELECT)
    .eq("kind", params.kind)
    .order("created_at", { ascending: false })
    .limit(50);
  if (params.country) q = q.eq("country_code", params.country);
  if (params.region) q = q.eq("region", params.region);
  if (params.city) q = q.eq("city", params.city);
  if (params.transaction) q = q.eq("transaction_type", params.transaction);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as ListingWithPhotos[];
}

export async function fetchListing(id: string) {
  const { data, error } = await supabase.from("listings").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as ListingWithPhotos) ?? null;
}

export async function signedPhotoUrl(path: string) {
  const map = await signedPhotoUrls([path]);
  return map[path] ?? "";
}

// Published photos are signed server-side; own unpublished uploads via own-folder access.
export async function signedPhotoUrls(paths: string[]) {
  if (!paths.length) return {} as Record<string, string>;
  const { signPublishedPhotos } = await import("./photos.functions");
  const map: Record<string, string> = { ...(await signPublishedPhotos({ data: { paths } })) };
  const missing = paths.filter((p) => !map[p]);
  if (missing.length) {
    const { data } = await supabase.storage.from("listing-photos").createSignedUrls(missing, 60 * 60);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
    }
  }
  return map;
}

export async function uploadListingPhoto(userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("listing-photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}
