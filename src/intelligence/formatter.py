from __future__ import annotations

from datetime import datetime

from models import SourceItem, TopicConfig
from utils.time_utils import to_timezone


def format_telegram_briefing(
    grouped: dict[str, list[SourceItem]],
    topics: dict[str, TopicConfig],
    *,
    agent_name: str,
    run_type: str,
    timezone_name: str,
    generated_at: datetime,
) -> str:
    local_time = to_timezone(generated_at, timezone_name)
    greeting = _greeting(run_type)
    lines = [
        f"{greeting}. {agent_name} briefing is ready.",
        f"Run: {run_type.title()} | Time: {local_time.strftime('%d %b %Y, %I:%M %p %Z')}",
        "",
    ]

    top_items = _top_items(grouped, limit=3)
    if top_items:
        lines.append("Top 3 important updates")
        for index, item in enumerate(top_items, start=1):
            lines.append(f"{index}. {_signal_prefix(item)}{item.brief_summary or item.title}")
        lines.append("")

    for topic_id, items in grouped.items():
        topic = topics.get(topic_id)
        topic_name = topic.name if topic else topic_id
        lines.append(topic_name)
        for item in items:
            lines.extend(_format_item(item))
            lines.append("")

    if not grouped:
        lines.append("No strong public-source updates found for this run. Quiet board, boss.")

    lines.append("Source rule: political claims need one official source or two reputed sources before they are treated as confirmed.")
    return "\n".join(lines).strip()


def _format_item(item: SourceItem) -> list[str]:
    return [
        f"- {_signal_prefix(item)}{item.brief_summary or item.title}",
        f"  Why it matters: {item.why_it_matters}",
        f"  Action: {item.action_suggestion}",
        f"  Confidence: {item.confidence} | Trust score: {item.trust_score}",
        f"  Sources: {_source_links(item)}",
    ]


def _source_links(item: SourceItem) -> str:
    seen: set[tuple[str, str]] = set()
    parts: list[str] = []
    for source in item.supporting_sources:
        name = source.get("name") or item.source_name
        url = source.get("url") or item.url
        marker = (name, url)
        if marker in seen:
            continue
        seen.add(marker)
        parts.append(f"{name}: {url}")
    return "; ".join(parts) if parts else f"{item.source_name}: {item.url}"


def _signal_prefix(item: SourceItem) -> str:
    if item.raw_metadata.get("signal_label") == "unverified signal":
        return "Unverified signal: "
    if item.topic_id in {"tn_politics", "india_politics"} and item.raw_metadata.get("political_confirmed") is False:
        return "Reported signal: "
    return ""


def _top_items(grouped: dict[str, list[SourceItem]], limit: int) -> list[SourceItem]:
    all_items = [item for items in grouped.values() for item in items]
    return sorted(all_items, key=lambda item: item.rank_score, reverse=True)[:limit]


def _greeting(run_type: str) -> str:
    if run_type == "morning":
        return "Good morning"
    if run_type == "evening":
        return "Good evening"
    return "Manual check"

