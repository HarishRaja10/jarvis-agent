from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass(frozen=True)
class AgentConfig:
    agent_name: str
    tone: str
    timezone: str
    output_language: str
    max_items_per_topic: int
    enable_voice: bool
    storage_provider: str
    min_confidence_to_send: str
    voice_provider: str = "none"


@dataclass(frozen=True)
class TopicConfig:
    id: str
    name: str
    priority: int
    keywords: list[str]
    excluded_keywords: list[str]
    source_groups: list[str]
    max_items: int
    alert_threshold: int


@dataclass(frozen=True)
class SourceConfig:
    id: str
    name: str
    type: str
    topic_ids: list[str]
    trust_tier: str
    enabled: bool = True
    url: str | None = None
    language: str | None = None
    source_groups: list[str] = field(default_factory=list)
    api_config: dict[str, Any] = field(default_factory=dict)


@dataclass
class SourceItem:
    title: str
    url: str
    source_id: str
    source_name: str
    published_at: datetime
    summary: str
    language: str
    topic_id: str
    raw_metadata: dict[str, Any] = field(default_factory=dict)
    trust_tier: str = "unverified"
    trust_score: int = 10
    confidence: str = "Low"
    relevance_score: float = 0.0
    rank_score: float = 0.0
    brief_summary: str = ""
    why_it_matters: str = ""
    action_suggestion: str = ""
    supporting_sources: list[dict[str, str]] = field(default_factory=list)

    def __post_init__(self) -> None:
        if self.published_at.tzinfo is None:
            self.published_at = self.published_at.replace(tzinfo=timezone.utc)
        if not self.supporting_sources:
            self.supporting_sources = [{"name": self.source_name, "url": self.url, "tier": self.trust_tier}]


@dataclass(frozen=True)
class AppConfig:
    agent: AgentConfig
    topics: dict[str, TopicConfig]
    sources: list[SourceConfig]
    trust_rules: dict[str, Any]
    root_dir: str


CONFIDENCE_ORDER = {"low": 0, "medium": 1, "high": 2}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)

