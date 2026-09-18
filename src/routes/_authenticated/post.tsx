import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadListingPhoto } from "@/lib/listings";
import { LocationFilter, type LocationValue } from "@/components/LocationFilter";
import { PhoneInput } from "@/components/PhoneInput";
import { PhotoUploader } from "@/components/PhotoUploader";
import { AD_KINDS, PROPERTY_TYPES, TRANSACTION_TYPES, type AdKind } from "@/lib/property";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useT, type TranslationKey } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/post")({
  head: () => ({
    meta: [
      { title: "Post an ad — FindMe RealEstate" },
      {
        name: "description",
        content: "Publish a property offer or a search request anywhere in the Eurozone, for free.",
      },
      { property: "og:title", content: "Post an ad — FindMe RealEstate" },
      {
        property: "og:description",
        content: "Publish a property offer or a search request anywhere in the Eurozone, for free.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PostWizard,
});

const STEPS: TranslationKey[] = ["post.step.adType", "post.step.property", "post.step.location", "post.step.details", "post.step.photos"];

const detailsSchema = z.object({
  price: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d{1,9}([.,]\d{1,2})?$/.test(v) && Number(v.replace(",", ".")) > 0), {
      message: "Enter a valid price in euro",
    }),
  description: z.string().trim().max(4000, "Description must be under 4000 characters"),
});

function PostWizard() {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<AdKind | null>(null);
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationValue>({ country: null, region: null, city: null });
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const locationComplete = Boolean(location.country && location.region && location.city);
  const detailsValid = detailsSchema.safeParse({ price, description }).success;

  const canNext =
    step === 0
      ? Boolean(kind)
      : step === 1
        ? Boolean(propertyType && transaction)
        : step === 2
          ? locationComplete
          : step === 3
            ? detailsValid
            : true;

  async function addPhotos(files: File[]) {
    if (!user) return;
    setUploading(true);
    try {
      const added: string[] = [];
      for (const file of files) added.push(await uploadListingPhoto(user.id, file));
      setPhotos((prev) => [...prev, ...added]);
    } catch {
      toast.error(t("post.photoUploadError"));
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(path: string) {
    setPhotos((prev) => prev.filter((p) => p !== path));
    await supabase.storage.from("listing-photos").remove([path]);
  }

  async function publish() {
    if (!user || !kind || !propertyType || !transaction || !locationComplete) return;
    if (kind === "supply" && photos.length === 0) {
      toast.error(t("post.photosRequired"));
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("listings")
      .insert({
        author_id: user.id,
        kind,
        property_type: propertyType as never,
        transaction_type: transaction as never,
        country_code: location.country!,
        region: location.region!,
        city: location.city!,
        price_eur: price ? Number(price.replace(",", ".")) : null,
        description: description.trim() || null,
        phone: phone.trim().length > 4 ? phone.trim() : null,
      })
      .select("id")
      .single();

    if (error || !data) {
      setSaving(false);
      toast.error(t("post.publishError"));
      return;
    }

    if (photos.length) {
      await supabase.from("listing_photos").insert(
        photos.map((p, i) => ({ listing_id: data.id, url: p, storage_path: p, sort_order: i })),
      );
    }
    setSaving(false);
    toast.success(t("post.published"));
    navigate({ to: "/listings/$id", params: { id: data.id } });
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-brand-gradient px-5 pt-6 pb-12 sm:px-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {t("common.home")}
          </Link>
          <span className="text-sm text-primary-foreground/80">
            {t("post.step")} {step + 1} {t("post.of")} {STEPS.length}
          </span>
        </div>
        <div className="mx-auto mt-6 max-w-3xl">
          <h1 className="text-2xl font-semibold text-primary-foreground">{t(STEPS[step] ?? "post.step.adType")}</h1>
          <div className="mt-4 flex gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full",
                  i <= step ? "bg-accent" : "bg-primary-foreground/25",
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-6 w-full max-w-3xl px-5 sm:px-10">
        <section className="shadow-soft rounded-2xl border border-border bg-card p-5 sm:p-6">
          {step === 0 && (
            <div className="grid gap-3">
              {AD_KINDS.map((k) => (
                <button
                  key={k.value}
                  type="button"
                  onClick={() => setKind(k.value)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    kind === k.value ? "border-primary bg-secondary/60" : "border-border hover:bg-secondary/40",
                  )}
                >
                  <p className="font-medium">{t(k.value === "supply" ? "post.offer" : "post.request")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t(k.value === "supply" ? "post.offerHint" : "post.requestHint")}</p>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-xs tracking-wide text-muted-foreground uppercase">
                  {t("post.propertyType")}
                </Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {PROPERTY_TYPES.map((p) => (
                    <Choice
                      key={p.value}
                      label={t(`prop.${p.value}` as TranslationKey)}
                      active={propertyType === p.value}
                      onClick={() => setPropertyType(p.value)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs tracking-wide text-muted-foreground uppercase">
                  {t("post.transaction")}
                </Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {TRANSACTION_TYPES.map((transactionOption) => (
                    <Choice
                      key={transactionOption.value}
                      label={t(`tx.${transactionOption.value}` as TranslationKey)}
                      active={transaction === transactionOption.value}
                      onClick={() => setTransaction(transactionOption.value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <LocationFilter value={location} onChange={setLocation} />
              <p className="text-sm text-muted-foreground">
                {locationComplete ? t("post.locationSet") : t("post.locationPrompt")}
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="price">{t("post.priceOptional")}</Label>
                <Input
                  id="price"
                  inputMode="decimal"
                  placeholder="350000"
                  value={price}
                  maxLength={12}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">{t("post.descriptionOptional")}</Label>
                <Textarea
                  id="description"
                  rows={5}
                  maxLength={4000}
                  placeholder={t("post.descriptionPlaceholder")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("post.phoneOptional")}</Label>
                <PhoneInput value={phone} onChange={setPhone} defaultCountry={location.country} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {kind === "supply"
                  ? t("post.photosRequired")
                  : t("post.photosOptional")}
              </p>
              <PhotoUploader
                paths={photos}
                onAdd={addPhotos}
                onRemove={removePhoto}
                busy={uploading}
              />
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <Button
              variant="ghost"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              {t("common.back")}
            </Button>
            {step < STEPS.length - 1 ? (
              <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)} className="gap-2">
                {t("post.next")} <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                disabled={saving || uploading || (kind === "supply" && photos.length === 0)}
                onClick={publish}
                className="gap-2"
              >
                <Check className="h-4 w-4" /> {t("post.publish")}
              </Button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Choice({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
        active ? "border-primary bg-secondary/60 font-medium" : "border-border hover:bg-secondary/40",
      )}
    >
      {label}
    </button>
  );
}
