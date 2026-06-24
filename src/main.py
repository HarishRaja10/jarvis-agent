from __future__ import annotations

import argparse
import logging
import os
from pathlib import Path

from config_loader import load_config
from delivery.telegram_text import send_text_message
from delivery.telegram_voice import generate_voice_note, send_voice_note
from fetchers.gdelt_fetcher import GDELTFetcher
from fetchers.hackernews_fetcher import HackerNewsFetcher
from fetchers.official_fetcher import OfficialFetcher
from fetchers.reddit_fetcher import RedditFetcher
from fetchers.rss_fetcher import RSSFetcher
from fetchers.tmdb_fetcher import TMDbFetcher
from fetchers.youtube_fetcher import YouTubeFetcher
from intelligence.action_advisor import add_action_suggestions
from intelligence.dedupe import dedupe_items
from intelligence.formatter import format_telegram_briefing
from intelligence.ranker import filter_by_topic_rules, group_by_topic, rank_items
from intelligence.summarizer import Summarizer
from intelligence.trust_score import score_items
from models import CONFIDENCE_ORDER, SourceItem
from storage.sqlite_store import default_sqlite_store
from storage.supabase_store import SupabaseStore
from utils.http_client import HttpClient
from utils.logging import configure_logging
from utils.time_utils import now_utc


def main() -> int:
    parser = argparse.ArgumentParser(description="Jarvis Briefing Agent")
    parser.add_argument("--run-type", choices=["morning", "evening", "manual"], default="manual")
    args = parser.parse_args()

    root_dir = Path(__file__).resolve().parents[1]
    _load_dotenv(root_dir / ".env")
    configure_logging()
    logger = logging.getLogger("jarvis")

    config = load_config(root_dir)
    store = _select_store(config.root_dir, config.agent.storage_provider)

    logger.info("Starting %s briefing", args.run_type)
    fetched = _fetch_all(config)
    logger.info("Fetched %s raw items", len(fetched))

    filtered = filter_by_topic_rules(fetched, config.topics)
    deduped = dedupe_items(filtered)
    unseen = [item for item in deduped if not store.has_seen(item)]
    logger.info("%s items after filtering, %s after dedupe, %s unseen", len(filtered), len(deduped), len(unseen))

    scored = score_items(unseen, config.trust_rules)
    ranked = rank_items(scored, config.topics, config.trust_rules)
    ranked = _filter_by_min_confidence(ranked, config.agent.min_confidence_to_send)
    add_action_suggestions(ranked)

    grouped = group_by_topic(ranked, config.topics)
    Summarizer().summarize(grouped, config.topics)

    generated_at = now_utc()
    text = format_telegram_briefing(
        grouped,
        config.topics,
        agent_name=config.agent.agent_name,
        run_type=args.run_type,
        timezone_name=config.agent.timezone,
        generated_at=generated_at,
    )

    delivered = send_text_message(text)
    if not delivered:
        print(text)

    voice_provider = os.getenv("VOICE_PROVIDER") or config.agent.voice_provider or "none"
    if config.agent.enable_voice or voice_provider.lower() != "none":
        audio_path = generate_voice_note(text)
        if audio_path:
            send_voice_note(audio_path)

    sent_items = [item for topic_items in grouped.values() for item in topic_items]
    store.save_items(sent_items)
    store.save_briefing(args.run_type, text, len(sent_items))
    logger.info("Briefing complete with %s sent items", len(sent_items))
    return 0


def _fetch_all(config) -> list[SourceItem]:
    http = HttpClient()
    fetchers = {
        "rss": RSSFetcher(http),
        "gdelt": GDELTFetcher(http),
        "hackernews": HackerNewsFetcher(http),
        "reddit": RedditFetcher(http),
        "youtube": YouTubeFetcher(http),
        "tmdb": TMDbFetcher(http),
        "official": OfficialFetcher(http),
    }
    logger = logging.getLogger("jarvis.fetch")
    all_items: list[SourceItem] = []
    for source in config.sources:
        if not source.enabled:
            continue
        fetcher = fetchers.get(source.type)
        if not fetcher:
            logger.warning("No fetcher registered for source type %s (%s)", source.type, source.id)
            continue
        try:
            items = fetcher.fetch(source, config.topics)
            all_items.extend(items)
            logger.info("Fetched %s items from %s", len(items), source.id)
        except Exception as exc:
            logger.warning("Source %s failed and was skipped: %s", source.id, exc)
    return all_items


def _filter_by_min_confidence(items: list[SourceItem], min_confidence: str) -> list[SourceItem]:
    minimum = CONFIDENCE_ORDER.get(min_confidence.lower(), CONFIDENCE_ORDER["medium"])
    return [item for item in items if CONFIDENCE_ORDER.get(item.confidence.lower(), 0) >= minimum]


def _select_store(root_dir: str, configured_provider: str):
    provider = os.getenv("STORAGE_PROVIDER", configured_provider).lower()
    if provider == "supabase":
        store = SupabaseStore.from_env()
        if store:
            return store
        logging.getLogger("jarvis.storage").warning("Supabase selected but credentials are missing; using SQLite")
    return default_sqlite_store(root_dir)


def _load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


if __name__ == "__main__":
    raise SystemExit(main())
