from __future__ import annotations

import os
from typing import Mapping

from fetchers.base import BaseFetcher
from models import SourceConfig, SourceItem, TopicConfig
from utils.http_client import HttpClient


class TMDbFetcher(BaseFetcher):
    endpoint = "https://api.themoviedb.org/3/trending/all/day"
    image_base = "https://www.themoviedb.org"

    def __init__(self, http: HttpClient | None = None) -> None:
        super().__init__()
        self.http = http or HttpClient()

    def fetch(self, source: SourceConfig, topics: Mapping[str, TopicConfig]) -> list[SourceItem]:
        api_key = os.getenv("TMDB_API_KEY")
        if not api_key:
            self.logger.info("Skipping TMDb source %s because TMDB_API_KEY is not configured", source.id)
            return []

        try:
            payload = self.http.get(self.endpoint, params={"api_key": api_key}).json()
        except Exception as exc:
            self.logger.warning("TMDb fetch failed: %s", exc)
            return []

        items: list[SourceItem] = []
        for row in payload.get("results", [])[:20]:
            media_type = row.get("media_type", "movie")
            title = row.get("title") or row.get("name")
            tmdb_id = row.get("id")
            url = f"{self.image_base}/{media_type}/{tmdb_id}" if tmdb_id else "https://www.themoviedb.org/"
            summary = row.get("overview") or f"Trending {media_type} on TMDb"
            items.extend(
                self.make_items_for_source_topics(
                    source,
                    title=title,
                    url=url,
                    published_at=row.get("release_date") or row.get("first_air_date"),
                    summary=summary,
                    language=source.language or "en",
                    raw_metadata={"tmdb": row},
                )
            )
        return items

