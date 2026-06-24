from __future__ import annotations

import html
import logging
import re
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Mapping

from models import SourceConfig, SourceItem, TopicConfig
from utils.time_utils import parse_datetime


def clean_text(value: object, max_length: int = 600) -> str:
    text = html.unescape(str(value or ""))
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > max_length:
        return text[: max_length - 1].rstrip() + "..."
    return text


class BaseFetcher(ABC):
    def __init__(self) -> None:
        self.logger = logging.getLogger(self.__class__.__name__)

    @abstractmethod
    def fetch(self, source: SourceConfig, topics: Mapping[str, TopicConfig]) -> list[SourceItem]:
        raise NotImplementedError

    def make_item(
        self,
        source: SourceConfig,
        *,
        title: object,
        url: object,
        topic_id: str,
        published_at: object | None = None,
        summary: object = "",
        language: str | None = None,
        source_name: str | None = None,
        raw_metadata: dict | None = None,
    ) -> SourceItem | None:
        title_text = clean_text(title, max_length=260)
        url_text = str(url or "").strip()
        if not title_text or not url_text:
            return None

        published = parse_datetime(published_at) if published_at else datetime.now().astimezone()
        return SourceItem(
            title=title_text,
            url=url_text,
            source_id=source.id,
            source_name=source_name or source.name,
            published_at=published,
            summary=clean_text(summary),
            language=language or source.language or "unknown",
            topic_id=topic_id,
            raw_metadata=raw_metadata or {},
            trust_tier=source.trust_tier,
        )

    def make_items_for_source_topics(
        self,
        source: SourceConfig,
        *,
        title: object,
        url: object,
        published_at: object | None = None,
        summary: object = "",
        language: str | None = None,
        source_name: str | None = None,
        raw_metadata: dict | None = None,
    ) -> list[SourceItem]:
        items: list[SourceItem] = []
        for topic_id in source.topic_ids:
            item = self.make_item(
                source,
                title=title,
                url=url,
                topic_id=topic_id,
                published_at=published_at,
                summary=summary,
                language=language,
                source_name=source_name,
                raw_metadata=raw_metadata,
            )
            if item:
                items.append(item)
        return items

