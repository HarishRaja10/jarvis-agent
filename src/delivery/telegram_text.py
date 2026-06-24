from __future__ import annotations

import logging
import os

import requests

TELEGRAM_SAFE_LIMIT = 3900


def split_telegram_message(text: str, limit: int = TELEGRAM_SAFE_LIMIT) -> list[str]:
    if len(text) <= limit:
        return [text]
    chunks: list[str] = []
    current: list[str] = []
    current_len = 0
    for line in text.splitlines():
        extra = len(line) + 1
        if current and current_len + extra > limit:
            chunks.append("\n".join(current).strip())
            current = []
            current_len = 0
        if extra > limit:
            chunks.append(line[:limit])
            continue
        current.append(line)
        current_len += extra
    if current:
        chunks.append("\n".join(current).strip())
    return [chunk for chunk in chunks if chunk]


def send_text_message(text: str) -> bool:
    logger = logging.getLogger("telegram_text")
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        logger.info("Telegram credentials missing; skipping Telegram delivery")
        return False

    ok = True
    for chunk in split_telegram_message(text):
        try:
            response = requests.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={"chat_id": chat_id, "text": chunk, "disable_web_page_preview": True},
                timeout=20,
            )
            response.raise_for_status()
        except Exception as exc:
            logger.warning("Telegram text delivery failed: %s", exc)
            ok = False
    return ok

