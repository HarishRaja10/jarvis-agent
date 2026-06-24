import { Activity, BrainCircuit, ShieldCheck } from "lucide-react";
import { Badge } from "./ui/Badge";

export function CoreOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-end justify-center px-3 pb-4 sm:px-4 sm:pb-8">
      <div className="grid w-full max-w-2xl grid-cols-3 gap-2 rounded-lg border border-cyan-core/20 bg-background/58 p-3 backdrop-blur-xl sm:gap-3 sm:p-4">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground sm:gap-2 sm:text-xs">
            <BrainCircuit className="h-3.5 w-3.5 text-cyan-core sm:h-4 sm:w-4" />
            Core
          </div>
          <p className="mt-1 text-xl font-semibold text-foreground sm:mt-2 sm:text-2xl">91%</p>
          <Badge tone="emerald" className="mt-1 h-6 px-1.5 sm:mt-2 sm:h-7 sm:px-2">Stable</Badge>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground sm:gap-2 sm:text-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-core sm:h-4 sm:w-4" />
            Trust
          </div>
          <p className="mt-1 text-xl font-semibold text-foreground sm:mt-2 sm:text-2xl">82</p>
          <Badge tone="cyan" className="mt-1 h-6 px-1.5 sm:mt-2 sm:h-7 sm:px-2">Verified</Badge>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground sm:gap-2 sm:text-xs">
            <Activity className="h-3.5 w-3.5 text-amber-core sm:h-4 sm:w-4" />
            Load
          </div>
          <p className="mt-1 text-xl font-semibold text-foreground sm:mt-2 sm:text-2xl">18</p>
          <Badge tone="amber" className="mt-1 h-6 px-1.5 sm:mt-2 sm:h-7 sm:px-2">Sources</Badge>
        </div>
      </div>
    </div>
  );
}
