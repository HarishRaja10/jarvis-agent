import { useState } from "react";
import { HomeDashboard } from "./pages/HomeDashboard";
import { ConfigCenter } from "./pages/ConfigCenter";
import { TopBar } from "./components/TopBar";
import { useThemeBoot } from "./hooks/useThemeBoot";

export type AppView = "dashboard" | "config";

export default function App() {
  const [view, setView] = useState<AppView>("dashboard");
  useThemeBoot();
  return (
    <>
      <TopBar activeView={view} onViewChange={setView} />
      {view === "config" ? <ConfigCenter /> : <HomeDashboard />}
    </>
  );
}
