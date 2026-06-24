from __future__ import annotations

import logging
import os
import re
import subprocess
import tempfile
from pathlib import Path

import requests


def generate_voice_note(text: str) -> str | None:
    provider = (os.getenv("VOICE_PROVIDER") or "none").lower()
    if provider == "none":
        return None
    script = _spoken_script(text)
    if not script:
        return None
    try:
        if provider == "piper":
            return _generate_with_piper(script)
        if provider == "edge_tts":
            return _generate_with_edge_tts(script)
    except Exception as exc:
        logging.getLogger("telegram_voice").warning("Voice generation failed: %s", exc)
    return None


def send_voice_note(audio_path: str) -> bool:
    logger = logging.getLogger("telegram_voice")
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        logger.info("Telegram credentials missing; skipping voice delivery")
        return False
    try:
        with open(audio_path, "rb") as audio:
            response = requests.post(
                f"https://api.telegram.org/bot{token}/sendVoice",
                data={"chat_id": chat_id},
                files={"voice": audio},
                timeout=60,
            )
        response.raise_for_status()
        return True
    except Exception as exc:
        logger.warning("Telegram voice delivery failed: %s", exc)
        return False


def _spoken_script(text: str) -> str:
    without_urls = re.sub(r"https?://\S+", "", text)
    without_source_lines = "\n".join(
        line for line in without_urls.splitlines() if not line.strip().lower().startswith("sources:")
    )
    compact = re.sub(r"\s+", " ", without_source_lines).strip()
    intro = "Briefing ready. Calm mode engaged. "
    return (intro + compact)[:3500]


def _generate_with_piper(script: str) -> str | None:
    piper_bin = os.getenv("PIPER_BIN")
    piper_model = os.getenv("PIPER_MODEL")
    if not piper_bin or not piper_model:
        logging.getLogger("telegram_voice").info("Piper is selected but PIPER_BIN or PIPER_MODEL is missing")
        return None
    temp_dir = Path(tempfile.mkdtemp(prefix="jarvis-voice-"))
    wav_path = temp_dir / "briefing.wav"
    ogg_path = temp_dir / "briefing.ogg"
    subprocess.run([piper_bin, "-m", piper_model, "-f", str(wav_path)], input=script, text=True, check=True)
    return _convert_to_ogg(wav_path, ogg_path)


def _generate_with_edge_tts(script: str) -> str | None:
    temp_dir = Path(tempfile.mkdtemp(prefix="jarvis-voice-"))
    mp3_path = temp_dir / "briefing.mp3"
    ogg_path = temp_dir / "briefing.ogg"
    voice = os.getenv("EDGE_TTS_VOICE", "en-GB-RyanNeural")
    subprocess.run(
        [
            "python",
            "-m",
            "edge_tts",
            "--voice",
            voice,
            "--text",
            script,
            "--write-media",
            str(mp3_path),
        ],
        check=True,
    )
    return _convert_to_ogg(mp3_path, ogg_path)


def _convert_to_ogg(input_path: Path, output_path: Path) -> str | None:
    ffmpeg_bin = os.getenv("FFMPEG_BIN", "ffmpeg")
    subprocess.run(
        [
            ffmpeg_bin,
            "-y",
            "-i",
            str(input_path),
            "-c:a",
            "libopus",
            "-b:a",
            "32k",
            str(output_path),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=True,
    )
    return str(output_path)
