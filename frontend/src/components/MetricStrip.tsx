import { motion } from "framer-motion";
import { statusCards } from "../data/mock";
import { cn } from "../lib/utils";
import { Panel } from "./ui/Panel";

const toneClass = {
  cyan: "text-cyan-core bg-cyan-core/10 border-cyan-core/30",
  amber: "text-amber-core bg-amber-core/10 border-amber-core/30",
  emerald: "text-emerald-core bg-emerald-core/10 border-emerald-core/30",
  rose: "text-rose-core bg-rose-core/10 border-rose-core/30"
};

export function MetricStrip() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {statusCards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06 }}
        >
          <Panel className="scanline h-[116px] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
              </div>
              <div className={cn("grid h-10 w-10 place-items-center rounded-md border", toneClass[card.tone as keyof typeof toneClass])}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </Panel>
        </motion.div>
      ))}
    </div>
  );
}
