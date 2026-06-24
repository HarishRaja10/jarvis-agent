import { Topic } from "../data/mock";
import { confidenceColor, cn } from "../lib/utils";
import { Badge } from "./ui/Badge";
import { Panel } from "./ui/Panel";

type Props = {
  topics: Topic[];
};

export function TopicOrbitPanel({ topics }: Props) {
  return (
    <Panel className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">Topic Core</h2>
        <Badge tone="cyan">Live</Badge>
      </div>
      <div className="space-y-3">
        {topics.map((topic) => (
          <div key={topic.id} className="rounded-md border border-border/70 bg-background/35 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{topic.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{topic.activeItems} items · priority {topic.priority}</p>
              </div>
              <span className={cn("rounded-md border px-2 py-1 text-xs font-semibold", confidenceColor(topic.confidence))}>
                {topic.confidence}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  topic.tone === "cyan" && "bg-cyan-core",
                  topic.tone === "amber" && "bg-amber-core",
                  topic.tone === "emerald" && "bg-emerald-core",
                  topic.tone === "rose" && "bg-rose-core"
                )}
                style={{ width: `${Math.min(topic.trend * 4, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

