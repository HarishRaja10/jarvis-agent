from __future__ import annotations

from typing import Mapping

from fetchers.base import BaseFetcher
from models import SourceConfig, SourceItem, TopicConfig
from utils.http_client import HttpClient


class GDELTFetcher(BaseFetcher):
    endpoint = "https://api.gdeltproject.org/api/v2/doc/doc"

    def __init__(self, http: HttpClient | None = None) -> None:
        super().__init__()
        self.http = http or HttpClient(timeout_seconds=20)

    def fetch(self, source: SourceConfig, topics: Mapping[str, TopicConfig]) -> list[SourceItem]:
        query = str(source.api_config.get("query") or self._default_query(source, topics))
        max_records = int(source.api_config.get("max_records", 20))
        if not query:
            return []

        params = {
            "query": query,
            "mode": "ArtList",
            "format": "json",
            "maxrecords": max_records,
            "sort": "HybridRel",
        }
        try:
            payload = self.http.get(self.endpoint, params=params).json()
        except Exception as exc:
            self.logger.warning("GDELT fetch failed for %s: %s", source.id, exc)
            return []

        articles = payload.get("articles", []) if isinstance(payload, dict) else []
        items: list[SourceItem] = []
        for article in articles:
            title = article.get("title")
            url = article.get("url")
            source_name = article.get("sourceCommonName") or article.get("domain") or source.name
            published = article.get("seendate")
            summary = article.get("snippet") or article.get("title")
            language = article.get("language") or source.language or "multilingual"
            items.extend(
                self.make_items_for_source_topics(
                    source,
                    title=title,
                    url=url,
                    published_at=published,
                    summary=summary,
                    language=language,
                    source_name=source_name,
                    raw_metadata={"gdelt": article},
                )
            )
        return items

    def _default_query(self, source: SourceConfig, topics: Mapping[str, TopicConfig]) -> str:
        keywords: list[str] = []
        for topic_id in source.topic_ids:
            keywords.extend(topics.get(topic_id, TopicConfig(topic_id, topic_id, 0, [], [], [], 5, 70)).keywords[:5])
        return " OR ".join(f'"{keyword}"' if " " in keyword else keyword for keyword in keywords)

