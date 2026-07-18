from __future__ import annotations

import asyncio
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
PRODUCTION = ROOT / "video-production"
OUTPUT = PRODUCTION / "work" / "voice"
TOOLS = ROOT / ".video-tools"
VOICE = "en-US-AriaNeural"
RATE = "+4%"
PITCH = "+2Hz"
VOLUME = "+0%"

sys.path.insert(0, str(TOOLS))

import edge_tts  # type: ignore
import imageio_ffmpeg  # type: ignore


FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


async def generate_chapter(chapter: dict[str, object]) -> dict[str, object]:
    chapter_id = str(chapter["id"])
    mp3_path = OUTPUT / f"{chapter_id}.mp3"
    wav_path = OUTPUT / f"{chapter_id}.wav"
    transcript_path = OUTPUT / f"{chapter_id}.txt"

    communicator = edge_tts.Communicate(
        text=str(chapter["script"]),
        voice=VOICE,
        rate=RATE,
        volume=VOLUME,
        pitch=PITCH,
    )
    await communicator.save(str(mp3_path))

    subprocess.run(
        [
            FFMPEG,
            "-hide_banner",
            "-loglevel",
            "error",
            "-i",
            str(mp3_path),
            "-af",
            "highpass=f=70,lowpass=f=16000",
            "-ar",
            "48000",
            "-ac",
            "2",
            str(wav_path),
            "-y",
        ],
        check=True,
    )

    transcript_path.write_text(f"{chapter['script']}\n", encoding="utf-8")
    print(f"Generated {chapter_id} with {VOICE}")
    return {
        "id": chapter_id,
        "model": "Microsoft Edge Neural TTS",
        "voice": VOICE,
        "style": "professional, positive, confident",
        "rate": RATE,
        "pitch": PITCH,
        "outputPath": str(wav_path.relative_to(ROOT)),
        "transcriptPath": str(transcript_path.relative_to(ROOT)),
    }


async def main() -> None:
    config = json.loads(
        (PRODUCTION / "voiceover.json").read_text(encoding="utf-8")
    )
    OUTPUT.mkdir(parents=True, exist_ok=True)

    available_voices = await edge_tts.list_voices()
    if not any(voice.get("ShortName") == VOICE for voice in available_voices):
        raise RuntimeError(f"Requested neural voice is unavailable: {VOICE}")

    manifest = []
    for chapter in config["chapters"]:
        manifest.append(await generate_chapter(chapter))

    (OUTPUT / "manifest.json").write_text(
        f"{json.dumps(manifest, indent=2)}\n", encoding="utf-8"
    )
    print(f"Neural voiceover complete: {len(manifest)} chapters")


if __name__ == "__main__":
    asyncio.run(main())
