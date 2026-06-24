import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, RadioTower, Settings2, Sparkles, Zap } from "lucide-react";
import { cn } from "../lib/utils";

export type CinematicOverlayMode = "boot" | "dashboard" | "config" | "run";

type CinematicOverlayProps = {
  mode: CinematicOverlayMode | null;
  onComplete?: () => void;
};

const runSteps = ["Source sweep", "Trust ranking", "Gemini brief", "Telegram dispatch", "Supabase archive"];

export function CinematicOverlay({ mode, onComplete }: CinematicOverlayProps) {
  const [step, setStep] = useState(0);
  const isOpen = Boolean(mode);
  const src = useCinematicSrc(mode);
  const label = getLabel(mode);
  const Icon = getIcon(mode);

  useEffect(() => {
    if (!mode) return undefined;
    setStep(0);
    const duration = mode === "run" ? 5600 : mode === "boot" ? 3000 : 1700;
    const closeTimer = window.setTimeout(() => onComplete?.(), duration);
    const stepTimer =
      mode === "run"
        ? window.setInterval(() => {
            setStep((current) => Math.min(current + 1, runSteps.length - 1));
          }, 900)
        : undefined;

    return () => {
      window.clearTimeout(closeTimer);
      if (stepTimer) window.clearInterval(stepTimer);
    };
  }, [mode, onComplete]);

  return (
    <AnimatePresence>
      {isOpen && src ? (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          <video
            key={src}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-[0.88]"
            autoPlay
            muted
            playsInline
            preload="auto"
            src={src}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent,rgba(0,0,0,0.22)_45%,rgba(0,0,0,0.82)_100%)]" />
          <div className="core-grid absolute inset-0 opacity-25" />
          <motion.div
            className="relative z-10 w-[min(680px,calc(100vw-32px))] rounded-lg border border-cyan-core/25 bg-background/68 p-4 shadow-neon-strong backdrop-blur-xl sm:p-5"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.32 }}
          >
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-md border border-cyan-core/35 bg-cyan-core/12">
                <Icon className="h-5 w-5 text-cyan-core" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{label.kicker}</p>
                <h2 className="text-lg font-semibold text-foreground sm:text-xl">{label.title}</h2>
              </div>
            </div>

            {mode === "run" ? (
              <div className="mt-5 grid gap-2">
                {runSteps.map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border border-border/70 bg-muted/30 px-3 py-2">
                    <div
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-md border",
                        index <= step ? "border-emerald-core/40 bg-emerald-core/12 text-emerald-core" : "border-border text-muted-foreground"
                      )}
                    >
                      {index < step ? <Check className="h-4 w-4" /> : <span className="text-xs">{index + 1}</span>}
                    </div>
                    <span className={cn("text-sm", index <= step ? "text-foreground" : "text-muted-foreground")}>{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div className="h-full rounded-full bg-cyan-core" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: mode === "boot" ? 2.55 : 1.25, ease: "easeInOut" }} />
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function useCinematicSrc(mode: CinematicOverlayMode | null) {
  return useMemo(() => {
    const mobile = typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches;
    if (mode === "boot" || mode === "dashboard") {
      return "/cinematic/dashboard-panels-fill.mp4";
    }
    if (mode === "config") return "/cinematic/config-book-turn.mp4";
    if (mode === "run") return mobile ? "/cinematic/mobile-core-pour.mp4" : "/cinematic/dashboard-core-pour.mp4";
    return "";
  }, [mode]);
}

function getLabel(mode: CinematicOverlayMode | null) {
  if (mode === "config") return { kicker: "Mode shift", title: "Opening control manual" };
  if (mode === "run") return { kicker: "Manual sequence", title: "Running briefing ritual" };
  if (mode === "dashboard") return { kicker: "Mode shift", title: "Restoring command console" };
  return { kicker: "System boot", title: "Jarvis console online" };
}

function getIcon(mode: CinematicOverlayMode | null) {
  if (mode === "config") return Settings2;
  if (mode === "run") return RadioTower;
  if (mode === "dashboard") return Zap;
  return Sparkles;
}
