import { useQuery } from "@tanstack/react-query";
import { activity, alerts, briefingItems, sourceStatuses, statusCards, topics, worldSignals } from "../data/mock";

export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => ({
      statusCards,
      topics,
      briefingItems,
      sourceStatuses,
      alerts,
      activity,
      worldSignals,
      generatedAt: new Date().toISOString()
    })
  });
}
