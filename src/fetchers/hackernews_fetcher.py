from __future__ import annotations

from typing import Mapping

from fetchers.base import BaseFetcher
from models import SourceConfig, SourceItem, TopicConfig
from utils.http_client import HttpClient


class HackerNewsFetcher(BaseFetcher):
    endpoint = "https://hn.algolia.com/api/v1/search_by_date"

    def __init__(self, http: HttpClient | None = None) -> None:
        super().__init__()
        self.http = http or HttpClient()

    def fetch(self, source: SourceConfig, topics: Mapping[str, TopicConfig]) -> list[SourceItem]:
        hits_per_page = int(source.api_config.get("hits_per_page", 25))
        tags = str(source.api_config.get("tags", "story"))
        query = str(source.api_config.get("query") or "AI startup software")
        try:
            payload = self.http.get(
                self.endpoint,
                params={"query": query, "tags": tags, "hitsPerPage": hits_per_page},
            ).json()
        except Exception as exc:
            self.logger.warning("Hacker News fetch failed: %s", exc)
            return []

        items: list[SourceItem] = []
        for hit in payload.get("hits", []):
            url = hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}"
            summary = f"{hit.get('points', 0)} points, {hit.get('num_comments', 0)} comments"
            items.extend(
                self.make_items_for_source_topics(
                    source,
                    title=hit.get("title") or hit.get("story_title"),
                    url=url,
                    published_at=hit.get("created_at"),
                    summary=summary,
                    language="en",
                    raw_metadata={"hn": hit},
                )
            )
        return items

