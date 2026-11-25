"""Biñan, 1869 — school in Maestro Justiniano Aquino Cruz's nipa house, rainy season.
Woven sawali walls, bamboo rafters under nipa thatch, a split-bamboo floor, a wide
window with a tukod prop showing rain on banana and bamboo. The teacher stands with
his ferule; José (8) and two pupils with their cartillas."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_thatch, BAYER
from common import W, H, grade_fn, sky, shadow, canopy
from kit2 import place, rain, table
import chars


def build():
    g = grade_fn('#9FB0B8', 0.10, contrast=1.02)
    c = Canvas(W, H, grade=g)
    sawali = c.R('sawali', '#B39466')
    bamboo = c.R('bamboo', '#C2A56A')
    post = c.R('post', '#6E5232')
    thatch = c.R('nipa', '#8A7048')
    leaf = c.R('banana', '#4E7A3A')
    bamb_g = c.R('bamboo_g', '#6E8A44')
    rainsky = c.R('rainsky', '#9AA6AC')
    wood = c.R('narra', '#7A4A30')
    paper = c.R('paper', '#E6DCC2')

    # big window with a tukod (prop) and rain outside
    wx0, wy0, wx1, wy1 = 40, 56, 170, 124
    win = c.rect(wx0, wy0, wx1, wy1)
    sky(c, '#7E8A92', '#B6C0C2', wy1, y0=wy0)
    far = c.poly([(wx0, 98), (80, 88), (120, 94), (wx1, 84), (wx1, wy1), (wx0, wy1)])
    c.fill(far & win, bamb_g, 2)
    c.dither_adjust(far & win, 0.5)
    canopy(c, 118, 70, 50, 40, bamb_g, seed=3, base=2)
    # banana plant
    for k, (ang, L) in enumerate(((-2.6, 28), (-2.0, 30), (-1.0, 30), (-0.5, 26), (-1.6, 22))):
        x0, y0 = 70, 100
        pts = [(x0 + np.cos(ang) * t, y0 + np.sin(ang) * t * 0.7 + (t / L) ** 2 * 12) for t in range(L)]
        for t, (px, py) in enumerate(pts):
            wv = int(4 * np.sin(np.pi * t / L)) + 1
            c.fill(c.rect(int(px), int(py) - wv, int(px), int(py) + wv // 2), leaf, 3 + (1 if k % 2 else 0))
            if t % 3 == 0:
                c.fill(c.rect(int(px), int(py) - wv, int(px), int(py) - wv), leaf, 1)
        c.fill(c.line(pts, 1), leaf, 5)
    c.solid(c.rect(68, 100, 73, wy1), c.R('btrunk', '#6E7A3E'), 3, hl=1)
    # back wall: woven sawali with a basket-weave pattern
    wall = c.rect(0, 30, W - 1, 168) & ~win
    c.fill(wall, sawali, 3)
    weave = ((c.xx // 4 + c.yy // 4) % 2 == 0)
    c.adjust(wall & weave & ((c.yy % 4) == 0), -1)
    c.adjust(wall & ~weave & ((c.xx % 4) == 0), -1)
    c.adjust(wall & weave & ((c.xx + c.yy) % 4 == 1), 1)
    c.dither_adjust(wall & (c.yy > 120), -0.35)

    # roof underside: nipa thatch between bamboo rafters
    roof = c.poly([(0, 0), (W, 0), (W, 34), (0, 34)])
    c.fill(roof, thatch, 2)
    c.tex(roof, tex_thatch(c, seed=4))
    c.dither_adjust(roof, -0.5)
    for rx in range(10, W, 46):
        c.solid(c.poly([(rx, 0), (rx + 4, 0), (rx + 10, 34), (rx + 6, 34)]), bamboo, 3, hl=1, sh=1)
        for k in range(4, 34, 9):
            c.fill(c.rect(rx + k // 4, k, rx + k // 4 + 4, k), bamboo, 1)
    c.solid(c.rect(0, 30, W - 1, 34), bamboo, 3, hl=1, sh=1)  # wall plate
    for k in range(0, W, 23):
        c.fill(c.rect(k, 31, k, 33), bamboo, 1)

    # posts
    for px in (2, 196, 372):
        c.solid(c.rect(px, 30, px + 9, 176), post, 2, hl=1, sh=1)
        c.tex(c.rect(px, 30, px + 9, 176), tex_noise(c, 0.10, 0.04, seed=px))

    rain(c, win, seed=11, density=0.011, rid=rainsky, tone=5)
    # frame and sill; window panel propped open with a bamboo tukod
    c.solid(c.rect(wx0 - 4, wy0 - 4, wx1 + 4, wy0 - 1), bamboo, 3, hl=1, sh=1)
    c.solid(c.rect(wx0 - 4, wy1 + 1, wx1 + 4, wy1 + 5), bamboo, 3, hl=1, sh=1)
    c.solid(c.rect(wx0 - 4, wy0 - 4, wx0 - 1, wy1 + 5) | c.rect(wx1 + 1, wy0 - 4, wx1 + 4, wy1 + 5), bamboo, 2, hl=1)
    panel = c.poly([(wx0 - 6, wy0 - 6), (wx1 + 6, wy0 - 6), (wx1 + 18, wy0 - 26), (wx0 + 6, wy0 - 26)])
    c.fill(panel, sawali, 4)
    c.adjust(panel & ((c.xx // 4 + c.yy // 3) % 2 == 0) & (c.yy % 3 == 0), -1)
    c.solid(c.poly([(wx0 - 6, wy0 - 6), (wx1 + 6, wy0 - 6), (wx1 + 6, wy0 - 4), (wx0 - 6, wy0 - 4)]), bamboo, 3, hl=1)
    c.fill(c.line([(wx1 - 10, wy1 + 4), (wx1 + 10, wy0 - 22)], 2), bamboo, 2)
    # drips from the eaves on the sill
    for dx in range(wx0 + 4, wx1, 13):
        c.fill(c.rect(dx, wy1 + 6, dx, wy1 + 7), rainsky, 6)
    # cool daylight on wall under window
    c.dither_adjust(c.rect(wx0 - 10, wy1 + 6, wx1 + 10, 168) & ~c.rect(196, 0, 206, H), 0.25)

    # on the wall: a small crucifix shelf and a calendar-sheet (almanac)
    c.solid(c.rect(250, 66, 284, 69), wood, 3, hl=1)
    c.solid(c.rect(265, 46, 267, 66) | c.rect(259, 51, 273, 53), wood, 2, hl=1)
    c.solid(c.rect(300, 54, 326, 86), paper, 4, hl=0, sh=1)
    for ly in range(60, 84, 4):
        c.fill(c.rect(303, ly, 323, ly) & (c.xx % 4 != 0), c.R('ink', '#3A3440'), 2)
    c.fill(c.rect(303, 56, 323, 57), c.R('red', '#8A2E2A'), 3)

    # low table with cartillas, slate and inkwell; bench
    table(c, 222, 150, 360, wood, h=24)
    c.solid(c.rect(240, 144, 258, 149), paper, 5, hl=1, sh=1)
    c.solid(c.rect(262, 145, 280, 149), c.R('slate', '#3C4248'), 3, hl=1)
    c.fill(c.rect(266, 147, 276, 147), c.R('chalk', '#D8D8D0'), 5)
    c.solid(c.ell(292, 144, 298, 150), c.R('inkwell', '#2A2A34'), 3, hl=1)
    c.fill(c.line([(296, 146), (300, 138)]), c.R('quill', '#E8E0CC'), 5)
    c.solid(c.rect(316, 143, 340, 149), c.R('cover', '#6A3A2A'), 3, hl=1, sh=1)

    # split-bamboo floor (raised house): long slats with dark gaps
    fl = c.rect(0, 168, W - 1, H - 1)
    c.fill(fl, bamboo, 3)
    slat = (c.yy - 168) // 4
    c.fill(fl & ((c.yy - 168) % 4 == 3), bamboo, 0)
    c.adjust(fl & ((c.yy - 168) % 4 == 0), 1)
    c.adjust(fl & (((c.xx + slat * 37) % 61) == 0), -2)
    c.tex(fl, tex_noise(c, 0.05, 0.03, seed=8))
    c.dither_adjust(c.rect(0, 168, W - 1, 176), -0.6)

    for x0, x1 in ((50, 90), (98, 128), (136, 164), (176, 204)):
        shadow(c, x0, 203, x1, 209, -1)
    img = c.render().convert('RGBA')
    teacher = chars.man(skin='brown', hair='#4A4448', hair_style='cropped', mustache=False, coat='shirt', shirt='#D9CCA8',
                        trousers='#3E3A3A', holding='cane', shoes='#3A2A22', grade=g)
    pupil_a = chars.child(scale='boy', skin='brown', shirt='#E8DCC2', shorts='#6A5A4A', grade=g)
    jose = chars.child(scale='boy', barefoot=True, shirt='#F0EADC', shorts='#3A3E52', holding='books', grade=g)
    pupil_b = chars.child(scale='boy', skin='morena2', shirt='#DCD2BC', shorts='#4E4A3E', grade=g)
    anchors = {}
    anchors['justiniano'] = place(img, teacher, 52, flip=True)
    place(img, pupil_b, 100)
    anchors['jose-boy'] = place(img, jose, 132)
    place(img, pupil_a, 162)
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_binan.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_binan.png')
    print(a)
