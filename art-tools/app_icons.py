"""App icons for the installable web app (SRS NFR-7).

Places the approved Rizal sprite (assets/sprites/rizal_adult_suit.png) at an integer
scale on the --accent background with an ink ground line, so the icon stays crisp pixel art
(SRS 7.1, 7.2). The background fills the whole square, which also works as a
"maskable" icon: the figure stays inside the central safe zone.

    python art-tools/app_icons.py      # writes assets/icons/app/icon-192.png and icon-512.png
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SPRITE = ROOT / "assets" / "sprites" / "rizal_adult_suit.png"
OUT = ROOT / "assets" / "icons" / "app"

ACCENT = (232, 137, 43, 255)  # --accent: the navy suit reads clearly on it
INK = (31, 26, 36, 255)
SHADOW = (184, 96, 26, 255)  # one tone darker than the accent

# size -> integer scale of the 34 x 78 sprite
SIZES = {512: 5, 192: 2}


def make_icon(size: int, scale: int) -> Image.Image:
    sprite = Image.open(SPRITE).convert("RGBA")
    big = sprite.resize((sprite.width * scale, sprite.height * scale), Image.NEAREST)
    icon = Image.new("RGBA", (size, size), ACCENT)

    x = (size - big.width) // 2
    ground = size // 2 + big.height // 2  # feet sit on this line
    y = ground - big.height

    # One-tone shadow ellipse-ish bar under the feet, then the gold ground line.
    bar_w = big.width + 4 * scale
    icon.paste(SHADOW, (x - 2 * scale, ground - scale, x - 2 * scale + bar_w, ground + scale))
    line_w = size * 3 // 5
    lx = (size - line_w) // 2
    icon.paste(INK, (lx, ground + scale, lx + line_w, ground + 3 * scale))

    icon.alpha_composite(big, (x, y))
    return icon


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for size, scale in SIZES.items():
        path = OUT / f"icon-{size}.png"
        make_icon(size, scale).save(path, optimize=True)
        print(f"wrote {path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
