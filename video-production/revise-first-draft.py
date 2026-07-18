from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
PRODUCTION = ROOT / "video-production"
WORK = PRODUCTION / "work" / "first-draft-revision"
OUTPUT = PRODUCTION / "output"
SOURCE = PRODUCTION / "work" / "render" / "doomless-silent-180.mp4"
KPI_SLIDE = PRODUCTION / "work" / "hackathon-story" / "slides" / "kpi.png"
CODEX_SLIDE = PRODUCTION / "work" / "hackathon-story" / "slides" / "codex.png"
SITE_CAPTURES = PRODUCTION / "work" / "90sec-site"
JOURNEY = PRODUCTION / "work" / "user-journey"
SCROLLING_CLIP = Path(r"C:\Users\Pooja\Downloads\Person_scrolling_smartphone_in_bed_202607151047.mp4")
FRUSTRATED_CLIP = Path(r"C:\Users\Pooja\Downloads\Person_frustrated_with_smartphone_202607151055.mp4")
NEW_DEMO = Path(r"C:\Users\Pooja\OneDrive\Desktop\DOOMLESS AI\dommless demo 1.mp4")
MUSIC = PRODUCTION / "work" / "positive-corporate-music.wav"
CLEAN = PRODUCTION / "work" / "clean-diagrams"
FUTURE_VIDEO = CLEAN / "future-animated.mp4"
VOICE_DIR = WORK / "voice"
CONFIG = json.loads((PRODUCTION / "first-draft-revision.json").read_text(encoding="utf-8"))
FINAL = OUTPUT / "DoomLess_AI_3min_First_Draft_Revised.mp4"

WIDTH = 1920
HEIGHT = 1080
FPS = 30
DURATION = 180.0

sys.path.insert(0, str(ROOT / ".video-tools"))
import imageio_ffmpeg  # type: ignore


FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def ffmpeg(*args: str) -> None:
    command = [FFMPEG, "-hide_banner", "-loglevel", "error", *args]
    print("Revising:", " ".join(command[:9]), "..." if len(command) > 9 else "")
    subprocess.run(command, check=True)


def normalize() -> str:
    return (
        f"scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=increase,"
        f"crop={WIDTH}:{HEIGHT},setsar=1,fps={FPS},format=yuv420p,settb=AVTB"
    )


def edit_visuals(output: Path) -> None:
    filters = [
        f"[0:v]trim=start=0:end=10,setpts=PTS-STARTPTS,{normalize()},tpad=stop_mode=clone:stop_duration=0.35[opening]",
        f"[6:v]trim=start=0:end=10,setpts=PTS-STARTPTS,{normalize()},tpad=stop_mode=clone:stop_duration=0.35[scrolling]",
        f"[14:v]trim=duration=10,setpts=PTS-STARTPTS,{normalize()},tpad=stop_mode=clone:stop_duration=0.35[fatigue]",
        # The legacy source flashes an unrelated Reel during its final five
        # seconds. Stop on the completed Digital Nutrition metrics frame and
        # hold it cleanly until the GPT section begins.
        f"[0:v]trim=start=30:end=55,setpts=PTS-STARTPTS,{normalize()},tpad=stop_mode=clone:stop_duration=5.35[solution]",
        f"[12:v]trim=duration=10,setpts=PTS-STARTPTS,{normalize()},tpad=stop_mode=clone:stop_duration=0.35[ai]",
        f"[17:v]trim=duration=10,setpts=PTS-STARTPTS,{normalize()},tpad=stop_mode=clone:stop_duration=0.35[codex1]",
        f"[2:v]trim=duration=10,setpts=PTS-STARTPTS,{normalize()},tpad=stop_mode=clone:stop_duration=0.35[codex2]",
        f"[11:v]trim=start=0:end=20,setpts=PTS-STARTPTS,{normalize()},tpad=stop_mode=clone:stop_duration=0.35[demo]",
        f"[1:v]trim=duration=10,setpts=PTS-STARTPTS,{normalize()},tpad=stop_mode=clone:stop_duration=0.35[kpi]",
        f"[8:v]trim=duration=10,setpts=PTS-STARTPTS,{normalize()},tpad=stop_mode=clone:stop_duration=0.35[decision]",
        f"[9:v]trim=duration=10,setpts=PTS-STARTPTS,{normalize()},tpad=stop_mode=clone:stop_duration=0.35[interrupt]",
        f"[10:v]trim=duration=10,setpts=PTS-STARTPTS,{normalize()},tpad=stop_mode=clone:stop_duration=0.35[summary]",
        # Keep the corrected future graphic through the entire closing. The
        # legacy source frame used here before contained overlapping labels.
        # Use three distinct closing visuals: platform expansion, the mission,
        # and a concise final card. Durations compensate for crossfades so the
        # combined section remains exactly 30 seconds.
        f"[13:v]trim=duration=10.4,setpts=PTS-STARTPTS,{normalize()}[futuresection]",
        f"[16:v]trim=duration=14.35,setpts=PTS-STARTPTS,{normalize()}[mission]",
        f"[15:v]trim=duration=6.35,setpts=PTS-STARTPTS,{normalize()}[closing]",
        "[futuresection][mission]xfade=transition=fade:duration=0.55:offset=9.85[futuremission]",
        "[futuremission][closing]xfade=transition=fade:duration=0.55:offset=23.65[after]",
        "[opening][scrolling]xfade=transition=fade:duration=0.35:offset=10[x1]",
        "[x1][fatigue]xfade=transition=fade:duration=0.35:offset=20[x2]",
        "[x2][solution]xfade=transition=fade:duration=0.35:offset=30[x3]",
        "[x3][ai]xfade=transition=fade:duration=0.35:offset=60[x4]",
        "[x4][codex1]xfade=transition=fade:duration=0.35:offset=70[x5]",
        "[x5][demo]xfade=transition=fade:duration=0.35:offset=80[x6]",
        "[x6][decision]xfade=transition=fade:duration=0.35:offset=100[x7]",
        "[x7][interrupt]xfade=transition=fade:duration=0.35:offset=110[x8]",
        "[x8][summary]xfade=transition=fade:duration=0.35:offset=120[x9]",
        "[x9][kpi]xfade=transition=fade:duration=0.35:offset=130[x10]",
        "[x10][codex2]xfade=transition=fade:duration=0.35:offset=140[x11]",
        "[x11][after]xfade=transition=fade:duration=0.35:offset=150,"
        "trim=end_frame=5400,setpts=PTS-STARTPTS,"
        "eq=brightness=0.028:contrast=1.045:saturation=1.06,format=yuv420p[outv]",
    ]
    ffmpeg(
        "-i", str(SOURCE),
        "-loop", "1", "-framerate", str(FPS), "-t", "10", "-i", str(KPI_SLIDE),
        "-loop", "1", "-framerate", str(FPS), "-t", "10", "-i", str(CODEX_SLIDE),
        "-loop", "1", "-framerate", str(FPS), "-t", "3.6", "-i", str(SITE_CAPTURES / "02-sample-label.png"),
        "-loop", "1", "-framerate", str(FPS), "-t", "3.6", "-i", str(SITE_CAPTURES / "04-risk-result.png"),
        "-loop", "1", "-framerate", str(FPS), "-t", "3.6", "-i", str(SITE_CAPTURES / "06-score-bands.png"),
        "-i", str(SCROLLING_CLIP),
        "-i", str(FRUSTRATED_CLIP),
        "-loop", "1", "-framerate", str(FPS), "-t", "10", "-i", str(JOURNEY / "01-decision.png"),
        "-loop", "1", "-framerate", str(FPS), "-t", "10", "-i", str(JOURNEY / "02-interrupt.png"),
        "-loop", "1", "-framerate", str(FPS), "-t", "10", "-i", str(JOURNEY / "03-summary.png"),
        "-i", str(NEW_DEMO),
        "-loop", "1", "-framerate", str(FPS), "-t", "10", "-i", str(CLEAN / "gpt-clean.png"),
        "-i", str(FUTURE_VIDEO),
        "-loop", "1", "-framerate", str(FPS), "-t", "10", "-i", str(CLEAN / "reddit-voices.png"),
        "-loop", "1", "-framerate", str(FPS), "-t", "6.35", "-i", str(CLEAN / "closing.png"),
        "-loop", "1", "-framerate", str(FPS), "-t", "14.35", "-i", str(CLEAN / "mission.png"),
        "-loop", "1", "-framerate", str(FPS), "-t", "10", "-i", str(CLEAN / "chrome-architecture.png"),
        "-filter_complex", ";".join(filters),
        "-map", "[outv]", "-an",
        "-c:v", "libx264", "-preset", "fast", "-crf", "17",
        "-pix_fmt", "yuv420p",
        str(output), "-y",
    )


def probe_duration(path: Path) -> float:
    result = subprocess.run(
        [FFMPEG, "-hide_banner", "-i", str(path), "-f", "null", "NUL"],
        capture_output=True,
        text=True,
    )
    for line in result.stderr.splitlines():
        if "Duration:" in line:
            value = line.split("Duration:", 1)[1].split(",", 1)[0].strip()
            hours, minutes, seconds = value.split(":")
            return int(hours) * 3600 + int(minutes) * 60 + float(seconds)
    raise RuntimeError(f"Unable to probe {path}")


def atempo_chain(factor: float) -> str:
    parts: list[str] = []
    while factor > 2:
        parts.append("atempo=2.0")
        factor /= 2
    while factor < 0.5:
        parts.append("atempo=0.5")
        factor /= 0.5
    parts.append(f"atempo={factor:.8f}")
    return ",".join(parts)


def prepare_voice() -> Path:
    processed = WORK / "voice-processed"
    processed.mkdir(parents=True, exist_ok=True)
    audio_paths: list[Path] = []
    for chapter in CONFIG["chapters"]:
        source = VOICE_DIR / f"{chapter['id']}.wav"
        if not source.exists():
            raise FileNotFoundError(f"Missing narration: {source}")
        target = processed / f"{chapter['id']}.wav"
        duration = float(chapter["targetDuration"])
        source_duration = probe_duration(source)
        # Preserve a natural speaking rate. Short clips finish early and leave a
        # deliberate pause instead of being stretched to fill every chapter.
        factor = max(1.0, source_duration / (duration - 0.35))
        fade_out_start = max(0.2, duration - 0.55)
        ffmpeg(
            "-i", str(source),
            "-af",
            f"{atempo_chain(factor)},loudnorm=I=-16:TP=-1.5:LRA=6,"
            f"afade=t=in:st=0:d=0.08,afade=t=out:st={fade_out_start:.3f}:d=0.2,"
            f"apad=pad_dur={duration:.3f}",
            "-t", f"{duration:.3f}",
            "-ar", "48000", "-ac", "2",
            str(target), "-y",
        )
        audio_paths.append(target)

    args: list[str] = []
    filters: list[str] = []
    for index, (chapter, audio) in enumerate(zip(CONFIG["chapters"], audio_paths)):
        args.extend(["-i", str(audio)])
        delay = round(float(chapter["start"]) * 1000)
        filters.append(f"[{index}:a]adelay={delay}|{delay}[a{index}]")
    mix = "".join(f"[a{index}]" for index in range(len(audio_paths)))
    filters.append(
        f"{mix}amix=inputs={len(audio_paths)}:duration=longest:normalize=0,"
        "apad=pad_dur=180,atrim=duration=180[voice]"
    )
    output = WORK / "voiceover-180.wav"
    ffmpeg(*args, "-filter_complex", ";".join(filters), "-map", "[voice]", "-ar", "48000", "-ac", "2", str(output), "-y")
    return output


def ass_time(seconds: float) -> str:
    value = round(seconds * 100)
    hours, value = divmod(value, 360000)
    minutes, value = divmod(value, 6000)
    whole, hundredths = divmod(value, 100)
    return f"{hours}:{minutes:02d}:{whole:02d}.{hundredths:02d}"


def caption_chunks(text: str, max_words: int = 11) -> list[str]:
    words = text.split()
    if len(words) <= max_words:
        return [text]
    chunk_count = max(2, round(len(words) / max_words))
    chunk_size = (len(words) + chunk_count - 1) // chunk_count
    return [" ".join(words[index:index + chunk_size]) for index in range(0, len(words), chunk_size)]


def create_captions() -> Path:
    header = """[Script Info]
Title: DoomLess AI Revised Narration Captions
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Segoe UI Semibold,42,&H00FFFFFF,&H000000FF,&HCC02110D,&HCC02110D,-1,0,0,0,100,100,0,0,3,2,0,2,130,130,46,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events: list[str] = []
    for chapter in CONFIG["chapters"]:
        lines = caption_chunks(str(chapter["script"]))
        start = float(chapter["start"])
        duration = float(chapter["targetDuration"])
        weights = [len(line.split()) for line in lines]
        total = sum(weights)
        cursor = start
        for index, (line, weight) in enumerate(zip(lines, weights)):
            end = start + duration if index == len(lines) - 1 else cursor + duration * weight / total
            safe = line.replace("{", "(").replace("}", ")")
            events.append(f"Dialogue: 0,{ass_time(cursor)},{ass_time(end)},Caption,,0,0,0,,{safe}")
            cursor = end
    output = WORK / "revised-captions.ass"
    output.write_text(header + "\n".join(events) + "\n", encoding="utf-8-sig")
    return output


def render_final(video: Path, voice: Path, captions: Path) -> None:
    ass_path = str(captions).replace("\\", "/").replace(":", "\\:")
    audio = (
        "[2:a]highpass=f=45,lowpass=f=9000,loudnorm=I=-28:TP=-7:LRA=7[bed];"
        "[1:a]volume=1.03[voice];[bed][voice]amix=inputs=2:duration=first:normalize=0,"
        "alimiter=limit=0.92[outa]"
    )
    filters = f"[0:v]ass=filename='{ass_path}',format=yuv420p[outv];{audio}"
    ffmpeg(
        "-i", str(video), "-i", str(voice), "-i", str(MUSIC),
        "-filter_complex", filters,
        "-map", "[outv]", "-map", "[outa]",
        "-t", "180",
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-profile:v", "high", "-r", "30", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        "-movflags", "+faststart",
        str(FINAL), "-y",
    )


def main() -> None:
    for path in [
        SOURCE,
        KPI_SLIDE,
        CODEX_SLIDE,
        SITE_CAPTURES / "02-sample-label.png",
        SITE_CAPTURES / "04-risk-result.png",
        SITE_CAPTURES / "06-score-bands.png",
        SCROLLING_CLIP,
        FRUSTRATED_CLIP,
        JOURNEY / "01-decision.png",
        JOURNEY / "02-interrupt.png",
        JOURNEY / "03-summary.png",
        NEW_DEMO,
        MUSIC,
        CLEAN / "gpt-clean.png",
        FUTURE_VIDEO,
        CLEAN / "reddit-voices.png",
        CLEAN / "closing.png",
        CLEAN / "mission.png",
        CLEAN / "chrome-architecture.png",
    ]:
        if not path.exists():
            raise FileNotFoundError(path)
    WORK.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    visuals = WORK / "revised-visuals-180.mp4"
    edit_visuals(visuals)
    voice = prepare_voice()
    captions = create_captions()
    render_final(visuals, voice, captions)
    print(f"Created {FINAL}")


if __name__ == "__main__":
    main()
