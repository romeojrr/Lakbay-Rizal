"""London, winter 1888–89 — the Reading Room of the British Museum.
The great circular room under its dome: ribbed panels and high windows, three tiers
of curved bookcases with iron galleries, rows of reading desks, the superintendent's
raised desk at the centre. Rizal copies Morga's 1609 'Sucesos' by hand."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, BAYER
from common import W, H, grade_fn, shadow, lamp_glow
from kit2 import place, table, chair
import chars


def build():
    g = grade_fn('#E6DCC6', 0.07, contrast=1.05)
    c = Canvas(W, H, grade=g)
    gold = c.R('gilt', '#C9A24A')
    glass = c.R('skylight', '#DDE6EA')
    shelf = c.R('shelf', '#6A4A30')
    iron = c.R('iron', '#2E3036')
    desk = c.R('desk', '#5A3A26')
    leather = c.R('leather', '#2E4A3A')
    paper = c.R('paper', '#ECE6D4')
    cx = W // 2

    # dome seen from the floor: rings sag toward the middle (they are farther away),
    # ribs converge on the lantern above the frame
    dome = c.R('dome', '#8E9EAE')
    dm = c.rect(0, 0, W - 1, 86)
    u = ((c.xx - cx) / cx) ** 2
    c.fill(dm, dome, 3)
    for k, base in enumerate((84, 60, 38, 18)):
        ring = dm & (np.abs(c.yy - (base - 26 * u * (1 - k * 0.15))) < 1.0)
        c.fill(ring, gold, 4)
    vx, vy = cx, -160
    ang = np.degrees(np.arctan2(c.yy - vy, c.xx - vx))
    c.fill(dm & ((np.round(ang * 2) % 9) == 0), gold, 3)
    c.dither_adjust(dm & (c.yy < 40 - 20 * u), 0.4)
    c.fill(dm & (((c.xx * 3 + c.yy * 5) % 23) == 0) & (c.yy > 40), dome, 4)
    # high arched windows around the base of the dome
    for k in range(-7, 8):
        wx = int(cx + k * 30 * (1 - abs(k) * 0.025))
        top = int(62 - 26 * ((wx - cx) / cx) ** 2)
        w = max(6, int(14 * (1 - abs(k) / 11)))
        wm = c.ell(wx - w // 2, top, wx + w // 2, top + w) | c.rect(wx - w // 2, top + w // 2, wx + w // 2, 82)
        c.gradient(wm, glass, 6, 3.5, top, 82)
        c.fill(wm & (np.abs(c.xx - wx) < 0.6), iron, 3)
    c.fill(c.rect(0, 84, W - 1, 88), gold, 3)
    c.fill(c.rect(0, 89, W - 1, 90), shelf, 1)

    # three tiers of curved bookcases with iron gallery rails
    rng = np.random.default_rng(5)
    spines = [c.R('sp1', '#7A2E2A'), c.R('sp2', '#2E4A3A'), c.R('sp3', '#3A3A5A'), c.R('sp4', '#8A6A3A'), c.R('sp5', '#4A3A2A')]
    tiers = [(90, 114), (118, 142), (146, 168)]
    for t, (y0, y1) in enumerate(tiers):
        band = c.rect(0, y0, W - 1, y1)
        c.fill(band, shelf, 1)
        for sy in range(y0 + 2, y1 - 4, 7):
            x = 0
            while x < W:
                bw = int(rng.integers(1, 3))
                col = spines[int(rng.integers(0, 5))]
                h = int(rng.integers(4, 6))
                c.fill(c.rect(x, sy + 6 - h, x + bw - 1, sy + 5), col, int(rng.integers(2, 4)))
                x += bw
            c.fill(c.rect(0, sy + 6, W - 1, sy + 6), shelf, 3)
        for px in range(0, W, 24):
            c.solid(c.rect(px, y0, px + 2, y1), shelf, 3, hl=1)
        if t < 2:
            c.fill(c.rect(0, y1, W - 1, y1 + 3), iron, 2)
            c.fill(c.rect(0, y1 - 6, W - 1, y1 - 6) | (c.rect(0, y1 - 6, W - 1, y1) & ((c.xx % 4) == 0)), iron, 3)
        c.dither_adjust(band, -0.15 * (2 - t))
    # light falling from the dome
    c.dither_adjust(c.poly([(140, 90), (244, 90), (300, H), (90, H)]), 0.35)

    # floor and radial desks (converging on the centre)
    fl = c.rect(0, 168, W - 1, H - 1)
    c.fill(fl, c.R('floor', '#6A5A4A'), 3)
    c.tex(fl, tex_noise(c, 0.04, 0.03, seed=2))
    for dx0, dx1 in ((-20, 60), (330, 410)):
        dm2 = c.poly([(dx0, 176), (dx1, 176), (dx1 + (14 if dx0 < 0 else -14), 186), (dx0 + (14 if dx0 < 0 else -14), 186)])
        c.solid(dm2, desk, 3, hl=1, sh=1)
        c.fill(c.rect(dx0 + 4, 166, dx1 - 4, 176), leather, 2)
        c.fill(c.rect(dx0 + 4, 166, dx1 - 4, 167), desk, 4)
    # superintendent's raised desk in the centre (far)
    c.solid(c.ell(150, 156, 236, 176), desk, 3, hl=1, sh=1)
    c.solid(c.rect(150, 162, 236, 172), desk, 3, hl=1, sh=1)
    c.fill(c.rect(150, 160, 236, 161), gold, 4)

    # Rizal's desk in the foreground: Morga's book, his copy, an inkwell, a lamp
    table(c, 210, 172, 330, desk, h=34, cloth=None)
    c.fill(c.rect(210, 168, 330, 172), leather, 2)
    c.solid(c.poly([(224, 166), (246, 164), (268, 166), (268, 171), (224, 171)]), c.R('vellum', '#D8C8A0'), 4, hl=1, sh=1)
    c.fill(c.rect(246, 164, 246, 171), c.R('vellum', '#D8C8A0'), 2)
    for ly in range(167, 171, 2):
        c.fill(c.rect(227, ly, 243, ly) | c.rect(249, ly, 265, ly), c.R('ink', '#3A3440'), 2)
    for i in range(3):
        c.solid(c.rect(276 + i, 168 - i, 298 + i, 171 - i), paper, 5, hl=0, sh=1)
    c.fill(c.rect(280, 163, 296, 163) & (c.xx % 3 != 1), c.R('ink', '#3A3440'), 2)
    c.solid(c.ell(304, 165, 310, 171), c.R('inkwell', '#2A2A34'), 3, hl=1)
    c.fill(c.line([(308, 167), (312, 158)]), c.R('quill', '#E8E0CC'), 5)
    c.solid(c.rect(316, 150, 320, 170), iron, 3, hl=1)
    c.solid(c.poly([(310, 144), (326, 144), (322, 138), (314, 138)]), c.R('shade', '#2E4A3A'), 3, hl=1)
    lamp_glow(c, 318, 150, 34, 0.55, mask=~c.rect(310, 136, 326, 171))
    chair(c, 186, 182, desk, facing=1)

    shadow(c, 180, 203, 212, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(coat_col='#2A2C36', vest_col='#3A3A48', grade=g)
    anchors = {'rizal': place(img, rz, 180, flip=True)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_london.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_london.png')
    print(a)
