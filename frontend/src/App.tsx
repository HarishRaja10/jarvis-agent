import { useCallback, useEffect, useState } from "react";
import { HomeDashboard } from "./pages/HomeDashboard";
import { ConfigCenter } from "./pages/ConfigCenter";
import { TopBar } from "./components/TopBar";
import { CinematicOverlay, type CinematicOverlayMode } from "./components/CinematicOverlay";
import { useThemeBoot } from "./hooks/useThemeBoot";

export type AppView = "dashboard" | "config";

export default function App() {
  const [view, setView] = useState<AppView>("dashboard");
  const [overlayMode, setOverlayMode] = useState<CinematicOverlayMode | null>("boot");
  const [pendingView, setPendingView] = useState<AppView | null>(null);
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
      <TopBar activeView={view} onViewChange={changeView} onRun={runBriefingRitual} />
      {view === "config" ? <ConfigCenter /> : <HomeDashboard />}
      <CinematicOverlay mode={overlayMode} onComplete={completeOverlay} />
    </>
  );
}
