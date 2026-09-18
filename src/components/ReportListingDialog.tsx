import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useT, type TranslationKey } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REASONS = [
  "fraud",
  "wrong_info",
  "duplicate",
  "offensive",
  "sold",
  "other",
];

export function ReportListingDialog({ listingId }: { listingId: string }) {
  const t = useT();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!user) {
      toast.error(t("report.signIn"));
      return;
    }
    if (!reason) {
      toast.error(t("report.chooseReason"));
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("listing_reports").insert({
      listing_id: listingId,
      reporter_id: user.id,
      reason,
      details: details.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOpen(false);
    setReason("");
    setDetails("");
    toast.success(t("report.sent"), {
      description: t("report.sentDescription"),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Flag className="h-4 w-4" />
          {t("listing.report")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("report.title")}</DialogTitle>
          <DialogDescription>
            {t("report.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("report.reason")}</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder={t("report.selectReason")} />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((reasonValue) => (
                  <SelectItem key={reasonValue} value={reasonValue}>
                    {t(`report.reason.${reasonValue}` as TranslationKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-details">{t("report.details")}</Label>
            <Textarea
              id="report-details"
              value={details}
              maxLength={1000}
              rows={4}
              placeholder={t("report.detailsPlaceholder")}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? t("report.sending") : t("report.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
