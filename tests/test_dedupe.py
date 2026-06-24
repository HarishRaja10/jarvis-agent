from __future__ import annotations

from datetime import datetime, timezone

from intelligence.dedupe import canonical_url, dedupe_items
from models import SourceItem


def item(title: str, url: str, source_name: str = "Source") -> SourceItem:
    return SourceItem(
        title=title,
        url=url,
        source_id=source_name.lower(),
        source_name=source_name,
        published_at=datetime.now(timezone.utc),
        summary="Summary",
        language="en",
        topic_id="tech_ai",
        trust_tier="reputed_news",
    )


def test_canonical_url_removes_tracking_params() -> None:
    assert canonical_url("https://Example.com/news/?utm_source=x&id=10") == "https://example.com/news?id=10"


def test_dedupe_merges_similar_titles_and_sources() -> None:
    items = [
        item("OpenAI releases a new AI model", "https://example.com/a?utm_campaign=x", "A"),
        item("OpenAI releases new AI model", "https://another.com/story", "B"),
    ]
    deduped = dedupe_items(items)
    assert len(deduped) == 1
    assert len(deduped[0].supporting_sources) == 2

