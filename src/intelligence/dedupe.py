from __future__ import annotations

import hashlib
import re
from difflib import SequenceMatcher
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from models import SourceItem

TRACKING_PARAMS = {
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "fbclid",
    "gclid",
    "mc_cid",
    "mc_eid",
}


def canonical_url(url: str) -> str:
    parsed = urlparse(url.strip())
    query = urlencode(
        [(key, value) for key, value in parse_qsl(parsed.query, keep_blank_values=True) if key not in TRACKING_PARAMS]
    )
    path = parsed.path.rstrip("/") or "/"
    return urlunparse((parsed.scheme.lower(), parsed.netloc.lower(), path, "", query, ""))


def stable_hash(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode("utf-8")).hexdigest()


def normalized_title(title: str) -> str:
    text = re.sub(r"[^a-z0-9\s]", " ", title.lower())
    return re.sub(r"\s+", " ", text).strip()


def title_similarity(left: str, right: str) -> float:
    return SequenceMatcher(None, normalized_title(left), normalized_title(right)).ratio()


def title_hash(title: str) -> str:
    return stable_hash(normalized_title(title))


def url_hash(url: str) -> str:
    return stable_hash(canonical_url(url))


def dedupe_items(items: list[SourceItem], similarity_threshold: float = 0.86) -> list[SourceItem]:
    unique: list[SourceItem] = []
    seen_urls: dict[str, SourceItem] = {}

    for item in items:
        key = url_hash(item.url)
        existing = seen_urls.get(key)
        if not existing:
            existing = _find_similar_item(unique, item, similarity_threshold)
        if existing:
            _merge_support(existing, item)
            continue
        seen_urls[key] = item
        unique.append(item)
    return unique


def _find_similar_item(items: list[SourceItem], candidate: SourceItem, threshold: float) -> SourceItem | None:
    for item in items:
        if item.topic_id != candidate.topic_id:
            continue
        if title_similarity(item.title, candidate.title) >= threshold:
            return item
    return None


def _merge_support(target: SourceItem, duplicate: SourceItem) -> None:
    known = {(source["name"], source["url"]) for source in target.supporting_sources}
    for source in duplicate.supporting_sources:
        marker = (source["name"], source["url"])
        if marker not in known:
            target.supporting_sources.append(source)
            known.add(marker)
    target.raw_metadata.setdefault("duplicates", []).append(
        {
            "title": duplicate.title,
            "url": duplicate.url,
            "source_id": duplicate.source_id,
            "source_name": duplicate.source_name,
            "trust_tier": duplicate.trust_tier,
        }
    )

