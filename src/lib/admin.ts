import { supabase } from "@/integrations/supabase/client";

/** Delete a listing and its photo rows (admins and the author). */
export async function deleteListingAsAdmin(listingId: string) {
  const { error: photoError } = await supabase
    .from("listing_photos")
    .delete()
    .eq("listing_id", listingId);
  if (photoError) throw photoError;

  const { error } = await supabase.from("listings").delete().eq("id", listingId);
  if (error) throw error;
}

/** Ban or unban an account. Banned accounts cannot post ads or send messages. */
export async function setUserBanned(userId: string, banned: boolean, reason?: string) {
  const { error } = await supabase
    .from("profiles")
    .update({
      banned_at: banned ? new Date().toISOString() : null,
      ban_reason: banned ? (reason ?? "Banned by an administrator") : null,
    })
    .eq("id", userId);
  if (error) throw error;
}
