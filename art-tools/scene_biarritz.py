"""Biarritz, February–March 1891 — the terrace of Villa Eliada, the Boustead
family's winter house. Stone balustrade, potted palms, the Bay of Biscay rolling onto
dark rocks, a white villa with a slate roof and striped awning. Rizal with Nellie
Boustead."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_tiles, tex_blocks
from common import W, H, grade_fn, sky, cloud, palm, shadow
from kit2 import place, water, euro_window
import chars


def build():
    g = grade_fn('#F2E2C8', 0.06, contrast=1.05)
    c = Canvas(W, H, grade=g)
    sky(c, '#6A9AD0', '#E8EEF0', 100)
    cl = c.R('cloud', '#F8F6F2')
    cloud(c, 60, 16, 100, 16, cl, seed=3)
    cloud(c, 250, 30, 80, 12, cl, seed=7)
    sea = c.R('biscay', '#3E7A9A')
    rock = c.R('rock', '#4E4A4A')
    foam = c.R('foam', '#EEF4F4')
    stone = c.R('stone', '#D8CCB4')
    slate = c.R('slate', '#4A505E')
    plaster = c.R('villa', '#EEE8DA')

    wm = water(c, 100, 150, sea, seed=6, base=3, top_tone=4)
    c.fill(c.rect(0, 100, W - 1, 101), sea, 5)
    # the Rocher de la Vierge-like rocks with a footbridge and breaking surf
    for x0, x1, top in ((40, 96, 112), (96, 130, 122), (300, 384, 108)):
        rm = c.poly([(x0, 150), (x0 + 6, top + 6), ((x0 + x1) // 2, top), (x1 - 4, top + 8), (x1, 150)])
        c.solid(rm, rock, 3, hl=1, sh=1, sh2=1)
        c.tex(rm, tex_noise(c, 0.12, 0.06, seed=x0))
        surf = c.ell(x0 - 10, 140, x1 + 10, 154) & ~rm
        c.fill(surf & (((c.xx + c.yy * 3) % 5) < 3), foam, 5)
    c.fill(c.line([(96, 118), (130, 120)], 1), c.R('iron', '#2E2E34'), 3)
    c.solid(c.rect(64, 100, 68, 112), c.R('statue', '#F2EEE6'), 5, hl=1)
    for k in range(5):
        y = 128 + k * 5
        c.fill(c.rect(0, y, W - 1, y) & (((c.xx + k * 13) % 37) < 14) & wm, foam, 5)

    # the villa at right: white walls, slate mansard, awning
    vm = c.rect(250, 40, 390, 160)
    c.solid(vm, plaster, 5, hl=0, sh=1)
    c.solid(c.poly([(244, 42), (260, 16), (384, 16), (394, 42)]), slate, 3, hl=1, sh=1)
    c.tex(c.poly([(244, 42), (260, 16), (384, 16), (394, 42)]), tex_tiles(c, 4, 3))
    for dx in (274, 330):
        c.solid(c.rect(dx, 20, dx + 14, 36), plaster, 5, hl=1)
        euro_window(c, dx + 4, 23, 6, 10, c.R('frame', '#5A5A60'), c.R('glass', '#4E5A66'))
    for wx in range(266, 380, 28):
        euro_window(c, wx, 52, 10, 30, c.R('frame', '#5A5A60'), c.R('glass', '#4E5A66'), shutters=c.R('shutter', '#5A7A9A'))
    aw = c.poly([(256, 96), (390, 96), (394, 110), (252, 110)])
    c.fill(aw, c.R('awn', '#2E5A8A'), 3)
    c.fill(aw & ((c.xx // 4) % 2 == 0), c.R('awn2', '#EEE8DA'), 5)
    c.fill(c.rect(256, 110, 390, 150), c.R('shade', '#6A6460'), 2)
    for dx in range(262, 390, 26):
        c.fill(c.rect(dx, 116, dx + 14, 150), c.R('glass', '#4E5A66'), 2)

    c.solid(c.rect(250, 150, W - 1, 172), stone, 3, hl=1, sh=1)
    c.tex(c.rect(250, 150, W - 1, 172), tex_blocks(c, 12, 6, x0=250, y0=150, seed=3))
    c.fill(c.rect(300, 152, 336, 172), c.R('door', '#3A4A5A'), 2)
    # terrace: stone balustrade, tiled floor, potted palms
    bal = c.rect(0, 150, 250, 172)
    c.solid(c.rect(0, 148, 250, 152), stone, 4, hl=1, sh=1)
    for bx in range(2, 250, 8):
        c.solid(c.ell(bx, 152, bx + 5, 166) | c.rect(bx + 1, 160, bx + 4, 170), stone, 4, hl=1, sh=1)
    c.solid(c.rect(0, 168, 250, 172), stone, 3, hl=1)
    fl = c.rect(0, 172, W - 1, H - 1)
    c.fill(fl, c.R('terrace', '#C8A890'), 4)
    c.tex(fl, tex_tiles(c, 12, 6, y0=172))
    c.adjust(fl & (((c.xx // 12 + (c.yy - 172) // 6) % 2) == 0), -1)
    for px in (24, 226):
        c.solid(c.poly([(px - 10, 176), (px + 10, 176), (px + 7, 196), (px - 7, 196)]), c.R('pot', '#A85A3A'), 3, hl=1, sh=1)
        palm(c, px, 178, 34, 6, c.R('frond', '#4E7A3A'), c.R('ptrunk', '#8A7A5A'), seed=px)
        shadow(c, px - 12, 194, px + 14, 200, -1)

    for x0, x1 in ((128, 160), (166, 198)):
        shadow(c, x0, 203, x1, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(coat_col='#3A3E4E', vest_col='#C8BCA0', trousers='#5A5650', grade=g)
    ne = chars.woman(skin='fair', dress='euro', bodice='#5A6A8A', hair='#3A2A22', hat_col='#E8E0D0', grade=g)
    anchors = {'rizal': place(img, rz, 128, flip=True), 'nellie': place(img, ne, 166)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_biarritz.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_biarritz.png')
    print(a)
