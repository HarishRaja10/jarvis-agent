import { HomeDashboard } from "./pages/HomeDashboard";
import { useThemeBoot } from "./hooks/useThemeBoot";

export default function App() {
  useThemeBoot();
  return <HomeDashboard />;
}

