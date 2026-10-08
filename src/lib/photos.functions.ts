import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Signs URLs only for files attached to a published listing.
export const signPublishedPhotos = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ paths: z.array(z.string().min(1).max(500)).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const paths = Array.from(new Set(data.paths));
    if (!paths.length) return {} as Record<string, string>;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("listing_photos")
      .select("storage_path")
      .in("storage_path", paths);
    const allowed = (rows ?? []).map((r) => r.storage_path).filter(Boolean) as string[];
    if (!allowed.length) return {} as Record<string, string>;
    const { data: signed } = await supabaseAdmin.storage
      .from("listing-photos")
      .createSignedUrls(allowed, 60 * 60);
    const map: Record<string, string> = {};
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
    }
    return map;
  });
