from __future__ import annotations

from models import CONFIDENCE_ORDER, SourceItem


def add_action_suggestions(items: list[SourceItem]) -> list[SourceItem]:
    for item in items:
        item.action_suggestion = _action_for_item(item)
    return items


def _action_for_item(item: SourceItem) -> str:
    if CONFIDENCE_ORDER.get(item.confidence.lower(), 0) < CONFIDENCE_ORDER["medium"]:
        return "No action yet. Wait for a stronger source before reacting."

    if item.topic_id == "tech_ai":
        return "Skim the source, then bookmark it if it affects your tools, workflows, or product ideas."
    if item.topic_id == "tn_politics":
        if item.raw_metadata.get("political_confirmed") is True:
            return "Track official follow-up and check if it affects Tamil Nadu services, travel, or civic plans."
        return "Treat it as a reported signal and wait for official confirmation before changing plans."
    if item.topic_id == "india_politics":
        if item.raw_metadata.get("political_confirmed") is True:
            return "Check the official notice and watch for policy or deadline changes."
        return "Keep it on watch, but do not treat it as final until an official or second reputed source confirms it."
    if item.topic_id == "movies_series":
        return "Add it to the watchlist only if the source is official or reputed; avoid leak/piracy links."
    return "Review the source and decide if it needs a follow-up."

