from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "apps" / "extension" / "public" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

canvas = 512
image = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)

for inset in range(0, 472):
    ratio = inset / 471
    color = (
        round(16 + (7 - 16) * ratio),
        round(60 + (28 - 60) * ratio),
        round(50 + (24 - 50) * ratio),
        255,
    )
    draw.rounded_rectangle((20 + inset / 8, 20 + inset / 8, 492 - inset / 8, 492 - inset / 8), radius=120, outline=color, width=2)

font_path = Path("C:/Windows/Fonts/arialbd.ttf")
font = ImageFont.truetype(str(font_path), 270) if font_path.exists() else ImageFont.load_default()
draw.text((132, 94), "D", font=font, fill="#F6FFFB", stroke_width=1)

draw.ellipse((282, 265, 415, 390), fill="#35D491")
draw.polygon([(280, 385), (332, 292), (423, 238), (396, 333), (337, 390)], fill="#86EFB9")
draw.line((279, 399, 401, 270), fill="#0D4939", width=17)

draw.polygon([(404, 83), (414, 111), (443, 121), (414, 131), (404, 159), (394, 131), (365, 121), (394, 111)], fill="#F6C85F")

for size in (16, 32, 48, 128):
    image.resize((size, size), Image.Resampling.LANCZOS).save(OUT / f"icon-{size}.png", optimize=True)
