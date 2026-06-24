from __future__ import annotations

import json
import os
import sqlite3
from pathlib import Path
from typing import Iterable

from intelligence.dedupe import title_hash, url_hash
from models import SourceItem


class SQLiteStore:
    def __init__(self, db_path: str) -> None:
        self.db_path = db_path
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path)

    def _initialize(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                create table if not exists seen_items (
                    id integer primary key autoincrement,
                    url_hash text unique,
                    title_hash text,
                    topic_id text,
                    first_seen_at text not null,
                    source_id text
                )
                """
            )
            conn.execute(
                """
                create table if not exists briefing_history (
                    id integer primary key autoincrement,
                    run_type text not null,
                    generated_at text not null,
                    text_summary text not null,
                    item_count integer not null
                )
                """
            )
            conn.execute(
                """
                create table if not exists source_events (
                    id integer primary key autoincrement,
                    title text not null,
                    url text not null,
                    source text not null,
                    published_at text,
                    topic text,
                    raw_summary text,
                    trust_score integer,
                    confidence text,
                    raw_metadata text
                )
                """
            )
            conn.execute("create index if not exists idx_seen_title on seen_items(title_hash)")
            conn.execute("create index if not exists idx_source_events_topic on source_events(topic)")

    def has_seen(self, item: SourceItem) -> bool:
        with self._connect() as conn:
            row = conn.execute(
                """
                select 1 from seen_items
                where url_hash = ? or (title_hash = ? and topic_id = ?)
                limit 1
                """,
                (url_hash(item.url), title_hash(item.title), item.topic_id),
            ).fetchone()
        return row is not None

    def save_items(self, items: Iterable[SourceItem]) -> None:
        with self._connect() as conn:
            for item in items:
                conn.execute(
                    """
                    insert or ignore into seen_items (url_hash, title_hash, topic_id, first_seen_at, source_id)
                    values (?, ?, ?, datetime('now'), ?)
                    """,
                    (url_hash(item.url), title_hash(item.title), item.topic_id, item.source_id),
                )
                conn.execute(
                    """
                    insert into source_events
                    (title, url, source, published_at, topic, raw_summary, trust_score, confidence, raw_metadata)
                    values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        item.title,
                        item.url,
                        item.source_name,
                        item.published_at.isoformat(),
                        item.topic_id,
                        item.summary,
                        item.trust_score,
                        item.confidence,
                        json.dumps(item.raw_metadata, ensure_ascii=False, default=str),
                    ),
                )

    def save_briefing(self, run_type: str, text_summary: str, item_count: int) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                insert into briefing_history (run_type, generated_at, text_summary, item_count)
                values (?, datetime('now'), ?, ?)
                """,
                (run_type, text_summary, item_count),
            )


def default_sqlite_store(root_dir: str) -> SQLiteStore:
    configured_path = os.getenv("SQLITE_DB_PATH", "data/jarvis.sqlite3")
    db_path = configured_path
    if not os.path.isabs(db_path):
        db_path = str(Path(root_dir) / db_path)
    return SQLiteStore(db_path)

