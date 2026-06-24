from __future__ import annotations

import os
from typing import Mapping

import requests

from fetchers.base import BaseFetcher
from models import SourceConfig, SourceItem, TopicConfig
from utils.http_client import HttpClient


class RedditFetcher(BaseFetcher):
    token_url = "https://www.reddit.com/api/v1/access_token"
    api_base = "https://oauth.reddit.com"

    def __init__(self, http: HttpClient | None = None) -> None:
        super().__init__()
        self.http = http or HttpClient()

    def fetch(self, source: SourceConfig, topics: Mapping[str, TopicConfig]) -> list[SourceItem]:
        client_id = os.getenv("REDDIT_CLIENT_ID")
        client_secret = os.getenv("REDDIT_CLIENT_SECRET")
        user_agent = os.getenv("REDDIT_USER_AGENT") or "jarvis-briefing-agent/0.1"
        if not client_id or not client_secret:
            self.logger.info("Skipping Reddit source %s because credentials are not configured", source.id)
            return []

        token = self._get_token(client_id, client_secret, user_agent)
        if not token:
            return []

        headers = {"Authorization": f"Bearer {token}", "User-Agent": user_agent}
        subreddits = source.api_config.get("subreddits", [])
        limit = int(source.api_config.get("limit", 10))
        query = str(source.api_config.get("query") or self._query_for_topics(source, topics))
        items: list[SourceItem] = []
        for subreddit in subreddits:
            try:
                payload = self.http.get(
                    f"{self.api_base}/r/{subreddit}/search",
                    headers=headers,
                    params={"q": query, "restrict_sr": 1, "sort": "new", "limit": limit},
                ).json()
            except Exception as exc:
                self.logger.warning("Reddit fetch failed for r/%s: %s", subreddit, exc)
                continue

            for child in payload.get("data", {}).get("children", []):
                data = child.get("data", {})
                permalink = data.get("permalink")
                url = data.get("url") or (f"https://www.reddit.com{permalink}" if permalink else "")
                summary = data.get("selftext") or f"{data.get('score', 0)} score, {data.get('num_comments', 0)} comments"
                items.extend(
                    self.make_items_for_source_topics(
                        source,
                        title=data.get("title"),
                        url=url,
                        published_at=data.get("created_utc"),
                        summary=summary,
                        language="en",
                        source_name=f"Reddit r/{subreddit}",
                        raw_metadata={"reddit": data},
                    )
                )
        return items

    def _get_token(self, client_id: str, client_secret: str, user_agent: str) -> str | None:
        try:
            response = requests.post(
                self.token_url,
                auth=(client_id, client_secret),
                data={"grant_type": "client_credentials"},
                headers={"User-Agent": user_agent},
                timeout=15,
            )
            response.raise_for_status()
            return response.json().get("access_token")
        except Exception as exc:
            self.logger.warning("Reddit OAuth failed: %s", exc)
            return None

    def _query_for_topics(self, source: SourceConfig, topics: Mapping[str, TopicConfig]) -> str:
        keywords: list[str] = []
        for topic_id in source.topic_ids:
            topic = topics.get(topic_id)
            if topic:
                keywords.extend(topic.keywords[:4])
        return " OR ".join(keywords) or "AI"
