"""Fort Santiago, 29 December 1896 — the chapel-cell where Rizal spent his last night.
Thick stone walls, a small barred window with the last light of evening, a plain
table with a candle and the small alcohol cooking stove in which he hid his last
poem, a crucifix, a wooden cot. Calm and quiet."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_blocks
from common import W, H, grade_fn, sky, lamp_glow, shadow
from kit2 import place, table, chair
import chars


def build():
    g = grade_fn('#D8A070', 0.12, contrast=1.06)
    c = Canvas(W, H, grade=g)
    stone = c.R('adobe', '#6E5E50')
    wood = c.R('wood', '#5A3A26')
    iron = c.R('iron', '#26262C')
    paper = c.R('paper', '#EEE6D2')
    brass = c.R('brass', '#B8923E')

    # small barred window with evening sky
    wx0, wy0, wx1, wy1 = 150, 30, 214, 82
    win = c.rect(wx0, wy0, wx1, wy1)
    sky(c, '#3A4A7A', '#E8A878', wy1, y0=wy0)
    wall = c.rect(0, 0, W - 1, 176) & ~win
    c.fill(wall, stone, 3)
    c.tex(wall, tex_blocks(c, 26, 12, seed=3))
    c.tex(wall, tex_noise(c, 0.08, 0.03, seed=4))
    # deep window reveal
    rev = c.poly([(wx0 - 10, wy0 - 10), (wx1 + 10, wy0 - 10), (wx1, wy0), (wx0, wy0)]) | c.poly([(wx0 - 10, wy0 - 10), (wx0, wy0), (wx0, wy1), (wx0 - 10, wy1 + 10)]) | c.poly([(wx1, wy0), (wx1 + 10, wy0 - 10), (wx1 + 10, wy1 + 10), (wx1, wy1)]) | c.poly([(wx0, wy1), (wx1, wy1), (wx1 + 10, wy1 + 10), (wx0 - 10, wy1 + 10)])
    c.fill(rev, stone, 2)
    c.fill(c.poly([(wx0, wy1), (wx1, wy1), (wx1 + 10, wy1 + 10), (wx0 - 10, wy1 + 10)]), stone, 4)
    for bx in range(wx0 + 8, wx1, 11):
        c.solid(c.rect(bx, wy0, bx + 2, wy1), iron, 2, hl=1)
    c.fill(c.rect(wx0, 54, wx1, 55), iron, 2)
    beam = c.poly([(wx0, wy1 + 10), (wx1, wy1 + 10), (wx1 + 70, 176), (wx0 + 30, 176)])
    c.dither_adjust(beam & wall, 0.35)

    # crucifix on the wall
    c.solid(c.rect(286, 46, 289, 84) | c.rect(278, 54, 297, 57), wood, 3, hl=1)
    c.fill(c.rect(287, 58, 288, 72), c.R('corpus', '#D8C8A8'), 4)

    # cot along the left wall
    cot = c.rect(10, 150, 100, 160)
    c.solid(cot, wood, 3, hl=1, sh=1)
    c.solid(c.rect(10, 144, 100, 150), c.R('blanket', '#5A4A3A'), 3, hl=1, sh=1)
    for lx in (12, 96):
        c.fill(c.rect(lx, 160, lx + 2, 176), wood, 2)

    # table with candle, paper, the alcohol stove (cocinilla), a book
    table(c, 228, 148, 330, wood, h=24)
    c.solid(c.rect(300, 132, 304, 147), c.R('candle', '#EEE6D2'), 5, hl=1)
    c.fill(c.rect(302, 128, 302, 131), c.R('flame', '#FFF0C0'), 6)
    c.solid(c.ell(296, 144, 308, 149), brass, 3, hl=1)
    lamp_glow(c, 302, 130, 90, 0.85, mask=~c.rect(296, 126, 308, 149))
    # the small alcohol stove: a squat metal burner with a lid
    stv = c.R('stove', '#8A8E96')
    c.solid(c.rect(250, 136, 266, 146), stv, 3, hl=1, sh=1)
    c.solid(c.ell(248, 132, 268, 140), stv, 4, hl=1)
    c.fill(c.rect(256, 130, 260, 132), stv, 2)
    for i in range(2):
        c.solid(c.rect(272 + i, 144 - i, 290 + i, 147 - i), paper, 5, hl=0, sh=1)
    c.fill(c.rect(275, 142, 288, 142) & (c.xx % 3 != 1), c.R('ink', '#2E2A34'), 2)
    c.solid(c.rect(234, 140, 246, 147), c.R('book', '#3A2A2A'), 3, hl=1)
    chair(c, 214, 156, wood, facing=1)

    fl = c.rect(0, 176, W - 1, H - 1)
    c.fill(fl, stone, 2)
    c.tex(fl, tex_blocks(c, 20, 6, y0=176, seed=5))
    c.dither_adjust(fl & ~c.ell(140, 160, 380, 240), -0.5)
    c.dither_adjust(wall & ~c.ell(150, 40, 420, 260), -0.5)

    shadow(c, 160, 203, 192, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(coat_col='#1C1C22', vest_col='#ECE6D8', trousers='#1C1C22', grade=g)
    anchors = {'rizal': place(img, rz, 160, flip=True)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_fortsantiago.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_fortsantiago.png')
    print(a)
