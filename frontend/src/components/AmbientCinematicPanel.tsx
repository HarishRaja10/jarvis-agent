import { useMemo } from "react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";

type AmbientCinematicPanelProps = {
  desktopSrc: string;
  mobileSrc?: string;
  className?: string;
  children?: ReactNode;
};

export function AmbientCinematicPanel({ desktopSrc, mobileSrc, className, children }: AmbientCinematicPanelProps) {
  const src = useMemo(() => {
    if (!mobileSrc) return desktopSrc;
    return typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches ? mobileSrc : desktopSrc;
  }, [desktopSrc, mobileSrc]);

  return (
    <section className={cn("relative isolate overflow-hidden border-y border-cyan-core/20 bg-black shadow-neon-strong", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(55,225,255,0.18),transparent_36%),linear-gradient(145deg,rgba(45,242,161,0.08),transparent_42%,rgba(246,183,60,0.07))]" />
      <video
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-[0.88]"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        src={src}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent,rgba(0,0,0,0.12)_42%,rgba(0,0,0,0.72)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-background/72" />
      <div className="core-grid absolute inset-0 opacity-25" />
      {children}
    </section>
  );
}
