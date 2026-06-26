import { useCallback, useEffect, useState } from "react";
import { HomeDashboard } from "./pages/HomeDashboard";
import { ConfigCenter } from "./pages/ConfigCenter";
import { TopBar } from "./components/TopBar";
import { CinematicOverlay, type CinematicOverlayMode } from "./components/CinematicOverlay";
import { useThemeBoot } from "./hooks/useThemeBoot";
import { triggerBriefingRun } from "./lib/api";

export type AppView = "dashboard" | "config";

export default function App() {
  const [view, setView] = useState<AppView>("dashboard");
  const [overlayMode, setOverlayMode] = useState<CinematicOverlayMode | null>("boot");
  const [pendingView, setPendingView] = useState<AppView | null>(null);
  const [runState, setRunState] = useState<"idle" | "dispatching" | "queued" | "failed">("idle");
  useThemeBoot();

  useEffect(() => {
    if (overlayMode !== "boot") return undefined;
    const timer = window.setTimeout(() => setOverlayMode(null), 3200);
    return () => window.clearTimeout(timer);
  }, [overlayMode]);

  const changeView = useCallback(
    (nextView: AppView) => {
      if (nextView === view) return;
      setPendingView(nextView);
      setOverlayMode(nextView === "config" ? "config" : "dashboard");
    },
    [view]
  );

  const runBriefingRitual = useCallback(() => {
    setOverlayMode("run");
    setRunState("dispatching");
    void triggerBriefingRun("manual")
      .then(() => {
        setRunState("queued");
        window.setTimeout(() => setRunState("idle"), 5000);
      })
      .catch(() => {
        setRunState("failed");
        window.setTimeout(() => setRunState("idle"), 7000);
      });
  }, []);

  const completeOverlay = useCallback(() => {
    if (pendingView) {
      setView(pendingView);
      setPendingView(null);
    }
    setOverlayMode(null);
  }, [pendingView]);

  return (
    <>
      <TopBar activeView={view} onViewChange={changeView} onRun={runBriefingRitual} runState={runState} />
      {view === "config" ? <ConfigCenter /> : <HomeDashboard />}
      <CinematicOverlay mode={overlayMode} onComplete={completeOverlay} />
    </>
  );
}
