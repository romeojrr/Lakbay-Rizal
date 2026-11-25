"""Leipzig, autumn 1886 — Rizal's rented room.
A plain student room under the eaves: a writing table by the window, an oil lamp,
open books and manuscript pages (he is putting Schiller's Wilhelm Tell into Tagalog),
a tiled stove, a bed corner. Through the window: Leipzig's Old Town Hall tower and
gabled roofs in autumn light."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_planks_h, tex_tiles, tex_blocks
from common import W, H, grade_fn, sky, shadow
from kit2 import place, euro_window, table, chair, oil_lamp, bookshelf
import chars


def build():
    g = grade_fn('#E8C890', 0.10, contrast=1.04)
    c = Canvas(W, H, grade=g)
    paper_w = c.R('wallpaper', '#B6A88A')
    wood = c.R('wood', '#6E4A30')
    glass = c.R('autumn', '#C8B898')
    tile = c.R('stovetile', '#3E6A6A')
    paper = c.R('paper', '#EEE6D2')
    ink = c.R('ink', '#2E2A34')
    roof = c.R('roof', '#7E4A3A')
    plaster = c.R('plaster', '#D8C8A6')

    # window first (view), then wall around it
    wx0, wy0, wx1, wy1 = 44, 30, 132, 132
    win = c.rect(wx0, wy0, wx1, wy1)
    sky(c, '#C8A878', '#EAD8B0', wy1, y0=wy0)
    c.fill(win & (c.yy < wy0), glass, 3)
    # Old Town Hall: long Renaissance front with arcade and a tall tower
    rh = c.rect(wx0, 92, wx1, wy1) & win
    c.solid(rh, plaster, 4, hl=0, sh=1)
    c.fill(rh & ((c.yy - 92) % 10 > 4) & ((c.yy - 92) % 10 < 8) & ((c.xx - wx0) % 8 < 3), c.R('win', '#4A4450'), 2)
    c.fill(rh & (c.yy > 122) & ((c.xx - wx0) % 12 < 7), c.R('arcade', '#5A4A40'), 1)
    for gx in range(wx0, wx1, 18):
        c.solid(c.poly([(gx, 92), (gx + 9, 80), (gx + 18, 92)]) & win, plaster, 4, hl=1, sh=1)
    c.solid(c.poly([(wx0, 92), (wx1, 92), (wx1, 86), (wx0, 86)]) & win, roof, 3)
    tw = c.rect(78, 52, 90, 92)
    c.solid(tw, plaster, 4, hl=1, sh=1)
    c.fill(c.ell(80, 58, 88, 66), c.R('clock', '#E8D8A8'), 5)
    c.solid(c.ell(76, 42, 92, 56) & (c.yy < 54), c.R('copper', '#5E8A7A'), 3, hl=1, sh=1)
    c.solid(c.ell(80, 34, 88, 44), c.R('copper', '#5E8A7A'), 3, hl=1)
    c.fill(c.rect(84, 26, 84, 34), c.R('gold', '#C9A24A'), 4)
    for gx in range(wx0, wx1, 12):
        c.solid(c.poly([(gx, 112), (gx + 6, 104), (gx + 12, 112)]) & win, roof, 3, hl=1)

    wall = c.rect(0, 0, W - 1, 168) & ~win
    c.fill(wall, paper_w, 4)
    stripe = ((c.xx // 6) % 2 == 0)
    c.adjust(wall & stripe & ((c.yy % 5) == 0), -1)
    c.adjust(wall & ~stripe & ((c.yy % 10) == 0) & ((c.xx % 12) == 9), 1)
    c.fill(c.rect(0, 0, W - 1, 12), plaster, 4)
    c.dither_adjust(c.poly([(220, 0), (W, 0), (W, 46)]), -0.6)  # sloping ceiling shadow
    # window frame, mullions, sill, curtain
    c.solid(c.rect(wx0 - 5, wy0 - 5, wx1 + 5, wy0 - 1) | c.rect(wx0 - 5, wy0 - 5, wx0 - 1, wy1 + 5) | c.rect(wx1 + 1, wy0 - 5, wx1 + 5, wy1 + 5), wood, 3, hl=1, sh=1)
    c.fill(win & ((c.xx == 88) | (c.yy == 66) | (c.yy == 100)), wood, 2)
    c.solid(c.rect(wx0 - 8, wy1 + 1, wx1 + 8, wy1 + 5), wood, 4, hl=1)
    cm = c.rect(wx1 + 6, wy0 - 8, wx1 + 18, 150)
    c.solid(cm, c.R('curtain', '#8A6A4A'), 3, hl=1, sh=1)
    c.adjust(cm & (c.xx % 3 == 0), -1)
    c.dither_adjust(c.poly([(wx0, 168), (wx1, 168), (wx1 + 70, H), (wx0 + 40, H)]), 0.45)

    # tiled stove (Kachelofen) at right
    st = c.rect(318, 60, 366, 170)
    c.solid(st, tile, 3, hl=1, sh=1)
    c.tex(st, tex_tiles(c, 8, 8, x0=318, y0=60))
    c.solid(c.rect(314, 56, 370, 62) | c.rect(314, 108, 370, 112), tile, 4, hl=1)
    c.solid(c.rect(334, 126, 350, 140), c.R('iron', '#2E2E34'), 2, hl=1)

    # small bookshelf, pictures
    bookshelf(c, 186, 40, 236, 120, wood, seed=6, shelf_h=13)
    c.solid(c.rect(258, 46, 292, 72), wood, 2, hl=1)
    c.fill(c.rect(261, 49, 289, 69), c.R('print', '#A89878'), 4)
    c.fill(c.poly([(262, 66), (272, 54), (280, 62), (288, 56), (288, 68), (262, 68)]), c.R('printd', '#6A6050'), 3)

    # writing table by the window with lamp, books, manuscript
    table(c, 140, 146, 244, wood, h=24)
    oil_lamp(c, 228, 130, radius=34, strength=0.5)
    c.solid(c.poly([(150, 140), (168, 138), (186, 140), (186, 145), (150, 145)]), paper, 5, hl=1, sh=1)  # open book
    c.fill(c.rect(168, 138, 168, 145), paper, 2)
    for ly in range(141, 145, 2):
        c.fill(c.rect(152, ly, 165, ly) | c.rect(171, ly, 184, ly), ink, 2)
    for i in range(3):
        c.solid(c.rect(192 + i, 141 - i, 212 + i, 145 - i), paper, 5, hl=0, sh=1)
    c.fill(c.rect(196, 136, 210, 136) & (c.xx % 3 != 2), ink, 2)
    c.solid(c.rect(196, 130, 216, 136) | c.rect(194, 124, 214, 129), c.R('cover', '#5A2E2A'), 3, hl=1, sh=1)
    c.solid(c.ell(214, 140, 220, 146), c.R('inkwell', '#2A2A34'), 3, hl=1)
    c.fill(c.line([(218, 142), (222, 132)]), c.R('quill', '#E8E0CC'), 5)
    chair(c, 248, 152, wood, facing=-1)

    fl = c.rect(0, 168, W - 1, H - 1)
    c.fill(fl, wood, 3)
    c.tex(fl, tex_planks_h(c, ph=5, y0=168, seam=52, grain=0.1))
    c.fill(c.rect(0, 168, W - 1, 169), wood, 1)
    # a rag rug
    rug = c.ell(70, 190, 190, 214)
    c.fill(rug, c.R('rug', '#8A4A3A'), 3)
    c.adjust(rug & ((c.yy % 3) == 0), 1)

    shadow(c, 250, 203, 282, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(coat='shirt', shirt='#EAE2D0', vest_col='#4A3E3A', trousers='#3E3A44', holding='book', grade=g)
    anchors = {'rizal': place(img, rz, 250)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_leipzig.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_leipzig.png')
    print(a)
