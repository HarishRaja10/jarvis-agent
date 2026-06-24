from __future__ import annotations

import logging
import time
from typing import Any

import requests


class HttpClient:
    def __init__(
        self,
        timeout_seconds: int = 15,
        retries: int = 2,
        user_agent: str = "JarvisBriefingAgent/0.1 (+https://github.com/)",
    ) -> None:
        self.timeout_seconds = timeout_seconds
        self.retries = retries
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": user_agent})
        self.logger = logging.getLogger(self.__class__.__name__)

    def get(self, url: str, **kwargs: Any) -> requests.Response:
        return self.request("GET", url, **kwargs)

    def post(self, url: str, **kwargs: Any) -> requests.Response:
        return self.request("POST", url, **kwargs)

    def request(self, method: str, url: str, **kwargs: Any) -> requests.Response:
        timeout = kwargs.pop("timeout", self.timeout_seconds)
        last_error: Exception | None = None
        for attempt in range(self.retries + 1):
            try:
                response = self.session.request(method, url, timeout=timeout, **kwargs)
                response.raise_for_status()
                return response
            except requests.RequestException as exc:
                last_error = exc
                if attempt >= self.retries:
                    break
                sleep_for = 0.5 * (attempt + 1)
                self.logger.debug("HTTP retry %s %s after %s: %s", method, url, sleep_for, exc)
                time.sleep(sleep_for)
        raise RuntimeError(f"HTTP {method} failed for {url}: {last_error}") from last_error

