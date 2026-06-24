from __future__ import annotations

from datetime import datetime, timezone

from intelligence.trust_score import score_item, tier_score
from models import SourceItem


TRUST_RULES = {
    "trust_tiers": {
        "official": {"score": 100},
        "reputed_news": {"score": 80},
        "public_database": {"score": 75},
        "community_social": {"score": 40},
        "unverified": {"score": 10},
    },
    "confidence": {"high_min_score": 80, "medium_min_score": 50},
    "political_rules": {"topics": ["tn_politics", "india_politics"]},
}


def make_item(topic_id: str, tier: str) -> SourceItem:
    return SourceItem(
        title="Election Commission update",
        url="https://example.com",
        source_id="src",
        source_name="Source",
        published_at=datetime.now(timezone.utc),
        summary="Political update",
        language="en",
        topic_id=topic_id,
        trust_tier=tier,
    )


def test_tier_score_uses_configured_scores() -> None:
    assert tier_score("official", TRUST_RULES) == 100
    assert tier_score("unknown", TRUST_RULES) == 10


def test_official_political_item_is_high_confidence() -> None:
    item = score_item(make_item("india_politics", "official"), TRUST_RULES)
    assert item.confidence == "High"
    assert item.raw_metadata["political_confirmed"] is True


def test_social_political_item_is_unverified_low_confidence() -> None:
    item = score_item(make_item("tn_politics", "community_social"), TRUST_RULES)
    assert item.confidence == "Low"
    assert item.raw_metadata["signal_label"] == "unverified signal"

