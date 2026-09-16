import { Home } from "lucide-react";

export function SplashScreen() {
  return (
    <div className="bg-brand-gradient fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden">
      <div className="relative flex items-center justify-center">
        <span className="animate-splash-ring absolute h-32 w-32 rounded-full border border-primary-foreground/30" />
        <span
          className="animate-splash-ring absolute h-32 w-32 rounded-full border border-primary-foreground/20"
          style={{ animationDelay: "0.8s" }}
        />
        <div className="animate-splash-rise flex h-24 w-24 items-center justify-center rounded-3xl bg-primary-foreground/10 backdrop-blur-sm">
          <Home className="h-11 w-11 text-primary-foreground" strokeWidth={1.4} />
        </div>
      </div>

      <div
        className="animate-splash-rise mt-10 text-center"
        style={{ animationDelay: "0.25s" }}
      >
        <h1 className="font-display text-3xl font-semibold tracking-tight text-primary-foreground sm:text-4xl">
          FindMe <span className="text-accent">RealEstate</span>
        </h1>
        <p className="mt-3 text-sm tracking-[0.3em] text-primary-foreground/70 uppercase">
          Eurozone Property Network
        </p>
      </div>

      <div className="mt-12 h-px w-40 overflow-hidden bg-primary-foreground/20">
        <div className="animate-shimmer-line h-full w-full bg-accent" />
      </div>
    </div>
  );
}
