from __future__ import annotations

import json
from pathlib import Path

import yaml

from config_loader import load_config


def test_runtime_config_path_overrides_yaml_defaults(tmp_path: Path, monkeypatch) -> None:
    _write_base_config(tmp_path)
    runtime_path = tmp_path / "runtime.json"
    runtime_path.write_text(
        json.dumps(
            {
                "agent": {
                    "agent_name": "Jarvis Admin",
                    "max_items_per_topic": 9,
                    "min_confidence_to_send": "high",
                },
                "topics": {
                    "tech_ai": {
                        "priority": 77,
                        "keywords": ["agentic ai"],
                    }
                },
                "sources": [
                    {
                        "id": "custom_feed",
                        "name": "Custom Feed",
                        "type": "rss",
                        "url": "https://example.com/feed.xml",
                        "topic_ids": ["tech_ai"],
                        "trust_tier": "official",
                        "enabled": True,
                    }
                ],
                "trust_rules": {
                    "ranking_weights": {
                        "trust": 0.7,
                    }
                },
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("RUNTIME_CONFIG_PATH", str(runtime_path))

    config = load_config(tmp_path)

    assert config.agent.agent_name == "Jarvis Admin"
    assert config.agent.max_items_per_topic == 9
    assert config.agent.min_confidence_to_send == "high"
    assert config.topics["tech_ai"].priority == 77
    assert config.topics["tech_ai"].keywords == ["agentic ai"]
    assert [source.id for source in config.sources] == ["custom_feed"]
    assert config.trust_rules["ranking_weights"]["trust"] == 0.7
    assert config.trust_rules["ranking_weights"]["recency"] == 0.25


def test_runtime_config_json_takes_precedence_over_path(tmp_path: Path, monkeypatch) -> None:
    _write_base_config(tmp_path)
    runtime_path = tmp_path / "runtime.json"
    runtime_path.write_text(json.dumps({"agent": {"agent_name": "File Config"}}), encoding="utf-8")
    monkeypatch.setenv("RUNTIME_CONFIG_PATH", str(runtime_path))
    monkeypatch.setenv("RUNTIME_CONFIG_JSON", json.dumps({"agent": {"agent_name": "Inline Config"}}))

    config = load_config(tmp_path)

    assert config.agent.agent_name == "Inline Config"


def test_invalid_runtime_config_falls_back_to_yaml(tmp_path: Path, monkeypatch) -> None:
    _write_base_config(tmp_path)
    monkeypatch.setenv("RUNTIME_CONFIG_JSON", "[invalid")

    config = load_config(tmp_path)

    assert config.agent.agent_name == "Jarvis"
    assert config.sources[0].id == "openai_blog"


def _write_base_config(root: Path) -> None:
    config_dir = root / "config"
    config_dir.mkdir()
    _write_yaml(
        config_dir / "agent.yaml",
        {
            "agent_name": "Jarvis",
            "tone": "casual_jarvis",
            "timezone": "Asia/Kolkata",
            "output_language": "english",
            "max_items_per_topic": 5,
            "enable_voice": False,
            "voice_provider": "none",
            "storage_provider": "sqlite",
            "min_confidence_to_send": "medium",
        },
    )
    _write_yaml(
        config_dir / "topics.yaml",
        {
            "topics": {
                "tech_ai": {
                    "name": "Tech AI",
                    "priority": 100,
                    "keywords": ["ai"],
                    "excluded_keywords": [],
                    "source_groups": ["tech"],
                    "max_items": 5,
                    "alert_threshold": 80,
                }
            }
        },
    )
    _write_yaml(
        config_dir / "sources.yaml",
        {
            "sources": [
                {
                    "id": "openai_blog",
                    "name": "OpenAI",
                    "type": "rss",
                    "url": "https://example.com/rss.xml",
                    "topic_ids": ["tech_ai"],
                    "trust_tier": "official",
                    "enabled": True,
                }
            ]
        },
    )
    _write_yaml(
        config_dir / "trust_rules.yaml",
        {
            "trust_tiers": {
                "official": {"score": 100, "label": "Official"},
            },
            "confidence": {"high_min_score": 80, "medium_min_score": 50, "low_min_score": 0},
            "ranking_weights": {"trust": 0.45, "recency": 0.25, "relevance": 0.2, "support": 0.1},
        },
    )


def _write_yaml(path: Path, data: dict) -> None:
    path.write_text(yaml.safe_dump(data), encoding="utf-8")
