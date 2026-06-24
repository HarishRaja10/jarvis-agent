from __future__ import annotations

from datetime import datetime, timezone

from intelligence.formatter import format_telegram_briefing
from models import SourceItem, TopicConfig


def test_formatter_includes_confidence_actions_and_source_links() -> None:
    topic = TopicConfig(
        id="india_politics",
        name="India Politics",
        priority=90,
        keywords=["india"],
        excluded_keywords=[],
        source_groups=[],
        max_items=5,
        alert_threshold=80,
    )
    item = SourceItem(
        title="India policy update",
        url="https://pib.gov.in/example",
        source_id="pib",
        source_name="PIB",
        published_at=datetime.now(timezone.utc),
        summary="Official update",
        language="en",
        topic_id="india_politics",
        trust_tier="official",
        trust_score=100,
        confidence="High",
        brief_summary="Official policy update from PIB.",
        why_it_matters="It can affect public services.",
        action_suggestion="Check the official notice.",
    )
    item.raw_metadata["political_confirmed"] = True
    text = format_telegram_briefing(
        {"india_politics": [item]},
        {"india_politics": topic},
        agent_name="Jarvis",
        run_type="manual",
        timezone_name="Asia/Kolkata",
        generated_at=datetime.now(timezone.utc),
    )
    assert "Confidence: High" in text
    assert "Action: Check the official notice." in text
    assert "https://pib.gov.in/example" in text

