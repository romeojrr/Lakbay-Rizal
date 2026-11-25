"""Leitmeritz (Litoměřice), May 1887 — the great market square.
Baroque and Renaissance burgher houses with arcades and curly gables, the town hall
with its stepped gable, the house with the famous chalice-shaped roof turret, and the
cathedral hill behind. Ferdinand Blumentritt welcomes Rizal and Maximo Viola."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_cobbles, tex_tiles
from common import W, H, grade_fn, sky, cloud, canopy, shadow
from kit2 import place, euro_window
import chars


def gable_house(c, x0, x1, y_top, col, roof, frame, glass, arcade_rid, kind=0, seed=0):
    rid = c.R(f'h{seed}', col)
    m = c.rect(x0, y_top, x1, 176)
    c.solid(m, rid, 4, hl=0, sh=1)
    c.tex(m, tex_noise(c, 0.04, 0.02, seed=seed))
    w = x1 - x0
    mid = (x0 + x1) // 2
    if kind == 0:   # baroque volute gable
        gm = c.poly([(x0 + 4, y_top), (x0 + 8, y_top - 10), (mid - 6, y_top - 14), (mid, y_top - 26), (mid + 6, y_top - 14), (x1 - 8, y_top - 10), (x1 - 4, y_top)])
        c.solid(gm, rid, 4, hl=1, sh=1)
        c.fill(c.ell(x0 + 3, y_top - 12, x0 + 11, y_top - 4) & ~c.ell(x0 + 5, y_top - 10, x0 + 9, y_top - 6), rid, 3)
        c.fill(c.ell(x1 - 11, y_top - 12, x1 - 3, y_top - 4) & ~c.ell(x1 - 9, y_top - 10, x1 - 5, y_top - 6), rid, 3)
        euro_window(c, mid - 3, y_top - 16, 5, 8, frame, glass, arch=True, mullion=False)
    else:           # stepped gable
        for k in range(4):
            c.solid(c.rect(x0 + 4 + k * w // 9, y_top - 7 * (k + 1), x1 - 4 - k * w // 9, y_top), rid, 4, hl=1, sh=1)
    c.fill(c.rect(x0, y_top, x1, y_top + 1), rid, 2)
    for wy in (y_top + 6, y_top + 30):
        for wx in range(x0 + 6, x1 - 8, 14):
            euro_window(c, wx, wy, 6, 14, frame, glass)
            c.fill(c.rect(wx - 3, wy - 4, wx + 9, wy - 3), rid, 5)
    # ground-floor arcade
    for ax in range(x0 + 2, x1 - 14, 18):
        op = c.ell(ax, 140, ax + 14, 154) | c.rect(ax, 147, ax + 14, 176)
        c.fill(op, arcade_rid, 1)
        c.dither_adjust(op & (c.yy > 160), 0.4)
    c.fill(c.rect(x0, 136, x1, 137), rid, 5)


def build():
    g = grade_fn('#F2E6C8', 0.05, contrast=1.10)
    c = Canvas(W, H, grade=g)
    sky(c, '#6A9AD0', '#E0EAF0', 70)
    cloud(c, 150, 8, 90, 14, c.R('cloud', '#F8F6F0'), seed=4)
    frame = c.R('frame', '#5A4A3E')
    glass = c.R('glass', '#4E5A66')
    roof = c.R('roof', '#8E4A3A')
    arc = c.R('arcade', '#4A3E3A')
    hill = c.R('hill', '#5E7E4A')

    # cathedral hill (St Stephen) in the distance
    c.fill(c.poly([(0, 70), (60, 54), (130, 60), (130, 110), (0, 110)]), hill, 3)
    canopy(c, 0, 50, 80, 30, hill, seed=2, base=3)
    cat = c.rect(40, 28, 110, 64)
    c.solid(cat, c.R('cathedral', '#E2D6BC'), 4, hl=1, sh=1)
    c.solid(c.poly([(36, 30), (75, 16), (114, 30)]), roof, 3, hl=1, sh=1)
    c.solid(c.rect(96, 6, 108, 40), c.R('cathedral', '#E2D6BC'), 4, hl=1, sh=1)
    c.solid(c.ell(94, -4, 110, 10) & (c.yy < 8), c.R('copper', '#5E8A7A'), 3, hl=1)
    c.fill(c.rect(102, -8, 102, -2), c.R('gold', '#C9A24A'), 4)

    # row of burgher houses on the far side of the square
    specs = [(-6, 46, 74, '#E8D2A6', 0), (46, 96, 70, '#C8D4C0', 0), (96, 150, 64, '#E6C2A4', 1),
             (150, 232, 58, '#EADCC0', 1), (232, 290, 66, '#D8C4A0', 0), (290, 340, 72, '#C8B4A8', 0), (340, 392, 68, '#E2D8B8', 1)]
    for i, (x0, x1, yt, col, kind) in enumerate(specs):
        gable_house(c, x0, x1, yt, col, roof, frame, glass, arc, kind, seed=i)
    # the town hall (150–232) gets a clock and a small tower
    c.solid(c.rect(186, 18, 198, 40), c.R('h3', '#EADCC0'), 4, hl=1, sh=1)
    c.solid(c.poly([(184, 20), (192, 4), (200, 20)]), roof, 3, hl=1)
    c.fill(c.ell(187, 26, 197, 36), c.R('clock', '#E8D8A8'), 5)
    c.fill(c.rect(192, 28, 192, 31) | c.rect(192, 31, 194, 31), c.R('ink', '#24242C'), 1)
    # the Chalice House turret (copper chalice on the roof of the house at right)
    ch = c.R('copper', '#5E8A7A')
    c.solid(c.poly([(304, 52), (326, 52), (322, 40), (318, 36), (312, 36), (308, 40)]), ch, 3, hl=1, sh=1)  # cup
    c.solid(c.rect(313, 52, 317, 62), ch, 2, hl=1)  # stem
    c.solid(c.ell(306, 60, 324, 66), ch, 3, hl=1)  # foot
    c.fill(c.rect(304, 52, 326, 53), ch, 5)

    # square: cobbles, a baroque plague column, a fountain basin
    sq = c.rect(0, 176, W - 1, H - 1)
    c.fill(sq, c.R('cobble', '#A89884'), 4)
    c.tex(sq, tex_cobbles(c, seed=6))
    c.dither_adjust(c.rect(0, 176, W - 1, 180), -0.5)
    col = c.R('column', '#C8C0B0')
    c.solid(c.rect(266, 150, 290, 186), col, 4, hl=1, sh=1)
    c.solid(c.rect(274, 78, 282, 150), col, 4, hl=1, sh=1)
    c.solid(c.ell(270, 68, 286, 82), col, 4, hl=1)
    c.solid(c.rect(276, 56, 280, 70), c.R('gold', '#C9A24A'), 4, hl=1)
    c.solid(c.ell(273, 52, 283, 60), c.R('gold', '#C9A24A'), 5, hl=1)
    for sx in (262, 290):
        c.solid(c.rect(sx - 4, 140, sx + 4, 154), col, 3, hl=1)
        c.solid(c.ell(sx - 3, 132, sx + 3, 140), col, 4, hl=1)
    c.solid(c.rect(258, 184, 298, 190), col, 3, hl=1)
    shadow(c, 300, 186, 340, 194, -1)

    for x0, x1 in ((96, 128), (140, 172), (180, 212)):
        shadow(c, x0, 203, x1, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(coat_col='#2E3346', hat='bowler', grade=g)
    vi = chars.man(skin='viola', hair='#241C1A', coat_col='#5E4632', vest_col='#8A6A44', trousers='#4A3A30', hat='bowler', hat_col='#2E2420', tie='red', grade=g)
    bl = chars.man(skin='pale', hair='#6A4E36', coat='frock', coat_col='#3A3430', vest_col='#5A4E44', trousers='#4A4440', beard=True, glasses=True, grade=g)
    anchors = {'viola': place(img, vi, 96, flip=True), 'rizal': place(img, rz, 138, flip=True), 'blumentritt': place(img, bl, 180)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_leitmeritz.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_leitmeritz.png')
    print(a)
