from __future__ import annotations

from datetime import datetime, timedelta, timezone

from intelligence.ranker import rank_items
from models import SourceItem, TopicConfig


def make_item(title: str, trust_score: int, published_at: datetime) -> SourceItem:
    return SourceItem(
        title=title,
        url=f"https://example.com/{trust_score}",
        source_id="src",
        source_name="Source",
        published_at=published_at,
        summary="AI software startup update",
        language="en",
        topic_id="tech_ai",
        trust_tier="reputed_news",
        trust_score=trust_score,
        relevance_score=1.0,
    )


def test_ranker_prefers_trust_when_relevance_is_equal() -> None:
    topics = {
        "tech_ai": TopicConfig(
            id="tech_ai",
            name="Tech",
            priority=100,
            keywords=["ai"],
            excluded_keywords=[],
            source_groups=[],
            max_items=5,
            alert_threshold=80,
        )
    }
    rules = {"ranking_weights": {"trust": 0.6, "recency": 0.2, "relevance": 0.2, "support": 0.0}}
    now = datetime.now(timezone.utc)
    low = make_item("AI low", 40, now)
    high = make_item("AI high", 100, now - timedelta(hours=3))
    ranked = rank_items([low, high], topics, rules)
    assert ranked[0].trust_score == 100

