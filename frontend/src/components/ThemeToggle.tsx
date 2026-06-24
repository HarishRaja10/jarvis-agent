import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/Button";
import { useThemeStore } from "../hooks/useThemeBoot";

export function ThemeToggle() {
  const mode = useThemeStore((state) => state.mode);
  const toggle = useThemeStore((state) => state.toggle);
  const Icon = mode === "dark" ? Moon : Sun;

  return (
    <Button aria-label="Toggle theme" size="icon" onClick={toggle}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}

