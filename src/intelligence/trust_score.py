from __future__ import annotations

from models import SourceItem


def tier_score(tier: str, trust_rules: dict) -> int:
    return int((trust_rules.get("trust_tiers") or {}).get(tier, {}).get("score", 10))


def score_items(items: list[SourceItem], trust_rules: dict) -> list[SourceItem]:
    for item in items:
        score_item(item, trust_rules)
    return items


def score_item(item: SourceItem, trust_rules: dict) -> SourceItem:
    source_scores = [tier_score(source.get("tier", "unverified"), trust_rules) for source in item.supporting_sources]
    source_scores.append(tier_score(item.trust_tier, trust_rules))
    item.trust_score = max(source_scores) if source_scores else 10
    item.trust_tier = _tier_for_score(item.trust_score, trust_rules)

    political_topics = set((trust_rules.get("political_rules") or {}).get("topics", []))
    if item.topic_id in political_topics:
        _score_political_item(item, trust_rules)
    else:
        item.confidence = _confidence_from_score(item.trust_score, trust_rules)
        item.raw_metadata["political_confirmed"] = None
    return item


def _score_political_item(item: SourceItem, trust_rules: dict) -> None:
    tiers = [source.get("tier", "unverified") for source in item.supporting_sources] or [item.trust_tier]
    scores = [tier_score(tier, trust_rules) for tier in tiers]
    official_count = sum(1 for tier, score in zip(tiers, scores) if tier == "official" or score >= 100)
    reputed_count = sum(1 for tier, score in zip(tiers, scores) if tier == "reputed_news" or 80 <= score < 100)
    public_db_count = sum(1 for tier in tiers if tier == "public_database")
    community_count = sum(1 for tier in tiers if tier in {"community_social", "unverified"})

    item.raw_metadata["political_support"] = {
        "official_sources": official_count,
        "reputed_sources": reputed_count,
        "public_database_sources": public_db_count,
        "community_sources": community_count,
    }

    if official_count >= 1:
        item.confidence = "High"
        item.raw_metadata["political_confirmed"] = True
    elif reputed_count >= 2:
        item.confidence = "High"
        item.raw_metadata["political_confirmed"] = True
    elif reputed_count == 1 or public_db_count >= 1:
        item.confidence = "Medium"
        item.raw_metadata["political_confirmed"] = False
    else:
        item.confidence = "Low"
        item.raw_metadata["political_confirmed"] = False
        item.raw_metadata["signal_label"] = "unverified signal"


def _confidence_from_score(score: int, trust_rules: dict) -> str:
    confidence = trust_rules.get("confidence") or {}
    high = int(confidence.get("high_min_score", 80))
    medium = int(confidence.get("medium_min_score", 50))
    if score >= high:
        return "High"
    if score >= medium:
        return "Medium"
    return "Low"


def _tier_for_score(score: int, trust_rules: dict) -> str:
    best_tier = "unverified"
    best_score = -1
    for tier, raw in (trust_rules.get("trust_tiers") or {}).items():
        candidate_score = int(raw.get("score", 0))
        if candidate_score <= score and candidate_score > best_score:
            best_tier = tier
            best_score = candidate_score
    return best_tier

