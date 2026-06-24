from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from models import AgentConfig, AppConfig, SourceConfig, TopicConfig
from runtime_config import load_runtime_config, merge_runtime_config


def _read_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        data = yaml.safe_load(handle) or {}
    if not isinstance(data, dict):
        raise ValueError(f"Expected YAML mapping in {path}")
    return data


def load_config(root_dir: str | Path | None = None) -> AppConfig:
    root = Path(root_dir) if root_dir else Path(__file__).resolve().parents[1]
    config_dir = root / "config"

    agent_raw = _read_yaml(config_dir / "agent.yaml")
    topics_raw = _read_yaml(config_dir / "topics.yaml")
    sources_raw = _read_yaml(config_dir / "sources.yaml")
    trust_rules = _read_yaml(config_dir / "trust_rules.yaml")
    runtime = load_runtime_config(root)
    merged = merge_runtime_config(
        {
            "agent": agent_raw,
            "topics": topics_raw.get("topics") or {},
            "sources": sources_raw.get("sources") or [],
            "trust_rules": trust_rules,
        },
        runtime,
    )
    agent_raw = merged["agent"]
    topics_raw = {"topics": merged["topics"]}
    sources_raw = {"sources": merged["sources"]}
    trust_rules = merged["trust_rules"]

    agent = AgentConfig(
        agent_name=str(agent_raw.get("agent_name", "Jarvis")),
        tone=str(agent_raw.get("tone", "casual_jarvis")),
        timezone=str(agent_raw.get("timezone", "Asia/Kolkata")),
        output_language=str(agent_raw.get("output_language", "english_with_optional_tamil")),
        max_items_per_topic=int(agent_raw.get("max_items_per_topic", 5)),
        enable_voice=bool(agent_raw.get("enable_voice", False)),
        voice_provider=str(agent_raw.get("voice_provider", "none")),
        storage_provider=str(agent_raw.get("storage_provider", "sqlite")),
        min_confidence_to_send=str(agent_raw.get("min_confidence_to_send", "medium")).lower(),
    )

    topics: dict[str, TopicConfig] = {}
    for topic_id, raw in (topics_raw.get("topics") or {}).items():
        topics[topic_id] = TopicConfig(
            id=topic_id,
            name=str(raw.get("name", topic_id)),
            priority=int(raw.get("priority", 0)),
            keywords=[str(item).lower() for item in raw.get("keywords", [])],
            excluded_keywords=[str(item).lower() for item in raw.get("excluded_keywords", [])],
            source_groups=[str(item) for item in raw.get("source_groups", [])],
            max_items=int(raw.get("max_items", agent.max_items_per_topic)),
            alert_threshold=int(raw.get("alert_threshold", 70)),
        )

    sources = [
        SourceConfig(
            id=str(raw["id"]),
            name=str(raw.get("name", raw["id"])),
            type=str(raw.get("type", "rss")).lower(),
            url=raw.get("url"),
            topic_ids=[str(item) for item in raw.get("topic_ids", [])],
            trust_tier=str(raw.get("trust_tier", "unverified")),
            enabled=bool(raw.get("enabled", True)),
            language=raw.get("language"),
            source_groups=[str(item) for item in raw.get("source_groups", [])],
            api_config=dict(raw.get("api_config") or {}),
        )
        for raw in sources_raw.get("sources", [])
    ]

    return AppConfig(agent=agent, topics=topics, sources=sources, trust_rules=trust_rules, root_dir=str(root))
