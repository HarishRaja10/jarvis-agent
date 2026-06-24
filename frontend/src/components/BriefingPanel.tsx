import { ExternalLink } from "lucide-react";
import { BriefingItem } from "../data/mock";
import { confidenceColor, cn } from "../lib/utils";
import { Badge } from "./ui/Badge";
import { Panel } from "./ui/Panel";

type Props = {
  items: BriefingItem[];
};

export function BriefingPanel({ items }: Props) {
  return (
    <Panel className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase text-muted-foreground">Briefing Feed</h2>
        <Badge tone="amber">20 items</Badge>
      </div>
      <div className="max-h-[564px] space-y-3 overflow-y-auto pr-1 no-scrollbar">
        {items.map((item) => (
          <article key={item.id} className="rounded-lg border border-border/70 bg-background/35 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold leading-5 text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-5 text-muted-foreground">{item.summary}</p>
              </div>
              <span className={cn("shrink-0 rounded-md border px-2 py-1 text-xs font-semibold", confidenceColor(item.confidence))}>
                {item.confidence}
              </span>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
              <p>
                <span className="text-foreground">Why:</span> {item.why}
              </p>
              <p>
                <span className="text-foreground">Action:</span> {item.action}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <Badge tone={item.trustScore >= 90 ? "emerald" : "amber"}>Trust {item.trustScore}</Badge>
              <a
                href={item.url}
                className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-core hover:text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                {item.source}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

