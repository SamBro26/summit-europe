import { useRef } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { usePhotoUrls } from "@/hooks/usePhotoUrls";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export function PhotoUploader({
  paths,
  onAdd,
  onRemove,
  busy,
}: {
  paths: string[];
  onAdd: (files: File[]) => void;
  onRemove: (path: string) => void;
  busy?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const urls = usePhotoUrls(paths);
  const t = useT();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {paths.map((p) => (
          <div key={p} className="group relative aspect-square overflow-hidden rounded-xl border border-border">
            {urls[p] ? (
              <img src={urls[p]} alt={t("common.listingPhoto")} className="h-full w-full object-cover" />
            ) : (
              <div className="bg-secondary h-full w-full animate-pulse" />
            )}
            <button
              type="button"
              onClick={() => onRemove(p)}
              aria-label={t("photo.delete")}
              className="bg-background/90 absolute top-1.5 right-1.5 rounded-lg p-1.5 text-destructive opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="bg-secondary/40 hover:bg-secondary flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted-foreground transition-colors"
        >
          <ImagePlus className="h-5 w-5" />
          <span className="text-xs">{t("post.addPhoto")}</span>
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []).filter((f) => f.size <= 10 * 1024 * 1024);
          if (files.length) onAdd(files);
          e.target.value = "";
        }}
      />
      {busy && <p className="text-xs text-muted-foreground">{t("post.uploading")}</p>}
      <Button type="button" variant="ghost" size="sm" className="hidden" />
    </div>
  );
}
