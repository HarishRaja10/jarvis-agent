from __future__ import annotations

import os
from typing import Mapping

from fetchers.base import BaseFetcher
from models import SourceConfig, SourceItem, TopicConfig
from utils.http_client import HttpClient


class YouTubeFetcher(BaseFetcher):
    endpoint = "https://www.googleapis.com/youtube/v3/search"

    def __init__(self, http: HttpClient | None = None) -> None:
        super().__init__()
        self.http = http or HttpClient()

    def fetch(self, source: SourceConfig, topics: Mapping[str, TopicConfig]) -> list[SourceItem]:
        api_key = os.getenv("YOUTUBE_API_KEY")
        if not api_key:
            self.logger.info("Skipping YouTube source %s because YOUTUBE_API_KEY is not configured", source.id)
            return []

        queries = source.api_config.get("queries") or ["official trailer"]
        max_results = int(source.api_config.get("max_results", 8))
        items: list[SourceItem] = []
        for query in queries:
            try:
                payload = self.http.get(
                    self.endpoint,
                    params={
                        "key": api_key,
                        "part": "snippet",
                        "type": "video",
                        "order": "date",
                        "q": query,
                        "maxResults": max_results,
                        "safeSearch": "moderate",
                    },
                ).json()
            except Exception as exc:
                self.logger.warning("YouTube fetch failed for query %s: %s", query, exc)
                continue

            for row in payload.get("items", []):
                snippet = row.get("snippet", {})
                video_id = row.get("id", {}).get("videoId")
                if not video_id:
                    continue
                items.extend(
                    self.make_items_for_source_topics(
                        source,
                        title=snippet.get("title"),
                        url=f"https://www.youtube.com/watch?v={video_id}",
                        published_at=snippet.get("publishedAt"),
                        summary=snippet.get("description", ""),
                        language=source.language or "unknown",
                        source_name=snippet.get("channelTitle") or source.name,
                        raw_metadata={"youtube": row, "query": query},
                    )
                )
        return items

