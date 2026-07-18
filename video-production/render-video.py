from __future__ import annotations

import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
PRODUCTION = ROOT / "video-production"
WORK = PRODUCTION / "work"
OUTPUT = PRODUCTION / "output"
SOURCE_DECK = ROOT / "DoomLess_Demo.mp4"
LIVE_RECORDING = Path(
    r"C:\Users\Pooja\OneDrive\Desktop\DOOMLESS AI\dommless demo 1.mp4"
)
CONFIG = json.loads((PRODUCTION / "voiceover.json").read_text(encoding="utf-8"))
WIDTH = 1920
HEIGHT = 1080
FPS = 30
CHAPTER_DURATIONS = [30.0, 30.0, 31.0, 30.0, 34.0, 30.0]
CHAPTER_CROSSFADE = 1.0
SLIDE_CROSSFADE = 0.6


def get_ffmpeg() -> str:
    sys.path.insert(0, str(ROOT / ".video-tools"))
    import imageio_ffmpeg  # type: ignore

    return imageio_ffmpeg.get_ffmpeg_exe()


FFMPEG = get_ffmpeg()


def run(args: list[str]) -> None:
    print("Rendering:", " ".join(args[:8]), "..." if len(args) > 8 else "")
    subprocess.run(args, check=True)


def ffmpeg(*args: str) -> None:
    run([FFMPEG, "-hide_banner", "-loglevel", "error", *args])


def atempo_chain(factor: float) -> str:
    filters: list[str] = []
    while factor > 2.0:
        filters.append("atempo=2.0")
        factor /= 2.0
    while factor < 0.5:
        filters.append("atempo=0.5")
        factor /= 0.5
    filters.append(f"atempo={factor:.8f}")
    return ",".join(filters)


def probe_duration(path: Path) -> float:
    result = subprocess.run(
        [FFMPEG, "-hide_banner", "-i", str(path), "-f", "null", "NUL"],
        capture_output=True,
        text=True,
    )
    for line in result.stderr.splitlines():
        if "Duration:" not in line:
            continue
        value = line.split("Duration:", 1)[1].split(",", 1)[0].strip()
        hours, minutes, seconds = value.split(":")
        return int(hours) * 3600 + int(minutes) * 60 + float(seconds)
    raise RuntimeError(f"Unable to read duration for {path}")


def extract_slide(second: int, output: Path) -> None:
    ffmpeg(
        "-ss",
        str(second),
        "-i",
        str(SOURCE_DECK),
        "-frames:v",
        "1",
        "-q:v",
        "2",
        str(output),
        "-y",
    )


def create_still_chapter(
    images: list[Path], duration: float, output: Path, chapter_number: int
) -> None:
    segment_duration = (duration + (len(images) - 1) * SLIDE_CROSSFADE) / len(images)
    args: list[str] = []
    for image in images:
        args.extend(
            ["-loop", "1", "-framerate", str(FPS), "-t", f"{segment_duration:.4f}", "-i", str(image)]
        )

    filters: list[str] = []
    for index in range(len(images)):
        filters.append(
            f"[{index}:v]scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=increase,"
            f"crop={WIDTH}:{HEIGHT},setsar=1,fps={FPS},format=yuv420p[v{index}]"
        )

    current = "v0"
    for index in range(1, len(images)):
        output_label = f"x{index}"
        offset = index * (segment_duration - SLIDE_CROSSFADE)
        filters.append(
            f"[{current}][v{index}]xfade=transition=fade:duration={SLIDE_CROSSFADE}:"
            f"offset={offset:.4f}[{output_label}]"
        )
        current = output_label

    filters.append(f"[{current}]trim=duration={duration},setpts=PTS-STARTPTS[outv]")
    ffmpeg(
        *args,
        "-filter_complex",
        ";".join(filters),
        "-map",
        "[outv]",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(output),
        "-y",
    )


def create_live_chapter(output: Path) -> None:
    clips = [(0.0, 7.0), (8.0, 15.0), (20.0, 27.0), (45.0, 52.0), (60.0, 67.0)]
    filters: list[str] = []
    for index, (start, end) in enumerate(clips):
        filters.append(
            f"[0:v]trim=start={start}:end={end},setpts=PTS-STARTPTS,"
            f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=increase,"
            f"crop={WIDTH}:{HEIGHT},setsar=1,fps={FPS},format=yuv420p[v{index}]"
        )

    current = "v0"
    clip_duration = clips[0][1] - clips[0][0]
    for index in range(1, len(clips)):
        output_label = f"x{index}"
        offset = index * (clip_duration - CHAPTER_CROSSFADE)
        filters.append(
            f"[{current}][v{index}]xfade=transition=fade:duration={CHAPTER_CROSSFADE}:"
            f"offset={offset:.4f}[{output_label}]"
        )
        current = output_label

    font = str(Path(os.environ.get("WINDIR", r"C:\Windows")) / "Fonts" / "segoeuib.ttf").replace("\\", "/").replace(":", "\\:")
    label = "LIVE BETA  •  INSTAGRAM REELS"
    filters.append(
        f"[{current}]trim=duration=31,setpts=PTS-STARTPTS,"
        f"drawtext=fontfile='{font}':text='{label}':fontcolor=0xA8F5CF:fontsize=32:"
        "x=58:y=46:box=1:boxcolor=0x071A16CC:boxborderw=16:"
        "enable='between(t,0,6)'[outv]"
    )
    ffmpeg(
        "-i",
        str(LIVE_RECORDING),
        "-filter_complex",
        ";".join(filters),
        "-map",
        "[outv]",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(output),
        "-y",
    )


def combine_chapters(chapters: list[Path], output: Path) -> None:
    args: list[str] = []
    for chapter in chapters:
        args.extend(["-i", str(chapter)])

    filters: list[str] = []
    current = "0:v"
    elapsed = CHAPTER_DURATIONS[0]
    for index in range(1, len(chapters)):
        output_label = f"chapter{index}"
        offset = elapsed - CHAPTER_CROSSFADE
        filters.append(
            f"[{current}][{index}:v]xfade=transition=fade:duration={CHAPTER_CROSSFADE}:"
            f"offset={offset:.4f}[{output_label}]"
        )
        current = output_label
        elapsed += CHAPTER_DURATIONS[index] - CHAPTER_CROSSFADE

    filters.append(f"[{current}]trim=duration=180,setpts=PTS-STARTPTS[outv]")
    ffmpeg(
        *args,
        "-filter_complex",
        ";".join(filters),
        "-map",
        "[outv]",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        str(output),
        "-y",
    )


def prepare_voiceover() -> tuple[Path, list[dict[str, object]]]:
    voice_dir = WORK / "voice"
    processed_dir = WORK / "voice-processed"
    processed_dir.mkdir(parents=True, exist_ok=True)
    processed: list[Path] = []
    chapters = CONFIG["chapters"]

    for chapter in chapters:
        source = voice_dir / f"{chapter['id']}.wav"
        if not source.exists():
            raise FileNotFoundError(
                f"Missing {source}. Run generate-voiceover.mjs before rendering."
            )
        target = processed_dir / f"{chapter['id']}.wav"
        source_duration = probe_duration(source)
        factor = source_duration / float(chapter["targetDuration"])
        ffmpeg(
            "-i",
            str(source),
            "-af",
            f"{atempo_chain(factor)},loudnorm=I=-16:TP=-1.5:LRA=7,"
            "afade=t=in:st=0:d=0.08,afade=t=out:st="
            f"{float(chapter['targetDuration']) - 0.12:.3f}:d=0.12",
            "-t",
            f"{float(chapter['targetDuration']):.3f}",
            "-ar",
            "48000",
            "-ac",
            "2",
            str(target),
            "-y",
        )
        processed.append(target)

    args: list[str] = []
    filters: list[str] = []
    for index, (chapter, audio_path) in enumerate(zip(chapters, processed)):
        args.extend(["-i", str(audio_path)])
        delay_ms = round(float(chapter["start"]) * 1000)
        filters.append(f"[{index}:a]adelay={delay_ms}|{delay_ms}[a{index}]")

    mix_inputs = "".join(f"[a{index}]" for index in range(len(processed)))
    filters.append(
        f"{mix_inputs}amix=inputs={len(processed)}:duration=longest:normalize=0,"
        "apad=pad_dur=180,atrim=duration=180[voice]"
    )
    voice_track = WORK / "voiceover-180.wav"
    ffmpeg(
        *args,
        "-filter_complex",
        ";".join(filters),
        "-map",
        "[voice]",
        "-ar",
        "48000",
        "-ac",
        "2",
        str(voice_track),
        "-y",
    )
    return voice_track, chapters


def ass_time(seconds: float) -> str:
    centiseconds = round(seconds * 100)
    hours, centiseconds = divmod(centiseconds, 360000)
    minutes, centiseconds = divmod(centiseconds, 6000)
    whole_seconds, centiseconds = divmod(centiseconds, 100)
    return f"{hours}:{minutes:02d}:{whole_seconds:02d}.{centiseconds:02d}"


def create_captions(chapters: list[dict[str, object]]) -> Path:
    header = """[Script Info]
Title: DoomLess AI three-minute demo
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Segoe UI Semibold,45,&H00FFFFFF,&H000000FF,&HCC02110D,&HCC02110D,-1,0,0,0,100,100,0,0,3,2,0,2,110,110,52,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events: list[str] = []
    for chapter in chapters:
        lines = chapter["captions"]
        start = float(chapter["start"])
        duration = float(chapter["targetDuration"])
        weights = [max(1, len(str(line).split())) for line in lines]
        total = sum(weights)
        cursor = start
        for index, (line, weight) in enumerate(zip(lines, weights)):
            line_duration = duration * weight / total
            end = start + duration if index == len(lines) - 1 else cursor + line_duration
            safe_line = str(line).replace("\n", " ").replace("{", "(").replace("}", ")")
            events.append(
                f"Dialogue: 0,{ass_time(cursor)},{ass_time(end)},Caption,,0,0,0,,{safe_line}"
            )
            cursor = end

    caption_path = WORK / "doomless-captions.ass"
    caption_path.write_text(header + "\n".join(events) + "\n", encoding="utf-8-sig")
    return caption_path


def render_final(video: Path, voice: Path, captions: Path, output: Path) -> None:
    ass_path = str(captions).replace("\\", "/").replace(":", "\\:")
    audio_filter = (
        "aevalsrc='0.010*sin(2*PI*110*t)+0.007*sin(2*PI*164.81*t)+"
        "0.005*sin(2*PI*220*t)':s=48000:d=180,"
        "lowpass=f=900,afade=t=in:st=0:d=3,afade=t=out:st=176:d=4[bed];"
        "[1:a]volume=1.0[voice];[bed][voice]amix=inputs=2:duration=first:normalize=0,"
        "alimiter=limit=0.92[outa]"
    )
    filter_complex = (
        f"[0:v]ass=filename='{ass_path}',format=yuv420p[outv];{audio_filter}"
    )
    ffmpeg(
        "-i",
        str(video),
        "-i",
        str(voice),
        "-filter_complex",
        filter_complex,
        "-map",
        "[outv]",
        "-map",
        "[outa]",
        "-t",
        "180",
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "18",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        str(output),
        "-y",
    )


def main() -> None:
    if not SOURCE_DECK.exists():
        raise FileNotFoundError(SOURCE_DECK)
    if not LIVE_RECORDING.exists():
        raise FileNotFoundError(LIVE_RECORDING)

    reuse_visuals = os.environ.get("DOOMLESS_REUSE_VISUALS") == "1"
    if not reuse_visuals:
        shutil.rmtree(WORK / "render", ignore_errors=True)
    slides_dir = WORK / "render" / "slides"
    chapters_dir = WORK / "render" / "chapters"
    slides_dir.mkdir(parents=True, exist_ok=True)
    chapters_dir.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)

    silent_video = WORK / "render" / "doomless-silent-180.mp4"
    if not reuse_visuals or not silent_video.exists():
        slide_seconds = [5, 15, 25, 35, 45, 55, 85, 95, 105, 115, 125, 135, 145, 155, 165, 175]
        slides: dict[int, Path] = {}
        for second in slide_seconds:
            output = slides_dir / f"slide-{second:03d}.jpg"
            extract_slide(second, output)
            slides[second] = output

        chapter_specs = [
            ([ROOT / "public" / "og-beta.png", slides[5], slides[15], slides[25]], 30.0),
            ([slides[35], slides[45], slides[55]], 30.0),
            (None, 31.0),
            ([slides[85], slides[95], slides[105], slides[115]], 30.0),
            ([slides[125], slides[135], slides[145]], 34.0),
            ([slides[155], slides[165], slides[175]], 30.0),
        ]

        chapter_paths: list[Path] = []
        for index, (images, duration) in enumerate(chapter_specs, start=1):
            output = chapters_dir / f"chapter-{index:02d}.mp4"
            if images is None:
                create_live_chapter(output)
            else:
                create_still_chapter(images, duration, output, index)
            chapter_paths.append(output)
        combine_chapters(chapter_paths, silent_video)
    voice_track, chapters = prepare_voiceover()
    captions = create_captions(chapters)
    output_name = os.environ.get(
        "DOOMLESS_VIDEO_OUTPUT", "DoomLess_AI_3min_First_Draft.mp4"
    )
    final_output = OUTPUT / output_name
    render_final(silent_video, voice_track, captions, final_output)
    print(f"Created {final_output}")


if __name__ == "__main__":
    main()
