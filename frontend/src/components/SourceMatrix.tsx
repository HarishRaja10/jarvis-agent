import { SourceStatus } from "../data/mock";
import { cn } from "../lib/utils";
import { Badge } from "./ui/Badge";
import { Panel } from "./ui/Panel";

type Props = {
  sources: SourceStatus[];
};

const healthClass = {
  online: "bg-emerald-core",
  limited: "bg-amber-core",
  standby: "bg-muted-foreground"
};

export function SourceMatrix({ sources }: Props) {
  return (
    <Panel className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">Source Matrix</h2>
        <Badge tone="emerald">Ranked</Badge>
      </div>
      <div className="space-y-2">
        {sources.map((source) => (
          <div key={source.id} className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md border border-border/70 bg-background/35 p-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", healthClass[source.health])} />
                <p className="truncate text-sm font-semibold text-foreground">{source.name}</p>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {source.type} · {source.tier} · {source.topic}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-cyan-core">{source.trust}</p>
              <p className="text-xs text-muted-foreground">{source.latency}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

