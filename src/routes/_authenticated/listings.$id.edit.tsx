import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchListing, uploadListingPhoto } from "@/lib/listings";
import { getCountry } from "@/lib/locations";
import { PhoneInput } from "@/components/PhoneInput";
import { PhotoUploader } from "@/components/PhotoUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useT, type TranslationKey } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/listings/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit your ad — FindMe RealEstate" },
      {
        name: "description",
        content: "Update the price, description, phone number and photos of your property ad.",
      },
      { property: "og:title", content: "Edit your ad — FindMe RealEstate" },
      {
        property: "og:description",
        content: "Update the price, description, phone number and photos of your property ad.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditListing,
});

function EditListing() {
  const t = useT();
  const { id } = useParams({ from: "/_authenticated/listings/$id/edit" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => fetchListing(id),
  });

  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [photos, setPhotos] = useState<{ id?: string; path: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!listing || ready) return;
    setPrice(listing.price_eur != null ? String(listing.price_eur) : "");
    setDescription(listing.description ?? "");
    setPhone(listing.phone ?? "");
    setPhotos(
      [...(listing.listing_photos ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((p) => ({ id: p.id, path: p.storage_path ?? p.url })),
    );
    setReady(true);
  }, [listing, ready]);

  if (isLoading) {
    return <p className="p-10 text-center text-sm text-muted-foreground">{t("edit.loading")}</p>;
  }

  if (!listing || (user && listing.author_id !== user.id)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-5">
        <h1 className="text-xl font-semibold">{t("edit.denied")}</h1>
        <Button asChild>
          <Link to="/">{t("listing.backHome")}</Link>
        </Button>
      </div>
    );
  }

  const country = getCountry(listing.country_code);

  async function addPhotos(files: File[]) {
    if (!user) return;
    setUploading(true);
    try {
      const rows: { id?: string; path: string }[] = [];
      for (const file of files) {
        const path = await uploadListingPhoto(user.id, file);
        const { data } = await supabase
          .from("listing_photos")
          .insert({
            listing_id: id,
            url: path,
            storage_path: path,
            sort_order: photos.length + rows.length,
          })
          .select("id")
          .single();
        rows.push({ ...(data?.id ? { id: data.id } : {}), path });
      }
      setPhotos((prev) => [...prev, ...rows]);
    } catch {
      toast.error(t("edit.photoError"));
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(path: string) {
    const row = photos.find((p) => p.path === path);
    setPhotos((prev) => prev.filter((p) => p.path !== path));
    if (row?.id) await supabase.from("listing_photos").delete().eq("id", row.id);
    await supabase.storage.from("listing-photos").remove([path]);
  }

  async function save() {
    if (!listing) return;
    if (listing.kind === "supply" && photos.length === 0) {
      toast.error(t("edit.photoRequired"));
      return;
    }
    if (price && !/^\d{1,9}([.,]\d{1,2})?$/.test(price.trim())) {
      toast.error(t("edit.invalidPrice"));
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("listings")
      .update({
        price_eur: price ? Number(price.replace(",", ".")) : null,
        description: description.trim() || null,
        phone: phone.trim().length > 4 ? phone.trim() : null,
      })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error(t("edit.saveError"));
      return;
    }
    toast.success(t("edit.saved"));
    navigate({ to: "/listings/$id", params: { id } });
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-brand-gradient px-5 pt-6 pb-12 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/listings/$id"
            params={{ id }}
            className="flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {t("edit.back")}
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-primary-foreground">{t("edit.title")}</h1>
        </div>
      </header>

      <main className="mx-auto -mt-6 w-full max-w-3xl px-5 sm:px-10">
        <section className="shadow-soft space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="bg-secondary/40 rounded-xl border border-border p-4">
            <p className="flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase">
              <Lock className="h-3 w-3" /> {t("edit.locked")}
            </p>
            <p className="mt-2 text-sm">
              {t(`prop.${listing.property_type}` as TranslationKey)} · {t(`tx.${listing.transaction_type}` as TranslationKey)}
            </p>
            <p className="text-sm text-muted-foreground">
              {[listing.city, listing.region, country?.name].filter(Boolean).join(", ")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price">{t("edit.price")}</Label>
            <Input
              id="price"
              inputMode="decimal"
              value={price}
              maxLength={12}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">{t("edit.description")}</Label>
            <Textarea
              id="description"
              rows={5}
              maxLength={4000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("edit.phone")}</Label>
            <PhoneInput value={phone} onChange={setPhone} defaultCountry={listing.country_code} />
          </div>
          <div className="space-y-2">
            <Label>{t("edit.photos")}</Label>
            <PhotoUploader
              paths={photos.map((p) => p.path)}
              onAdd={addPhotos}
              onRemove={removePhoto}
              busy={uploading}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="ghost" asChild>
              <Link to="/listings/$id" params={{ id }}>
                {t("common.cancel")}
              </Link>
            </Button>
            <Button onClick={save} disabled={saving || uploading}>
              {t("common.save")}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
