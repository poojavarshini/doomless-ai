from __future__ import annotations

import asyncio
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
PRODUCTION = ROOT / "video-production"
CONFIG = PRODUCTION / "first-draft-revision.json"
OUTPUT = PRODUCTION / "work" / "first-draft-revision" / "voice"
TOOLS = ROOT / ".video-tools"
# Aria has a brighter, more conversational presentation style than the
# previous neutral read and fits an energetic startup pitch.
VOICE = "en-US-AriaNeural"

sys.path.insert(0, str(TOOLS))
import edge_tts  # type: ignore
import imageio_ffmpeg  # type: ignore


FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


async def generate(chapter: dict[str, object]) -> None:
    chapter_id = str(chapter["id"])
    mp3 = OUTPUT / f"{chapter_id}.mp3"
    wav = OUTPUT / f"{chapter_id}.wav"
    communicator = edge_tts.Communicate(
        text=str(chapter["script"]),
        voice=VOICE,
        rate="+1%",
        pitch="+2Hz",
        volume="+4%",
    )
    await communicator.save(str(mp3))
    subprocess.run(
        [
            FFMPEG, "-hide_banner", "-loglevel", "error",
            "-i", str(mp3),
            "-af", "highpass=f=72,lowpass=f=15500",
            "-ar", "48000", "-ac", "2",
            str(wav), "-y",
        ],
        check=True,
    )
    print(f"Generated {chapter_id}")


async def main() -> None:
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    voices = await edge_tts.list_voices()
    if not any(item.get("ShortName") == VOICE for item in voices):
        raise RuntimeError(f"Voice unavailable: {VOICE}")
    for chapter in config["chapters"]:
        await generate(chapter)
    print(f"Created {len(config['chapters'])} synchronized narration clips")


if __name__ == "__main__":
    asyncio.run(main())
