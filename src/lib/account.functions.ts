import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes the signed-in user's data and login. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const must = (r: { error: unknown }) => {
      if (r.error) throw new Error((r.error as { message?: string }).message ?? "Delete failed");
    };

    const { data: listings } = await db.from("listings").select("id").eq("author_id", uid);
    const ids = (listings ?? []).map((l) => l.id);

    // Storage files in the user's folder
    const { data: files } = await db.storage.from("listing-photos").list(uid, { limit: 1000 });
    if (files?.length) await db.storage.from("listing-photos").remove(files.map((f) => `${uid}/${f.name}`));

    if (ids.length) {
      must(await db.from("listing_photos").delete().in("listing_id", ids));
      must(await db.from("listing_likes").delete().in("listing_id", ids));
      must(await db.from("listing_ratings").delete().in("listing_id", ids));
      must(await db.from("listing_reports").delete().in("listing_id", ids));
      must(await db.from("messages").delete().in("listing_id", ids));
    }
    must(await db.from("messages").delete().or(`sender_id.eq.${uid},recipient_id.eq.${uid}`));
    must(await db.from("listing_likes").delete().eq("user_id", uid));
    must(await db.from("listing_ratings").delete().eq("user_id", uid));
    must(await db.from("listing_reports").delete().eq("reporter_id", uid));
    must(await db.from("notifications").delete().eq("user_id", uid));
    if (ids.length) must(await db.from("listings").delete().in("id", ids));
    must(await db.from("user_roles").delete().eq("user_id", uid));
    must(await db.from("profiles").delete().eq("id", uid));

    const { error } = await db.auth.admin.deleteUser(uid);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
