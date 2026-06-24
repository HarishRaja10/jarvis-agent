import { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <section className={cn("glass-panel rounded-lg", className)} {...props} />;
}

