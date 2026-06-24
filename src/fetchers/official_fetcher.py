from __future__ import annotations

import re
from typing import Mapping

import feedparser

from fetchers.base import BaseFetcher, clean_text
from models import SourceConfig, SourceItem, TopicConfig
from utils.http_client import HttpClient


class OfficialFetcher(BaseFetcher):
    def __init__(self, http: HttpClient | None = None) -> None:
        super().__init__()
        self.http = http or HttpClient()

    def fetch(self, source: SourceConfig, topics: Mapping[str, TopicConfig]) -> list[SourceItem]:
        if not source.url:
            return []
        try:
            response = self.http.get(source.url)
            body = response.text
        except Exception as exc:
            self.logger.warning("Official source fetch failed for %s: %s", source.id, exc)
            return []

        feed = feedparser.parse(body)
        if feed.entries:
            items: list[SourceItem] = []
            for entry in feed.entries[: int(source.api_config.get("max_entries", 15))]:
                items.extend(
                    self.make_items_for_source_topics(
                        source,
                        title=getattr(entry, "title", ""),
                        url=getattr(entry, "link", source.url),
                        published_at=getattr(entry, "published", None) or getattr(entry, "updated", None),
                        summary=getattr(entry, "summary", ""),
                        raw_metadata={"official_feed": getattr(feed.feed, "title", source.name)},
                    )
                )
            return items

        title = self._extract_title(body) or source.name
        description = self._extract_meta_description(body) or f"Official source monitor: {source.name}"
        return self.make_items_for_source_topics(
            source,
            title=title,
            url=source.url,
            summary=description,
            raw_metadata={"official_page": True},
        )

    def _extract_title(self, body: str) -> str:
        match = re.search(r"<title[^>]*>(.*?)</title>", body, flags=re.IGNORECASE | re.DOTALL)
        return clean_text(match.group(1), max_length=220) if match else ""

    def _extract_meta_description(self, body: str) -> str:
        match = re.search(
            r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']',
            body,
            flags=re.IGNORECASE | re.DOTALL,
        )
        return clean_text(match.group(1), max_length=500) if match else ""

