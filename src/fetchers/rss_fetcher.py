from __future__ import annotations

from typing import Mapping

import feedparser

from fetchers.base import BaseFetcher
from models import SourceConfig, SourceItem, TopicConfig
from utils.http_client import HttpClient


class RSSFetcher(BaseFetcher):
    def __init__(self, http: HttpClient | None = None) -> None:
        super().__init__()
        self.http = http or HttpClient()

    def fetch(self, source: SourceConfig, topics: Mapping[str, TopicConfig]) -> list[SourceItem]:
        if not source.url:
            return []
        try:
            response = self.http.get(source.url)
            feed = feedparser.parse(response.content)
        except Exception as exc:
            self.logger.warning("RSS fetch failed for %s: %s", source.id, exc)
            return []

        max_entries = int(source.api_config.get("max_entries", 25))
        items: list[SourceItem] = []
        for entry in feed.entries[:max_entries]:
            title = getattr(entry, "title", "")
            link = getattr(entry, "link", "")
            summary = getattr(entry, "summary", "") or getattr(entry, "description", "")
            published = getattr(entry, "published", None) or getattr(entry, "updated", None)
            items.extend(
                self.make_items_for_source_topics(
                    source,
                    title=title,
                    url=link,
                    published_at=published,
                    summary=summary,
                    raw_metadata={"feed_title": getattr(feed.feed, "title", source.name)},
                )
            )
        return items

