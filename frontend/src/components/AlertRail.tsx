import { alerts, activity } from "../data/mock";
import { Badge } from "./ui/Badge";
import { Panel } from "./ui/Panel";

export function AlertRail() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
      <Panel className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">Systems</h2>
          <Badge tone="cyan">PWA</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {alerts.map((alert) => (
            <div key={alert.label} className="rounded-md border border-border/70 bg-background/35 p-3">
              <alert.icon className="h-4 w-4 text-cyan-core" />
              <p className="mt-2 truncate text-xs font-semibold text-foreground">{alert.label}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{alert.value}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-muted-foreground">Activity</h2>
          <Badge tone="amber">IST</Badge>
        </div>
        <div className="space-y-3">
          {activity.map((item) => (
            <div key={`${item.time}-${item.text}`} className="grid grid-cols-[48px_1fr] gap-3">
              <span className="font-mono text-xs text-muted-foreground">{item.time}</span>
              <p className="text-sm text-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

