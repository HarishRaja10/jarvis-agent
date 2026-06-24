from __future__ import annotations

import json
import logging
import os
from typing import Iterable

import requests

from intelligence.dedupe import title_hash, url_hash
from models import SourceItem


class SupabaseStore:
    """Small server-side Supabase REST adapter.

    It expects tables named seen_items, briefing_history, and source_events.
    Use only with SUPABASE_SERVICE_ROLE_KEY in trusted server-side runtimes.
    """

    def __init__(self, url: str, service_role_key: str) -> None:
        self.url = url.rstrip("/")
        self.service_role_key = service_role_key
        self.logger = logging.getLogger(self.__class__.__name__)

    @classmethod
    def from_env(cls) -> "SupabaseStore | None":
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            return None
        return cls(url, key)

    def has_seen(self, item: SourceItem) -> bool:
        params = {
            "select": "id",
            "or": f"(url_hash.eq.{url_hash(item.url)},and(title_hash.eq.{title_hash(item.title)},topic_id.eq.{item.topic_id}))",
            "limit": "1",
        }
        try:
            response = requests.get(self._table_url("seen_items"), headers=self._headers(), params=params, timeout=15)
            response.raise_for_status()
            return bool(response.json())
        except Exception as exc:
            self.logger.warning("Supabase has_seen failed; treating item as unseen: %s", exc)
            return False

    def save_items(self, items: Iterable[SourceItem]) -> None:
        for item in items:
            self._post_table(
                "seen_items",
                {
                    "url_hash": url_hash(item.url),
                    "title_hash": title_hash(item.title),
                    "topic_id": item.topic_id,
                    "source_id": item.source_id,
                },
            )
            self._post_table(
                "source_events",
                {
                    "title": item.title,
                    "url": item.url,
                    "source": item.source_name,
                    "published_at": item.published_at.isoformat(),
                    "topic": item.topic_id,
                    "raw_summary": item.summary,
                    "trust_score": item.trust_score,
                    "confidence": item.confidence,
                    "raw_metadata": json.dumps(item.raw_metadata, ensure_ascii=False, default=str),
                },
            )

    def save_briefing(self, run_type: str, text_summary: str, item_count: int) -> None:
        self._post_table(
            "briefing_history",
            {"run_type": run_type, "text_summary": text_summary, "item_count": item_count},
        )

    def _post_table(self, table: str, payload: dict) -> None:
        try:
            response = requests.post(
                self._table_url(table),
                headers={**self._headers(), "Content-Type": "application/json", "Prefer": "return=minimal"},
                json=payload,
                timeout=15,
            )
            response.raise_for_status()
        except Exception as exc:
            self.logger.warning("Supabase insert failed for %s: %s", table, exc)

    def _table_url(self, table: str) -> str:
        return f"{self.url}/rest/v1/{table}"

    def _headers(self) -> dict[str, str]:
        return {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
        }

