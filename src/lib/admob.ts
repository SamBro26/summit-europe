/** Production AdMob IDs. The App ID belongs in the native Android app's AndroidManifest.xml. */
export const ADMOB_APP_ID = "ca-app-pub-5516554712058767~8604467991";
export const ADMOB_BANNER_ID =
  (import.meta.env.VITE_ADMOB_BANNER_ID as string | undefined) || "ca-app-pub-5516554712058767/155562148";

type AndroidBridge = { showBanner?: (unitId: string) => void; hideBanner?: () => void };

function bridge(): AndroidBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Android?: AndroidBridge }).Android;
}

/** Asks the native Android wrapper to show/hide its AdMob banner. No-op on the web. */
export function syncNativeBanner(show: boolean) {
  const android = bridge();
  if (!android) return false;
  if (show) android.showBanner?.(ADMOB_BANNER_ID);
  else android.hideBanner?.();
  return true;
}
