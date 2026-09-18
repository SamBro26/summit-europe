import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Ban, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { deleteListingAsAdmin, setUserBanned } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
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
  const t = useT();
  const navigate = useNavigate();
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);

  if (!isAdmin) return null;

  async function confirm() {
    setBusy(true);
    try {
      if (pending === "delete") {
        await deleteListingAsAdmin(listingId);
        toast.success(t("admin.listingDeleted"));
        setPending(null);
        navigate({ to: "/" });
        return;
      }
      if (pending === "ban") {
        await setUserBanned(authorId, true, "Banned from a listing page");
        toast.success(t("admin.accountBanned"), {
          description: t("admin.accountBannedDescription"),
        });
      }
      setPending(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.actionFailed"));
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
            {t("admin.actions")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{t("admin.moderation")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive gap-2"
            onSelect={() => setPending("delete")}
          >
            <Trash2 className="h-4 w-4" /> {t("admin.deleteListing")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive gap-2"
            onSelect={() => setPending("ban")}
          >
            <Ban className="h-4 w-4" /> {t("admin.banAuthor")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending === "delete" ? t("admin.deleteTitle") : t("admin.banTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending === "delete"
                ? t("admin.deleteDescription")
                : t("admin.banDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirm();
              }}
              disabled={busy}
            >
              {busy ? t("admin.working") : pending === "delete" ? t("common.delete") : t("admin.banAccount")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
