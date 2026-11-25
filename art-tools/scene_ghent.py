"""Ghent, summer 1891 — the shop of F. Meyer-Van Loo, Vlaanderenstraat.
A small printing works: a cast-iron hand press (Albion type), type cases on slanted
frames, a stone imposing table with locked-up forms, proofs pinned to a line, and a
leaded window over a Ghent canal with stepped gables. Rizal reads a proof sheet of
El Filibusterismo beside the compositor."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_planks_h, tex_bricks
from common import W, H, grade_fn, sky, shadow
from kit2 import place, water, table
import chars


def build():
    g = grade_fn('#E8D4AA', 0.08, contrast=1.05)
    c = Canvas(W, H, grade=g)
    plaster = c.R('plaster', '#CDBE9E')
    wood = c.R('oak', '#6A4A30')
    iron = c.R('iron', '#2A2C32')
    gold = c.R('brass', '#B8923E')
    paper = c.R('paper', '#EEE6D2')
    ink = c.R('ink', '#24242C')
    stone = c.R('imposing', '#8A8A84')
    brick = c.R('brick', '#8A4E3A')

    # leaded window onto the canal (view first)
    wx0, wy0, wx1, wy1 = 236, 26, 352, 124
    win = c.rect(wx0, wy0, wx1, wy1)
    sky(c, '#8AB2D8', '#E6EEEE', wy1, y0=wy0)
    for gx, gw, gh, col in ((230, 30, 64, '#9A5A44'), (260, 26, 76, '#C8B894'), (286, 34, 58, '#7A4A3A'), (320, 36, 70, '#B8A684')):
        top = 108 - gh
        rid = c.R(f'g{gx}', col)
        for k in range(5):
            c.fill(c.rect(gx + k * gw // 10, top + k * 5, gx + gw - k * gw // 10, 108) & win, rid, 3)
        for wx in range(gx + 4, gx + gw - 4, 7):
            for wy in range(top + 26, 104, 11):
                c.fill(c.rect(wx, wy, wx + 2, wy + 5) & win, c.R('gwin', '#3A4450'), 2)
    wtr = water(c, 108, 124, c.R('canal', '#4E6E78'), seed=2)
    c.fill(c.rect(wx0, 106, wx1, 108) & win, stone, 3)
    lead = win & ((((c.xx - wx0) + (c.yy - wy0)) % 10 == 0) | (((c.xx - wx0) - (c.yy - wy0)) % 10 == 0))
    c.fill(lead, iron, 3)

    wall = c.rect(0, 0, W - 1, 170) & ~win
    c.fill(wall, plaster, 4)
    c.tex(wall, tex_noise(c, 0.06, 0.03, seed=1))
    c.fill(c.rect(0, 120, W - 1, 170) & wall, brick, 3)
    c.tex(c.rect(0, 120, W - 1, 170) & wall, tex_bricks(c, 8, 4, y0=120, seed=3))
    c.fill(c.rect(0, 0, W - 1, 10), wood, 2)
    for bx in range(0, W, 40):
        c.solid(c.rect(bx, 0, bx + 8, 12), wood, 3, hl=1, sh=1)
    c.solid(c.rect(wx0 - 5, wy0 - 5, wx1 + 5, wy0 - 1) | c.rect(wx0 - 5, wy0, wx0 - 1, wy1 + 5) | c.rect(wx1 + 1, wy0, wx1 + 5, wy1 + 5), wood, 3, hl=1, sh=1)
    c.solid(c.rect(wx0 - 8, wy1 + 1, wx1 + 8, wy1 + 5), wood, 4, hl=1)
    c.dither_adjust(c.poly([(wx0, 170), (wx1, 170), (wx1 - 30, H), (wx0 - 90, H)]), 0.4)

    # proofs pinned on a line
    c.fill(c.line([(20, 30), (216, 34)]), c.R('string', '#8A7A60'), 3)
    for sx in range(26, 210, 16):
        sy = 30 + (sx - 20) // 50
        c.solid(c.rect(sx, sy, sx + 11, sy + 16), paper, 5, hl=0, sh=1)
        for ly in range(sy + 3, sy + 15, 2):
            c.fill(c.rect(sx + 2, ly, sx + 9, ly) & (c.xx % 5 != 3), ink, 2)

    # type cases on a slanted frame (left)
    fr = c.rect(14, 92, 100, 170)
    c.solid(fr, wood, 3, hl=1, sh=1)
    for k, y0 in enumerate((70, 92)):
        case = c.poly([(10, y0 + 22), (104, y0 + 22), (98, y0), (16, y0)])
        c.solid(case, wood, 4, hl=1, sh=1)
        comp = case & ((((c.xx - 16) % 6) == 0) | (((c.yy - y0) % 4) == 0))
        c.fill(comp, wood, 1)
        c.dither_adjust(case & ~comp, -0.45)
    for dy in range(122, 168, 8):
        c.fill(c.rect(18, dy, 96, dy), wood, 1)

    # Albion-style hand press (centre-right of the room)
    px = 136
    c.solid(c.rect(px, 98, px + 10, 170) | c.rect(px + 56, 98, px + 66, 170), iron, 3, hl=1, sh=1)  # staple sides
    c.solid(c.ell(px - 2, 80, px + 68, 108) & (c.yy < 100), iron, 3, hl=1, sh=1)  # crown
    c.solid(c.ell(px + 24, 84, px + 42, 96), gold, 4, hl=1)  # eagle/cartouche
    c.solid(c.rect(px + 14, 118, px + 52, 126), iron, 2, hl=1)  # platen
    c.solid(c.rect(px + 30, 100, px + 36, 118), iron, 3, hl=1)  # piston
    c.fill(c.line([(px + 36, 110), (px + 84, 120)], 2), iron, 3)  # bar handle
    c.solid(c.ell(px + 82, 117, px + 88, 123), wood, 4, hl=1)
    c.solid(c.rect(px - 30, 136, px + 96, 142), iron, 2, hl=1, sh=1)  # bed rails
    c.solid(c.rect(px + 10, 128, px + 56, 136), stone, 3, hl=1)  # forme on the bed
    c.fill(c.rect(px + 12, 130, px + 54, 134) & (((c.xx + c.yy) % 2) == 0), ink, 2)
    c.solid(c.rect(px - 26, 128, px + 6, 136), paper, 5, hl=1, sh=1)  # tympan with sheet
    for lx in (px - 24, px + 94):
        c.fill(c.rect(lx, 142, lx + 2, 170), iron, 2)

    # imposing stone table (front right)
    table(c, 262, 150, 360, wood, h=20)
    c.solid(c.rect(262, 144, 360, 150), stone, 4, hl=1, sh=1)
    c.solid(c.rect(272, 138, 310, 144), iron, 3, hl=1)
    c.fill(c.rect(274, 139, 308, 143) & (((c.xx + c.yy) % 2) == 0), c.R('lead', '#8A8A90'), 3)
    c.solid(c.rect(318, 140, 350, 144), wood, 4, hl=1)  # composing stick + ink roller
    c.solid(c.ell(328, 132, 342, 140), c.R('roller', '#1E1E24'), 3, hl=1)

    fl = c.rect(0, 170, W - 1, H - 1)
    c.fill(fl, wood, 2)
    c.tex(fl, tex_planks_h(c, ph=5, y0=170, seam=50, grain=0.12))
    c.fill(c.rect(0, 170, W - 1, 171), wood, 0)
    for ox, oy in ((150, 190), (60, 200)):
        c.adjust(c.ell(ox, oy, ox + 18, oy + 4), -1)

    shadow(c, 196, 203, 228, 209, -1)
    shadow(c, 234, 203, 266, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(coat_col='#2E3346', holding='sheet', grade=g)
    pm = chars.man(skin='pale', hair='#7A5A3A', coat='shirt', shirt='#E4DCCB', trousers='#3E3A40', apron='#B8AC90', mustache=True, grade=g)
    anchors = {'rizal': place(img, rz, 196, flip=True), 'printer': place(img, pm, 234)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_ghent.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_ghent.png')
    print(a)
