"""Intramuros, 1879 — the cloister of the old University of Santo Tomas.
Two storeys of round stone arches around a garden courtyard, red-tiled roofs,
a stone well, a kalachuchi tree. Rizal (18) holds his prize-winning poem;
a Dominican in white habit and black cape stands by the arcade."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_blocks, tex_tiles, tex_cobbles
from common import W, H, grade_fn, sky, cloud, canopy, trunk, shadow
from kit2 import place
import chars


def arcade(c, y0, y1, x0, x1, span, stone, dark, pier=8, arch_h=None):
    """row of round arches: piers + semicircular openings showing a dark gallery"""
    m = c.rect(x0, y0, x1, y1)
    c.fill(m, stone, 4)
    c.tex(m, tex_blocks(c, 12, 6, x0=x0, y0=y0, seed=y0))
    ah = arch_h or (y1 - y0 - 6)
    for ax in range(x0 + pier, x1 - span + 1, span):
        w = span - pier
        op = c.ell(ax, y1 - ah, ax + w, y1 - ah + w) | c.rect(ax, y1 - ah + w // 2, ax + w, y1)
        c.fill(op, dark, 2)
        c.dither_adjust(op & (c.yy > y1 - ah + w // 2 + 6), 0.4)
        voussoir = c.ell(ax - 3, y1 - ah - 3, ax + w + 3, y1 - ah + w + 3) & ~c.ell(ax, y1 - ah, ax + w, y1 - ah + w) & (c.yy < y1 - ah + w // 2)
        c.fill(voussoir, stone, 5)
        c.adjust(voussoir & (((np.degrees(np.arctan2(c.yy - (y1 - ah + w // 2), c.xx - (ax + w // 2))) // 18) % 2) == 0), -1)
        c.fill(c.rect(ax + w + 1, y1 - ah + w // 2, ax + w + pier - 1, y1 - ah + w // 2 + 1), stone, 6)
    c.fill(c.rect(x0, y1 - 1, x1, y1), stone, 2)


def build():
    g = grade_fn('#F6E2B8', 0.06, contrast=1.03)
    c = Canvas(W, H, grade=g)
    stone = c.R('adobe', '#C9B48E')
    gallery = c.R('gallery', '#4A3A34')
    roof = c.R('tile', '#A4503A')
    wood = c.R('molave', '#5E3E2A')
    leaf = c.R('leaf', '#3E6A3A')
    bloom = c.R('kalachuchi', '#F4EEDC')
    floor = c.R('flag', '#B8A888')
    sk = sky(c, '#5E92C8', '#CFE2EE', 40)
    cl = c.R('cloud', '#F2F2EE')
    cloud(c, 40, 8, 70, 14, cl, seed=2)
    cloud(c, 250, 14, 90, 12, cl, seed=5)

    # far bell-tower of Santo Domingo-style belfry behind the roof
    bt = c.rect(300, 6, 336, 44)
    c.solid(bt, stone, 3, hl=1, sh=1)
    c.tex(bt, tex_blocks(c, 9, 5, seed=4))
    c.fill(c.ell(308, 12, 328, 30) | c.rect(308, 21, 328, 36), gallery, 1)
    c.solid(c.ell(312, 16, 324, 28), c.R('bell', '#8A6A30'), 3, hl=1)
    c.solid(c.poly([(296, 7), (318, -6), (340, 7)]), roof, 3, hl=1, sh=1)

    # roof eave over the upper storey
    eave = c.poly([(0, 36), (W, 36), (W, 48), (0, 48)])
    c.fill(eave, roof, 3)
    c.tex(eave, tex_tiles(c, 5, 3, y0=36))
    c.fill(c.rect(0, 48, W - 1, 50), wood, 1)
    c.fill(c.rect(0, 51, W - 1, 52), gallery, 0)

    # upper storey: lighter arcade with wooden balustrade
    arcade(c, 52, 98, -4, W + 30, 30, stone, gallery, pier=7)
    bal = c.rect(0, 86, W - 1, 98)
    c.fill(c.rect(0, 86, W - 1, 87), wood, 3)
    c.fill(bal & (c.yy > 87) & ((c.xx % 5) < 2), wood, 2)
    c.fill(c.rect(0, 98, W - 1, 102), stone, 2)
    c.fill(c.rect(0, 99, W - 1, 99), stone, 5)

    # lower storey: heavier arches
    arcade(c, 102, 166, -10, W + 40, 44, stone, gallery, pier=10)
    # lanterns hanging in the lower gallery
    for lx in (32, 120, 208, 296):
        c.fill(c.rect(lx, 112, lx, 122), wood, 1)
        c.solid(c.rect(lx - 3, 122, lx + 3, 130), c.R('lantern', '#E8C878'), 4, hl=1, sh=1)
    c.dither_adjust(c.rect(0, 160, W - 1, 166), -0.6)

    # courtyard floor: worn stone flags
    fl = c.rect(0, 166, W - 1, H - 1)
    c.fill(fl, floor, 4)
    c.tex(fl, tex_cobbles(c, seed=3))
    c.tex(fl, tex_noise(c, 0.04, 0.02, seed=7))

    # kalachuchi tree in a stone planter (right) and the well (left)
    pl = c.rect(300, 168, 370, 184)
    c.solid(pl, stone, 3, hl=1, sh=1)
    c.tex(pl, tex_blocks(c, 10, 5, x0=300, y0=168, seed=9))
    trunk(c, 330, 100, 170, 5, c.R('bark', '#6A5A4A'))
    c.fill(c.line([(332, 120), (352, 100)], 2) | c.line([(331, 128), (312, 108)], 2), c.R('bark', '#6A5A4A'), 3)
    cm = canopy(c, 290, 62, 96, 56, leaf, seed=6, base=3)
    rng = np.random.default_rng(3)
    for _ in range(26):
        bx, by = int(rng.integers(296, 380)), int(rng.integers(66, 112))
        if cm[by, bx]:
            c.fill(c.rect(bx, by, bx + 1, by + 1), bloom, 6)
            c.fill(c.rect(bx + 1, by + 1, bx + 1, by + 1), c.R('yolk', '#F2C84A'), 5)
    shadow(c, 290, 184, 380, 194, -1)

    wl = c.ell(14, 168, 70, 196)
    c.solid(c.ell(14, 168, 70, 182) | c.rect(14, 175, 70, 190), stone, 3, hl=1, sh=1)
    c.tex(c.rect(14, 176, 70, 190), tex_blocks(c, 9, 5, x0=14, y0=176, seed=1))
    c.fill(c.ell(20, 170, 64, 180), gallery, 0)
    c.solid(c.rect(18, 138, 20, 176) | c.rect(64, 138, 66, 176), c.R('iron', '#3A3A40'), 3, hl=1)
    c.fill(c.line([(18, 138), (42, 130), (66, 138)], 1), c.R('iron', '#3A3A40'), 3)
    c.solid(c.ell(38, 128, 46, 136), c.R('iron', '#3A3A40'), 3, hl=1)
    shadow(c, 14, 190, 78, 200, -1)

    for x0, x1 in ((150, 182), (196, 228)):
        shadow(c, x0, 203, x1, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(mustache=False, coat='sack', coat_col='#2A2E3C', vest_col='#3A3E4E', holding='sheet', grade=g)
    dom = chars.man(skin='fair', hair='#3A3030', hair_style='cropped', cassock=True, coat_col='#ECE6D8', cape='#1E1C22', mustache=False, grade=g)
    anchors = {'rizal': place(img, rz, 150, flip=True), 'dominican': place(img, dom, 198)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_ust.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_ust.png')
    print(a)
