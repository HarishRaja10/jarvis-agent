import { handleError, json, supabaseRequest } from "../_shared.js";

export async function onRequestGet({ env }) {
  try {
    const [events, briefings] = await Promise.all([
      supabaseRequest(env, "source_events", {
        select: "*",
        order: "published_at.desc",
        limit: "80"
      }),
      supabaseRequest(env, "briefing_history", {
        select: "*",
        order: "generated_at.desc",
        limit: "6"
      })
    ]);

    const sourceEvents = Array.isArray(events) ? events : [];
    const briefingHistory = Array.isArray(briefings) ? briefings : [];
    const now = new Date().toISOString();
    const trustScores = sourceEvents.map((event) => Number(event.trust_score)).filter(Number.isFinite);
    const trustAvg = trustScores.length
      ? Math.round(trustScores.reduce((sum, score) => sum + score, 0) / trustScores.length)
      : 0;

    return json({
      backendStatus: "live",
      generatedAt: now,
      metrics: {
        sourceEvents: sourceEvents.length,
        sourceCount: new Set(sourceEvents.map((event) => event.source).filter(Boolean)).size,
        trustAvg,
        highConfidence: sourceEvents.filter((event) => normalizeConfidence(event.confidence) === "High").length,
        latestRunType: briefingHistory[0]?.run_type ?? "manual",
        latestItemCount: Number(briefingHistory[0]?.item_count ?? sourceEvents.length)
      },
      briefingItems: toBriefingItems(sourceEvents),
      sourceStatuses: toSourceStatuses(sourceEvents),
      activity: toActivity(briefingHistory)
    });
  } catch (error) {
    return handleError(error);
  }
}

function toBriefingItems(events) {
  const seen = new Set();
  return events
    .filter((event) => {
      const key = event.url || event.title;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12)
    .map((event, index) => {
      const topicId = String(event.topic || "global_signal");
      const trustScore = Number(event.trust_score ?? 60);
      return {
        id: String(event.id ?? `${topicId}-${index}`),
        topicId,
        title: String(event.title || "Untitled signal"),
        summary: String(event.raw_summary || "A source event was captured by the backend briefing run."),
        why: whyForTopic(topicId),
        action: actionForConfidence(event.confidence),
        source: String(event.source || "Backend source"),
        url: String(event.url || "#"),
        confidence: normalizeConfidence(event.confidence),
        trustScore: Number.isFinite(trustScore) ? trustScore : 60,
        age: relativeAge(event.published_at)
      };
    });
}

function toSourceStatuses(events) {
  const groups = new Map();
  for (const event of events) {
    const name = String(event.source || "Unknown source");
    const current = groups.get(name) || {
      count: 0,
      latestAt: event.published_at,
      topic: event.topic || "mixed",
      trustTotal: 0
    };
    current.count += 1;
    current.trustTotal += Number(event.trust_score ?? 60);
    if (new Date(event.published_at || 0) > new Date(current.latestAt || 0)) {
      current.latestAt = event.published_at;
      current.topic = event.topic || current.topic;
    }
    groups.set(name, current);
  }

  return [...groups.entries()].slice(0, 12).map(([name, group], index) => {
    const trust = Math.round(group.trustTotal / Math.max(group.count, 1));
    return {
      id: slug(name) || `source-${index}`,
      name,
      type: "Supabase",
      tier: trust >= 90 ? "Official" : trust >= 75 ? "Reputed" : "Observed",
      health: isFresh(group.latestAt) ? "online" : "limited",
      topic: String(group.topic || "mixed"),
      trust,
      latency: `${group.count} items`
    };
  });
}

function toActivity(briefings) {
  return briefings.slice(0, 6).map((briefing) => ({
    time: formatTime(briefing.generated_at || briefing.created_at),
    text: `${capitalize(briefing.run_type || "manual")} briefing saved (${briefing.item_count ?? 0} items)`,
    tone: Number(briefing.item_count ?? 0) > 0 ? "emerald" : "amber"
  }));
}

function normalizeConfidence(value) {
  const raw = String(value || "").toLowerCase();
  if (raw === "high") return "High";
  if (raw === "low") return "Low";
  return "Medium";
}

function whyForTopic(topicId) {
  if (topicId.includes("tn")) return "This affects your Tamil Nadu local signal watch.";
  if (topicId.includes("india")) return "This can affect India policy, economy, or civic context.";
  if (topicId.includes("tech") || topicId.includes("ai")) return "This can influence your AI stack and product roadmap.";
  if (topicId.includes("movies")) return "This keeps entertainment signals source-backed and low-noise.";
  return "This signal changed since the last backend briefing run.";
}

function actionForConfidence(confidence) {
  const normalized = normalizeConfidence(confidence);
  if (normalized === "High") return "Use this as a confirmed briefing item.";
  if (normalized === "Low") return "Treat as watch-only until stronger confirmation appears.";
  return "Track one more trusted source before making decisions.";
}

function relativeAge(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function formatTime(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata"
  }).format(date);
}

function isFresh(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() < 1000 * 60 * 60 * 48;
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function capitalize(value) {
  const text = String(value || "");
  return text ? text[0].toUpperCase() + text.slice(1) : "";
}
