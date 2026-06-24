import { Bell, Bot, Play, Radio, Settings } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { ThemeToggle } from "./ThemeToggle";
import type { AppView } from "../App";

type TopBarProps = {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  onRun: () => void;
};

export function TopBar({ activeView, onViewChange, onRun }: TopBarProps) {
  return (
    <header className="flex min-h-16 flex-col items-stretch justify-between gap-3 border-b border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-cyan-core/35 bg-cyan-core/10 shadow-neon">
          <Bot className="h-5 w-5 text-cyan-core" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold leading-tight text-foreground sm:text-xl">Jarvis Briefing Agent</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone="emerald">Manual</Badge>
            <Badge tone="cyan">08:30 IST</Badge>
            <Badge tone="amber">Supabase</Badge>
          </div>
        </div>
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
        <Button size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Button size="icon" aria-label="Source signal">
          <Radio className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <Button size="icon" aria-label="Settings" variant={activeView === "config" ? "primary" : "ghost"} onClick={() => onViewChange(activeView === "config" ? "dashboard" : "config")}>
          <Settings className="h-4 w-4" />
        </Button>
        <Button size="icon" aria-label="Run briefing" className="sm:hidden" variant="primary" onClick={onRun}>
          <Play className="h-4 w-4" />
        </Button>
        <Button variant="primary" className="hidden sm:inline-flex" onClick={onRun}>
          <Play className="h-4 w-4" />
          Run
        </Button>
      </div>
    </header>
  );
}
