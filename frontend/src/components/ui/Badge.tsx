import { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "cyan" | "amber" | "emerald" | "rose" | "neutral";
};

const toneClass = {
  cyan: "border-cyan-core/35 bg-cyan-core/10 text-cyan-core",
  amber: "border-amber-core/35 bg-amber-core/10 text-amber-core",
  emerald: "border-emerald-core/35 bg-emerald-core/10 text-emerald-core",
  rose: "border-rose-core/35 bg-rose-core/10 text-rose-core",
  neutral: "border-border/80 bg-muted/70 text-muted-foreground"
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-md border px-2 text-xs font-semibold",
        toneClass[tone],
        className
      )}
      {...props}
    />
  );
}

