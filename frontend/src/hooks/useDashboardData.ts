import { useQuery } from "@tanstack/react-query";
import { activity, alerts, briefingItems, sourceStatuses, statusCards, topics, worldSignals } from "../data/mock";
import type { BriefingItem, SourceStatus } from "../data/mock";
import { fetchDashboard } from "../lib/api";

type DashboardData = {
  statusCards: typeof statusCards;
  topics: typeof topics;
  briefingItems: BriefingItem[];
  sourceStatuses: SourceStatus[];
  alerts: typeof alerts;
  activity: typeof activity;
  worldSignals: typeof worldSignals;
  generatedAt: string;
  backendStatus: "live" | "local" | "unconfigured";
};

const fallbackDashboard = (): DashboardData => ({
  statusCards,
  topics,
  briefingItems,
  sourceStatuses,
  alerts,
  activity,
  worldSignals,
  generatedAt: new Date().toISOString(),
  backendStatus: "local"
});

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const fallback = fallbackDashboard();
      try {
        const api = await fetchDashboard();
        const metrics = api.metrics ?? {};
        return {
          ...fallback,
          backendStatus: api.backendStatus ?? "live",
          generatedAt: api.generatedAt ?? fallback.generatedAt,
          briefingItems: isNonEmptyArray(api.briefingItems) ? (api.briefingItems as BriefingItem[]) : fallback.briefingItems,
          sourceStatuses: isNonEmptyArray(api.sourceStatuses) ? (api.sourceStatuses as SourceStatus[]) : fallback.sourceStatuses,
          activity: isNonEmptyArray(api.activity) ? (api.activity as typeof activity) : fallback.activity,
          statusCards: statusCards.map((card) => {
            if (card.label === "Sources") {
              return {
                ...card,
                value: String(metrics.sourceEvents ?? fallback.sourceStatuses.length).padStart(2, "0"),
                detail: `${metrics.sourceCount ?? fallback.sourceStatuses.length} sources`
              };
            }
            if (card.label === "Trust Avg") {
              return {
                ...card,
                value: String(metrics.trustAvg ?? 82),
                detail: api.backendStatus === "live" ? "live" : "stable"
              };
            }
            if (card.label === "Alerts") {
              return {
                ...card,
                value: String(metrics.highConfidence ?? 3).padStart(2, "0"),
                detail: "high confidence"
              };
            }
            if (card.label === "AI Mode") {
              return {
                ...card,
                value: api.backendStatus === "live" ? "Live" : "Local",
                detail: metrics.latestRunType ?? "fallback ready"
              };
            }
            return card;
          })
        } satisfies DashboardData;
      } catch {
        return fallback;
      }
    }
  });
}

function isNonEmptyArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length > 0;
}
