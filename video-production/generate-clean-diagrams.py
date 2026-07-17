from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "video-production" / "work" / "clean-diagrams"
OUT.mkdir(parents=True, exist_ok=True)
W, H = 1920, 1080
BG = "#061f35"
TEXT = "#f7fbff"
MUTED = "#a9bfd0"
BLUE = "#2c7df7"
CYAN = "#59dcfa"
MINT = "#62e6a9"
AMBER = "#ffc857"
RED = "#ff667d"


def font(size, bold=False):
    path = "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"
    return ImageFont.truetype(path, size)


def rounded(d, box, fill, outline, radius=25, width=3):
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def header(d, eyebrow, title, subtitle):
    d.text((72, 52), "DOOMLESS / HACKATHON DEMO", font=font(22, True), fill=CYAN)
    d.text((72, 128), eyebrow.upper(), font=font(22, True), fill=MINT)
    d.text((72, 175), title, font=font(56, True), fill=TEXT)
    d.text((74, 255), subtitle, font=font(27), fill=MUTED)


def reddit():
    img = Image.new("RGB", (W, H), "#0b1416")
    d = ImageDraw.Draw(img)
    header(d, "The problem is lived, not theoretical", "People are asking for help with doomscrolling.", "Paraphrased public Reddit discussions · accessed July 2026")
    cards = [
        ("r/ADHD", "How do I stop doomscrolling?", "“I lose hours doomscrolling on Instagram.”", RED),
        ("r/getdisciplined", "Short-form content ruined my focus", "“Studying became harder; reaching for my phone became automatic.”", AMBER),
        ("r/nosurf", "Doomscrolling is genuinely exhausting", "“I feel groggy, tired, and worn out afterward.”", CYAN),
    ]
    y = 350
    for community, title, quote, color in cards:
        rounded(d, (110, y, 1810, y + 180), "#142629", "#31575d")
        d.ellipse((145, y + 35, 205, y + 95), fill="#ff4500")
        d.text((160, y + 43), "r", font=font(27, True), fill=TEXT)
        d.text((230, y + 34), community, font=font(24, True), fill=color)
        d.text((230, y + 72), title, font=font(31, True), fill=TEXT)
        d.text((230, y + 124), quote, font=font(25), fill=MUTED)
        y += 205
    d.text((110, 1008), "Community experiences are illustrative and are not clinical evidence.", font=font(20), fill=MUTED)
    img.save(OUT / "reddit-voices.png")


def gpt():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    header(d, "Explainable AI", "GPT-5.6 reasons across multiple signals.", "Connectors stop at each card, keeping every label readable.")
    center = (760, 430, 1160, 685)
    nodes = [
        ((120, 350, 560, 455), "Credibility", BLUE),
        ((1360, 350, 1800, 455), "Addictive patterns", RED),
        ((80, 540, 520, 645), "Relevance", CYAN),
        ((1400, 540, 1840, 645), "Educational value", MINT),
        ((210, 750, 650, 855), "Emotional effect", AMBER),
        ((1270, 750, 1710, 855), "Actionability", BLUE),
    ]
    cx, cy = 960, 557
    # Draw all connectors first so cards and their labels remain above them.
    for box, _, _ in nodes:
        x1, y1, x2, y2 = box
        nx = x2 if x2 < cx else x1
        ny = (y1 + y2) // 2
        edge_x = center[0] if nx < cx else center[2]
        d.line((nx, ny, edge_x, cy), fill="#315d80", width=4)
    for box, label, color in nodes:
        rounded(d, box, "#123958", color)
        tw = d.textbbox((0, 0), label, font=font(27, True))[2]
        d.text(((box[0] + box[2] - tw) / 2, box[1] + 34), label, font=font(27, True), fill=TEXT)
    rounded(d, center, "#f7fbff", BLUE, 34, 4)
    d.text((840, 485), "STRUCTURED", font=font(23, True), fill=BLUE)
    d.text((825, 555), "0–100 + why", font=font(43, True), fill="#071b31")
    d.text((72, 1000), "Available evidence → reasoning → validated result", font=font(24, True), fill=MUTED)
    img.save(OUT / "gpt-clean.png")


def future():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    header(d, "The vision", "Instagram is only the beginning.", "One Digital Nutrition framework across the modern web.")
    # Keep the complete diagram inside the title-safe area. The earlier version
    # placed the Browser node under common video-player controls and made the
    # oversized circular hub feel visually heavy.
    center = (770, 465, 1150, 735)
    nodes = [
        ((120, 390, 475, 525), "TIKTOK", CYAN),
        ((1445, 390, 1800, 525), "YOUTUBE SHORTS", RED),
        ((120, 670, 475, 805), "LINKEDIN", BLUE),
        ((1445, 670, 1800, 805), "X / NEWS", AMBER),
        ((782, 835, 1138, 970), "BROWSER", MINT),
    ]
    # The platform cards communicate expansion without connector lines. This
    # remains clear during crops, fades, and close viewing in a video player.
    for box, label, color in nodes:
        rounded(d, box, "#102f4a", color, 45, 5)
        tw = d.textbbox((0, 0), label, font=font(25, True))[2]
        tb = d.textbbox((0, 0), label, font=font(25, True))
        th = tb[3] - tb[1]
        d.text(((box[0] + box[2] - tw) / 2, (box[1] + box[3] - th) / 2 - 3), label, font=font(25, True), fill=TEXT)
    rounded(d, center, "#174c78", BLUE, 42, 5)
    d.text((846, 515), "DOOMLESS AI", font=font(25, True), fill=MINT)
    d.text((826, 570), "DIGITAL", font=font(43, True), fill=TEXT)
    d.text((796, 625), "NUTRITION", font=font(43, True), fill=TEXT)
    d.text((855, 687), "FRAMEWORK", font=font(21, True), fill=MUTED)
    img.save(OUT / "future-clean.png")


def closing():
    img = Image.new("RGB", (W, H), "#041a15")
    d = ImageDraw.Draw(img)
    # Soft concentric brand rings create depth without distracting from the
    # final message.
    for inset, color, width in [(90, "#0b3b2e", 3), (145, "#0d503c", 2), (205, "#126349", 2)]:
        d.rounded_rectangle((inset, inset, W - inset, H - inset), radius=70, outline=color, width=width)
    d.text((72, 58), "DOOMLESS / HACKATHON DEMO", font=font(22, True), fill=CYAN)
    d.text((W // 2, 245), "DOOMLESS AI", font=font(30, True), fill=MINT, anchor="mm")
    d.text((W // 2, 385), "Choose what deserves", font=font(70, True), fill=TEXT, anchor="mm")
    d.text((W // 2, 480), "your attention.", font=font(70, True), fill=MINT, anchor="mm")
    d.text((W // 2, 615), "The Digital Nutrition Layer for the modern web.", font=font(30), fill=MUTED, anchor="mm")
    rounded(d, (760, 710, 1160, 810), "#123f32", MINT, 45, 3)
    d.text((W // 2, 760), "THANK YOU", font=font(27, True), fill=TEXT, anchor="mm")
    d.text((W // 2, 900), "Watch intentionally. Save what matters. Skip the rest.", font=font(24, True), fill="#86dcb8", anchor="mm")
    img.save(OUT / "closing.png")


def mission():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    header(d, "The bigger mission", "Better minutes, not fewer minutes.", "Digital wellbeing should improve the quality of attention—not only count it.")
    rounded(d, (110, 390, 900, 795), "#102c43", "#46647a", 38, 4)
    d.text((165, 442), "TODAY'S WELLBEING TOOLS", font=font(23, True), fill=AMBER)
    d.text((165, 525), "Measure screen time", font=font(42, True), fill=TEXT)
    d.text((165, 605), "Block apps after use", font=font(30), fill=MUTED)
    d.text((165, 665), "Treat every minute equally", font=font(30), fill=MUTED)
    rounded(d, (1020, 390, 1810, 795), "#10392f", MINT, 38, 4)
    d.text((1075, 442), "DOOMLESS AI", font=font(23, True), fill=MINT)
    d.text((1075, 525), "Measures content value", font=font(42, True), fill=TEXT)
    d.text((1075, 605), "Explains value before viewing", font=font(30), fill="#b9dfd1")
    d.text((1075, 665), "Makes attention intentional", font=font(30), fill="#b9dfd1")
    d.text((W // 2, 900), "From screen-time limits to Digital Nutrition.", font=font(30, True), fill=CYAN, anchor="mm")
    img.save(OUT / "mission.png")


def chrome_architecture():
    img = Image.new("RGB", (W, H), "#071d19")
    d = ImageDraw.Draw(img)
    header(d, "Manifest V3 Chrome extension", "How DoomLess works on desktop Instagram.", "A privacy-aware pipeline from visible Reel metadata to an explainable overlay.")
    stages = [
        ((85, 370, 540, 650), "1  CONTENT SCRIPT", "Detect active Reel", "MutationObserver\nIntersectionObserver", CYAN),
        ((610, 370, 1065, 650), "2  SERVICE WORKER", "Route securely", "Deduplicate requests\nCheck local cache", AMBER),
        ((1135, 370, 1590, 650), "3  BACKEND + AI", "Return strict JSON", "Validate schema\nScore + explain", MINT),
    ]
    for box, eyebrow, title, body, color in stages:
        rounded(d, box, "#10372f", color, 34, 4)
        d.text((box[0] + 35, box[1] + 35), eyebrow, font=font(19, True), fill=color)
        d.text((box[0] + 35, box[1] + 92), title, font=font(31, True), fill=TEXT)
        d.multiline_text((box[0] + 35, box[1] + 158), body, font=font(23), fill=MUTED, spacing=14)
    # Directional arrows stop between cards.
    d.line((540, 510, 590, 510), fill="#6d9c8f", width=6)
    d.polygon([(610, 510), (585, 495), (585, 525)], fill=AMBER)
    d.line((1065, 510, 1115, 510), fill="#6d9c8f", width=6)
    d.polygon([(1135, 510), (1110, 495), (1110, 525)], fill=MINT)
    rounded(d, (1650, 370, 1835, 650), "#164b3e", MINT, 34, 4)
    d.text((1742, 440), "LIVE", font=font(22, True), fill=MINT, anchor="mm")
    d.text((1742, 500), "SCORE", font=font(28, True), fill=TEXT, anchor="mm")
    d.text((1742, 565), "OVERLAY", font=font(22, True), fill=TEXT, anchor="mm")
    rounded(d, (85, 730, 1835, 925), "#081b2a", "#315d80", 25, 3)
    d.text((125, 765), "content-script.ts", font=font(19, True), fill=CYAN)
    code = 'observeReels()  →  chrome.runtime.sendMessage({ type: "ANALYZE_REEL", metadata })  →  renderOverlay(result)'
    d.text((125, 825), code, font=font(23, True), fill="#d8ebff")
    img.save(OUT / "chrome-architecture.png")


reddit()
gpt()
future()
closing()
mission()
chrome_architecture()
print(OUT)
