import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Ban, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { deleteListingAsAdmin, setUserBanned } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Pending = "delete" | "ban" | null;

/**
 * Admin-only context menu shown in place on the property details page.
 * Renders nothing for everyone else.
 */
export function AdminListingActions({
  listingId,
  authorId,
}: {
  listingId: string;
  authorId: string;
}) {
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);

  if (!isAdmin) return null;

  async function confirm() {
    setBusy(true);
    try {
      if (pending === "delete") {
        await deleteListingAsAdmin(listingId);
        toast.success("Listing deleted");
        setPending(null);
        navigate({ to: "/" });
        return;
      }
      if (pending === "ban") {
        await setUserBanned(authorId, true, "Banned from a listing page");
        toast.success("Account banned", {
          description: "They can no longer post ads or send messages.",
        });
      }
      setPending(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Admin actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Moderation</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setPending("delete")}>
            <Trash2 className="h-4 w-4" /> Delete this listing
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setPending("ban")}>
            <Ban className="h-4 w-4" /> Ban the author
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending === "delete" ? "Delete this listing?" : "Ban this account?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending === "delete"
                ? "The ad and its photos are removed immediately. This cannot be undone."
                : "The author is blocked from posting new ads and sending messages until you unban them."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirm();
              }}
              disabled={busy}
            >
              {busy ? "Working…" : pending === "delete" ? "Delete" : "Ban account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
