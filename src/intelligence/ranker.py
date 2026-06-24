from __future__ import annotations

from datetime import datetime, timezone

from models import SourceItem, TopicConfig


def filter_by_topic_rules(items: list[SourceItem], topics: dict[str, TopicConfig]) -> list[SourceItem]:
    filtered: list[SourceItem] = []
    for item in items:
        topic = topics.get(item.topic_id)
        if not topic:
            continue
        haystack = f"{item.title} {item.summary} {item.source_name}".lower()
        if any(keyword in haystack for keyword in topic.excluded_keywords):
            continue
        keyword_hits = _keyword_hits(haystack, topic.keywords)
        if keyword_hits == 0 and item.trust_tier != "official":
            continue
        item.relevance_score = _relevance_score(haystack, topic.keywords)
        filtered.append(item)
    return filtered


def rank_items(items: list[SourceItem], topics: dict[str, TopicConfig], trust_rules: dict) -> list[SourceItem]:
    weights = trust_rules.get("ranking_weights") or {}
    trust_w = float(weights.get("trust", 0.45))
    recency_w = float(weights.get("recency", 0.25))
    relevance_w = float(weights.get("relevance", 0.20))
    support_w = float(weights.get("support", 0.10))

    now = datetime.now(timezone.utc)
    for item in items:
        hours_old = max((now - item.published_at.astimezone(timezone.utc)).total_seconds() / 3600, 0)
        recency_score = max(0.0, 1.0 - min(hours_old, 96.0) / 96.0)
        support_score = min(max(len(item.supporting_sources) - 1, 0) / 2, 1.0)
        item.rank_score = (
            trust_w * item.trust_score
            + recency_w * recency_score * 100
            + relevance_w * item.relevance_score * 100
            + support_w * support_score * 100
        )

    return sorted(
        items,
        key=lambda item: (topics.get(item.topic_id).priority if topics.get(item.topic_id) else 0, item.rank_score),
        reverse=True,
    )


def group_by_topic(items: list[SourceItem], topics: dict[str, TopicConfig]) -> dict[str, list[SourceItem]]:
    grouped: dict[str, list[SourceItem]] = {topic_id: [] for topic_id in topics}
    for item in items:
        grouped.setdefault(item.topic_id, []).append(item)
    for topic_id, topic_items in grouped.items():
        max_items = topics[topic_id].max_items if topic_id in topics else 5
        grouped[topic_id] = topic_items[:max_items]
    return {topic_id: topic_items for topic_id, topic_items in grouped.items() if topic_items}


def _keyword_hits(haystack: str, keywords: list[str]) -> int:
    return sum(1 for keyword in keywords if keyword and keyword.lower() in haystack)


def _relevance_score(haystack: str, keywords: list[str]) -> float:
    if not keywords:
        return 0.5
    hits = _keyword_hits(haystack, keywords)
    return min(1.0, hits / max(min(len(keywords), 6), 1))

