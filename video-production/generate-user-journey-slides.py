from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "video-production" / "work" / "user-journey"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080
BG = "#061b17"
PANEL = "#0d3028"
PANEL_2 = "#124237"
MINT = "#79f2bd"
TEXT = "#f4fff9"
MUTED = "#a9c9bc"
AMBER = "#ffc857"
RED = "#ff7285"


def font(size: int, bold: bool = False):
    name = "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"
    return ImageFont.truetype(name, size)


def rounded(draw, box, fill, outline=None, width=2, radius=28):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def base(step: str, title: str, subtitle: str):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    d.text((88, 62), "DOOMLESS AI", font=font(34, True), fill=MINT)
    # Right-align the eyebrow inside the 90 px title-safe margin. The previous
    # fixed x-position allowed the final letters to be cropped by some players.
    d.text((W - 90, 70), "ILLUSTRATIVE USER JOURNEY", font=font(20, True), fill=MUTED, anchor="ra")
    d.text((88, 150), step.upper(), font=font(24, True), fill=MINT)
    d.text((88, 194), title, font=font(62, True), fill=TEXT)
    d.text((90, 280), subtitle, font=font(28), fill=MUTED)
    return img, d


def decision():
    img, d = base("Step 3 · Decide", "A score becomes a simple choice.", "Maya sees value, risk, and attention cost before continuing.")
    rounded(d, (90, 365, 620, 895), PANEL, "#236353")
    d.text((132, 410), "DIGITAL NUTRITION SCORE", font=font(24, True), fill=MINT)
    d.text((132, 472), "82", font=font(126, True), fill=TEXT)
    d.text((330, 558), "/100", font=font(32, True), fill=MUTED)
    d.text((132, 650), "High-value learning", font=font(38, True), fill=TEXT)
    d.text((132, 712), "Attention cost: Low", font=font(28), fill=MUTED)
    d.text((132, 760), "Confidence: 88%", font=font(28), fill=MUTED)
    d.text((705, 390), "WHAT SHOULD MAYA DO?", font=font(25, True), fill=MINT)
    labels = [("WATCH", MINT), ("SAVE FOR LATER", "#59b9ff"), ("ENTERTAINMENT", AMBER), ("SKIP", RED)]
    y = 455
    for label, color in labels:
        rounded(d, (705, y, 1750, y + 88), PANEL_2, color, 3, 22)
        d.text((750, y + 24), label, font=font(30, True), fill=TEXT)
        y += 112
    img.save(OUT / "01-decision.png")


def interrupt():
    img, d = base("Step 4 · Interrupt", "DoomLess notices the scrolling pattern.", "Three low-value Reels in a row trigger a gentle, non-judgmental pause.")
    rounded(d, (250, 380, 1670, 865), PANEL, "#2c6f5d")
    d.text((320, 435), "SCROLL LOOP CHECK", font=font(28, True), fill=AMBER)
    d.text((320, 510), "3 low-value Reels in a row", font=font(58, True), fill=TEXT)
    d.text((320, 600), "Would you like to exit scroll-bait and return to conscious learning?", font=font(30), fill=MUTED)
    rounded(d, (320, 690, 910, 790), MINT, None, 0, 24)
    d.text((405, 719), "EXIT THE LOOP", font=font(30, True), fill="#063126")
    rounded(d, (960, 690, 1555, 790), PANEL_2, "#4e8f7e", 2, 24)
    d.text((1035, 719), "CONTINUE INTENTIONALLY", font=font(28, True), fill=TEXT)
    img.save(OUT / "02-interrupt.png")


def summary():
    img, d = base("Step 5 · Reflect", "Maya ends with a meaningful session summary.", "DoomLess turns individual choices into visible behavior change.")
    cards = [
        ("12", "Reels reviewed", MINT),
        ("4", "Low-value Reels skipped", RED),
        ("3", "Useful Reels saved", "#59b9ff"),
        ("2m 18s", "Attention saved · estimate", AMBER),
    ]
    x = 90
    for value, label, color in cards:
        rounded(d, (x, 400, x + 410, 690), PANEL, "#2b6657")
        d.text((x + 34, 448), value, font=font(68, True), fill=color)
        d.text((x + 34, 555), label, font=font(24, True), fill=TEXT)
        x += 445
    rounded(d, (90, 755, 1830, 910), PANEL_2, "#3a816d")
    d.text((138, 795), "SESSION OUTCOME", font=font(23, True), fill=MINT)
    d.text((138, 840), "Maya consciously exited scroll-bait and returned to goal-aligned learning.", font=font(32, True), fill=TEXT)
    img.save(OUT / "03-summary.png")


decision()
interrupt()
summary()
print(OUT)
