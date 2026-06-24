from __future__ import annotations

from datetime import datetime, timezone
from zoneinfo import ZoneInfo


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def to_timezone(value: datetime, timezone_name: str) -> datetime:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(ZoneInfo(timezone_name))


def parse_datetime(value: object) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(float(value), tz=timezone.utc)
    if not value:
        return now_utc()

    from dateutil import parser

    try:
        parsed = parser.parse(str(value))
    except (TypeError, ValueError, OverflowError):
        return now_utc()
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)
