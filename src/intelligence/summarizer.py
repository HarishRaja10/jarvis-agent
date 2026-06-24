from __future__ import annotations

import json
import logging
import os
import re

from models import SourceItem, TopicConfig


class Summarizer:
    def __init__(self) -> None:
        self.logger = logging.getLogger(self.__class__.__name__)
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.gemini_model = os.getenv("GEMINI_MODEL") or "gemini-1.5-flash"

    def summarize(self, grouped: dict[str, list[SourceItem]], topics: dict[str, TopicConfig]) -> dict[str, list[SourceItem]]:
        all_items = [item for topic_items in grouped.values() for item in topic_items]
        if self.gemini_key and all_items:
            if self._summarize_with_gemini(all_items, topics):
                return grouped
        self._fallback_summarize(all_items, topics)
        return grouped

    def _summarize_with_gemini(self, items: list[SourceItem], topics: dict[str, TopicConfig]) -> bool:
        try:
            import google.generativeai as genai

            genai.configure(api_key=self.gemini_key)
            model = genai.GenerativeModel(self.gemini_model)
            response = model.generate_content(self._gemini_prompt(items, topics))
            text = getattr(response, "text", "") or ""
            parsed = self._parse_json(text)
        except Exception as exc:
            self.logger.warning("Gemini summarization failed; using fallback summary: %s", exc)
            return False

        if not isinstance(parsed, list):
            self.logger.warning("Gemini response was not a JSON list; using fallback summary")
            return False

        by_id = {str(row.get("id")): row for row in parsed if isinstance(row, dict)}
        if not by_id:
            return False

        for idx, item in enumerate(items, start=1):
            row = by_id.get(str(idx))
            if not row:
                continue
            item.brief_summary = _clean_ai_field(row.get("brief_summary")) or _fallback_summary(item)
            item.why_it_matters = _clean_ai_field(row.get("why_it_matters")) or _fallback_why(item, topics)
        missing = [item for item in items if not item.brief_summary or not item.why_it_matters]
        self._fallback_summarize(missing, topics)
        return True

    def _gemini_prompt(self, items: list[SourceItem], topics: dict[str, TopicConfig]) -> str:
        rows = []
        for idx, item in enumerate(items, start=1):
            topic_name = topics.get(item.topic_id).name if topics.get(item.topic_id) else item.topic_id
            rows.append(
                {
                    "id": idx,
                    "topic": topic_name,
                    "title": item.title,
                    "snippet": item.summary,
                    "source": item.source_name,
                    "url": item.url,
                    "confidence": item.confidence,
                    "political_confirmed": item.raw_metadata.get("political_confirmed"),
                }
            )
        return (
            "You are summarizing fetched public-source items for a personal Telegram briefing.\n"
            "Rules: use only the provided items, do not add facts, do not hallucinate, preserve names/titles, "
            "keep casual premium assistant tone, English with light Tamil flavour only where natural. "
            "For political items, do not state a claim as confirmed unless political_confirmed is true. "
            "Low-confidence items must be labelled as signals, not facts.\n"
            "Return valid JSON only: an array of objects with id, brief_summary, why_it_matters. "
            "Each summary should be one compact sentence and should not include markdown.\n"
            f"Items:\n{json.dumps(rows, ensure_ascii=False)}"
        )

    def _parse_json(self, text: str) -> object:
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            match = re.search(r"\[[\s\S]*\]", text)
            if match:
                return json.loads(match.group(0))
            raise

    def _fallback_summarize(self, items: list[SourceItem], topics: dict[str, TopicConfig]) -> None:
        for item in items:
            item.brief_summary = _fallback_summary(item)
            item.why_it_matters = _fallback_why(item, topics)


def _fallback_summary(item: SourceItem) -> str:
    if item.summary and item.summary.lower() != item.title.lower():
        return f"{item.title}: {item.summary}"
    return item.title


def _fallback_why(item: SourceItem, topics: dict[str, TopicConfig]) -> str:
    topic_name = topics.get(item.topic_id).name if topics.get(item.topic_id) else item.topic_id
    if item.topic_id == "tech_ai":
        return "It may affect tools, workflows, startups, or the AI market you track."
    if item.topic_id in {"tn_politics", "india_politics"}:
        confirmed = item.raw_metadata.get("political_confirmed")
        if confirmed is True:
            return "It can influence policy, elections, public services, or near-term civic decisions."
        return "It is worth watching, but the political claim still needs stronger confirmation."
    if item.topic_id == "movies_series":
        return "It helps track releases, trailers, and viewing picks without piracy or leak sources."
    return f"It is relevant to {topic_name}."


def _clean_ai_field(value: object) -> str:
    text = str(value or "").strip()
    return re.sub(r"\s+", " ", text)
