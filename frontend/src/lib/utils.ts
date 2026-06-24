import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function confidenceColor(confidence: "High" | "Medium" | "Low") {
  if (confidence === "High") return "text-emerald-core border-emerald-core/35 bg-emerald-core/10";
  if (confidence === "Medium") return "text-amber-core border-amber-core/35 bg-amber-core/10";
  return "text-rose-core border-rose-core/35 bg-rose-core/10";
}

