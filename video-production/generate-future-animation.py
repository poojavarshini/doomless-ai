from __future__ import annotations

import math
from pathlib import Path
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "video-production" / "work" / "clean-diagrams" / "future-animated.mp4"
TOOLS = ROOT / ".video-tools"
sys.path.insert(0, str(TOOLS))
import imageio_ffmpeg  # type: ignore

W, H, FPS, DURATION = 1920, 1080, 30, 30
BG, TEXT, MUTED = "#061f35", "#f7fbff", "#a9bfd0"
BLUE, CYAN, MINT, AMBER, RED = "#2c7df7", "#59dcfa", "#62e6a9", "#ffc857", "#ff667d"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"
    return ImageFont.truetype(name, size)


def centered(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], label: str, size: int, color: str) -> None:
    f = font(size, True)
    bounds = draw.textbbox((0, 0), label, font=f)
    width, height = bounds[2] - bounds[0], bounds[3] - bounds[1]
    draw.text(((box[0] + box[2] - width) / 2, (box[1] + box[3] - height) / 2 - 3), label, font=f, fill=color)


def arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], progress: float, color: str) -> None:
    if progress <= 0:
        return
    progress = min(1.0, progress)
    x = start[0] + (end[0] - start[0]) * progress
    y = start[1] + (end[1] - start[1]) * progress
    draw.line((start[0], start[1], x, y), fill=color, width=7)
    if progress < 0.96:
        return
    angle = math.atan2(end[1] - start[1], end[0] - start[0])
    length, spread = 24, 0.55
    points = [
        (end[0], end[1]),
        (end[0] - length * math.cos(angle - spread), end[1] - length * math.sin(angle - spread)),
        (end[0] - length * math.cos(angle + spread), end[1] - length * math.sin(angle + spread)),
    ]
    draw.polygon(points, fill=color)


def frame_at(t: float) -> Image.Image:
    image = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(image)
    draw.text((72, 52), "DOOMLESS / HACKATHON DEMO", font=font(22, True), fill=CYAN)
    draw.text((72, 128), "THE VISION", font=font(22, True), fill=MINT)
    draw.text((72, 175), "Instagram is only the beginning.", font=font(56, True), fill=TEXT)
    draw.text((74, 255), "One Digital Nutrition framework across the modern web.", font=font(27), fill=MUTED)

    center = (735, 425, 1185, 725)
    nodes = [
        ((120, 385, 475, 520), "TIKTOK", CYAN, (735, 500), (500, 455)),
        ((1445, 385, 1800, 520), "YOUTUBE SHORTS", RED, (1185, 500), (1420, 455)),
        ((120, 650, 475, 785), "LINKEDIN", BLUE, (735, 650), (500, 708)),
        ((1445, 650, 1800, 785), "X / NEWS", AMBER, (1185, 650), (1420, 708)),
        ((782, 805, 1138, 940), "BROWSER", MINT, (960, 725), (960, 780)),
    ]

    pulse = 0.78 + 0.22 * (0.5 + 0.5 * math.sin(t * 2.2))
    for index, (_, _, color, start, end) in enumerate(nodes):
        local = max(0.0, min(1.0, (t - 0.6 - index * 0.45) / 0.85))
        rgb = tuple(int(int(color[i:i + 2], 16) * pulse) for i in (1, 3, 5))
        arrow(draw, start, end, local, "#%02x%02x%02x" % rgb)

    for box, label, color, _, _ in nodes:
        draw.rounded_rectangle(box, radius=42, fill="#123958", outline=color, width=5)
        centered(draw, box, label, 25, TEXT)

    draw.rounded_rectangle(center, radius=42, fill="#205b89", outline=BLUE, width=5)
    centered(draw, (735, 468, 1185, 515), "DOOMLESS AI", 25, MINT)
    centered(draw, (735, 530, 1185, 585), "DIGITAL", 43, TEXT)
    centered(draw, (735, 590, 1185, 650), "NUTRITION", 43, TEXT)
    centered(draw, (735, 670, 1185, 704), "FRAMEWORK", 21, MUTED)
    return image


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    command = [
        imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-loglevel", "error",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(OUT), "-y",
    ]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    assert process.stdin is not None
    for index in range(FPS * DURATION):
        process.stdin.write(frame_at(index / FPS).tobytes())
    process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError("Future animation render failed")
    print(OUT)


if __name__ == "__main__":
    main()
