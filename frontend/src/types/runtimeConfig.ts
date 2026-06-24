export type ConfidenceFloor = "low" | "medium" | "high";

export type AgentRuntimeConfig = {
  agent_name: string;
  tone: string;
  timezone: string;
  output_language: string;
  max_items_per_topic: number;
  enable_voice: boolean;
  voice_provider: string;
  storage_provider: string;
  min_confidence_to_send: ConfidenceFloor;
};

export type TopicRuntimeConfig = {
  name: string;
  priority: number;
  keywords: string[];
  excluded_keywords: string[];
  source_groups: string[];
  max_items: number;
  alert_threshold: number;
};

export type SourceRuntimeConfig = {
  id: string;
  name: string;
  type: string;
  url?: string;
  topic_ids: string[];
  trust_tier: string;
  enabled: boolean;
  language?: string;
  source_groups: string[];
  api_config: Record<string, unknown>;
};

export type TrustTierRuntimeConfig = {
  score: number;
  label: string;
};

export type TrustRulesRuntimeConfig = {
  trust_tiers: Record<string, TrustTierRuntimeConfig>;
  confidence: {
    high_min_score: number;
    medium_min_score: number;
    low_min_score: number;
  };
  political_rules: {
    topics: string[];
    confirmed_when: {
      official_sources: number;
      reputed_sources: number;
    };
    social_label: string;
    action_min_confidence: ConfidenceFloor;
  };
  ranking_weights: {
    trust: number;
    recency: number;
    relevance: number;
    support: number;
  };
};

export type ScheduleRuntimeConfig = {
  enabled: boolean;
  run_type: "morning" | "evening" | "manual";
  time_utc: string;
  timezone: string;
};

export type SecretRuntimeStatus = {
  key: string;
  label: string;
  required: boolean;
  configured: boolean;
};

export type RuntimeConfig = {
  version: number;
  agent: AgentRuntimeConfig;
  topics: Record<string, TopicRuntimeConfig>;
  sources: SourceRuntimeConfig[];
  trust_rules: TrustRulesRuntimeConfig;
  schedules: ScheduleRuntimeConfig[];
  secrets: SecretRuntimeStatus[];
};
