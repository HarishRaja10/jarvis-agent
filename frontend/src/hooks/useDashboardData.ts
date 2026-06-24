import { useQuery } from "@tanstack/react-query";
import { activity, alerts, briefingItems, sourceStatuses, statusCards, topics } from "../data/mock";

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
      generatedAt: new Date().toISOString()
    })
  });
}

