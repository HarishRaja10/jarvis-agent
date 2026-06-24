import { useEffect, useMemo, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "../lib/utils";

type ScrollCinematicVideoProps = {
  desktopSrc: string;
  mobileSrc?: string;
  poster?: string;
  className?: string;
  overlay?: "core" | "book" | "panels";
  fit?: "cover" | "contain";
};

export function ScrollCinematicVideo({
  desktopSrc,
  mobileSrc,
  poster,
  className,
  overlay = "core",
  fit = "cover"
}: ScrollCinematicVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.88, 1], [0.7, 1, 1, 0.78]);
  const scale = useTransform(scrollYProgress, [0, 0.55, 1], [1.05, 1, 1.08]);
  const srcSet = useMemo(() => {
    if (!mobileSrc) return desktopSrc;
    return typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches ? mobileSrc : desktopSrc;
  }, [desktopSrc, mobileSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    let frame = 0;
    const seedFrame = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      video.currentTime = Math.min(video.duration * 0.18, Math.max(video.duration - 0.05, 0));
    };
    video.addEventListener("loadedmetadata", seedFrame);

    const unsubscribe = scrollYProgress.on("change", (progress) => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const clamped = Math.min(1, Math.max(0, progress));
        video.currentTime = clamped * Math.max(video.duration - 0.05, 0);
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      video.removeEventListener("loadedmetadata", seedFrame);
      unsubscribe();
    };
  }, [scrollYProgress]);

  return (
    <div ref={containerRef} className={cn("relative isolate overflow-hidden bg-black", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(55,225,255,0.24),transparent_30%),radial-gradient(circle_at_45%_70%,rgba(45,242,161,0.14),transparent_28%),linear-gradient(135deg,rgba(55,225,255,0.10),transparent_35%,rgba(246,183,60,0.08))]" />
      <div className="core-grid absolute inset-0 opacity-35" />
      <motion.video
        ref={videoRef}
        aria-hidden="true"
        className={cn("absolute inset-0 h-full w-full", fit === "cover" ? "object-cover" : "object-contain")}
        muted
        playsInline
        preload="metadata"
        poster={poster}
        src={srcSet}
        style={{ opacity, scale }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,transparent,rgba(0,0,0,0.18)_42%,rgba(0,0,0,0.72)_100%)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/70" />
      {overlay === "core" ? <CoreOverlayLines /> : null}
      {overlay === "book" ? <BookOverlayLines /> : null}
      {overlay === "panels" ? <PanelOverlayLines /> : null}
    </div>
  );
}

function CoreOverlayLines() {
  return (
    <>
      <div className="absolute left-1/2 top-1/2 h-[68%] w-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-core/20 shadow-neon" />
      <div className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rotate-45 border border-emerald-core/20" />
    </>
  );
}

function BookOverlayLines() {
  return (
    <div className="absolute inset-x-[12%] top-[18%] h-[58%] rounded-md border border-cyan-core/18 shadow-neon" />
  );
}

function PanelOverlayLines() {
  return (
    <div className="absolute inset-0 grid grid-cols-3 gap-px opacity-20">
      <div className="border-r border-cyan-core" />
      <div className="border-r border-emerald-core" />
      <div />
    </div>
  );
}
