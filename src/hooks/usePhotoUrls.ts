import { useEffect, useState } from "react";
import { signedPhotoUrls } from "@/lib/listings";

/** Resolves storage paths to temporary viewable URLs. */
export function usePhotoUrls(paths: (string | null)[]) {
  const key = paths.filter(Boolean).join("|");
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const list = key ? key.split("|") : [];
    if (!list.length) {
      setUrls({});
      return;
    }
    signedPhotoUrls(list).then((map) => {
      if (active) setUrls(map);
    });
    return () => {
      active = false;
    };
  }, [key]);

  return urls;
}
