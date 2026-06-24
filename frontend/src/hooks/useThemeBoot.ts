import { useEffect } from "react";
import { create } from "zustand";

type ThemeMode = "dark" | "light";

type ThemeStore = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const initialMode = (): ThemeMode => {
  if (typeof window === "undefined") return "dark";
  const stored = window.localStorage.getItem("jarvis-theme");
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
};

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: initialMode(),
  setMode: (mode) => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    window.localStorage.setItem("jarvis-theme", mode);
    set({ mode });
  },
  toggle: () => {
    const next = get().mode === "dark" ? "light" : "dark";
    get().setMode(next);
  }
}));

export function useThemeBoot() {
  const mode = useThemeStore((state) => state.mode);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);
}
