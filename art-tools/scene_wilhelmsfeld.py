"""Wilhelmsfeld, summer 1886 — the Protestant vicarage in the Odenwald hills.
A half-timbered pastor's house with a garden fence, the small village church,
hay meadows and pine woods behind. Pastor Karl Ullmer greets Rizal at the gate."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_tiles
from common import W, H, grade_fn, sky, cloud, ridge, canopy, trunk, shadow
from kit2 import place, euro_window
import chars


def timber_house(c, x0, x1, y0, ground, plaster, beam, roof, glass, frame, seed=0):
    m = c.rect(x0, y0, x1, ground)
    c.solid(m, plaster, 5, hl=0, sh=1)
    c.tex(m, tex_noise(c, 0.04, 0.0, seed=seed))
    mid = (y0 + ground) // 2
    for xx in range(x0, x1 + 1, 14):
        c.fill(c.rect(xx, y0, xx + 1, ground), beam, 1)
    c.fill(c.rect(x0, y0, x1, y0 + 1) | c.rect(x0, mid, x1, mid + 1) | c.rect(x0, ground - 1, x1, ground), beam, 1)
    for xx in range(x0, x1 - 13, 28):
        c.fill(c.line([(xx, mid), (xx + 14, y0)], 1) | c.line([(xx + 14, y0), (xx + 28, mid)], 1), beam, 2)
        c.fill(c.line([(xx, ground), (xx + 14, mid)], 1), beam, 2)
    for wx in range(x0 + 4, x1 - 8, 28):
        euro_window(c, wx + 2, y0 + 5, 6, mid - y0 - 9, frame, glass, shutters=None)
        euro_window(c, wx + 16, mid + 5, 6, ground - mid - 12, frame, glass, shutters=None)
    rm = c.poly([(x0 - 6, y0 + 1), ((x0 + x1) // 2, y0 - (x1 - x0) // 2 - 2), (x1 + 6, y0 + 1)])
    c.solid(rm, roof, 3, hl=1, sh=1)
    c.tex(rm, tex_tiles(c, 4, 3))
    return m | rm


def build():
    g = grade_fn('#F6E8C6', 0.07, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#5E96D2', '#DCEAF0', 80)
    cl = c.R('cloud', '#F8F6F0')
    cloud(c, 60, 10, 70, 14, cl, seed=1)
    cloud(c, 270, 18, 60, 10, cl, seed=6)
    pine = c.R('pine', '#2E4E36')
    meadow = c.R('meadow', '#8AA24A')
    hay = c.R('hay', '#C8B46A')
    plaster = c.R('plaster', '#EAE0C8')
    beam = c.R('beam', '#4A3226')
    roof = c.R('roof', '#9A4A36')
    glass = c.R('glass', '#4E5A66')
    frame = c.R('frame', '#6A4A36')
    fence = c.R('fence', '#B8A68A')
    path = c.R('path', '#C8B494')
    flower = c.R('rose', '#D25A6A')

    ridge(c, c.R('farhill', '#7A9A8A'), 70, 18, 0.015, seed=3)
    m_p, yv = ridge(c, pine, 88, 26, 0.03, seed=4, peaks=((90, 12, 40),))
    c.adjust(m_p & ((((c.xx * 5) % 7) == 0) & (c.yy < yv[np.clip(c.xx, 0, W - 1)] + 6)), 1)
    for x in range(0, W, 5):
        top = int(yv[x])
        c.fill(c.poly([(x - 2, top + 2), (x, top - 4), (x + 2, top + 2)]), pine, 3)
    hm = c.poly([(0, 104), (140, 96), (260, 100), (W, 94), (W, 150), (0, 150)])
    c.fill(hm, meadow, 3)
    c.tex(hm, tex_noise(c, 0.06, 0.06, seed=4))
    for k in range(6):
        c.adjust(hm & (np.abs((c.yy - 100) - (c.xx * 0.05 + k * 9)) < 1), -1)
    for hx_, hy in ((40, 116), (70, 112), (300, 108)):
        c.solid(c.ell(hx_, hy, hx_ + 8, hy + 7), hay, 4, hl=1, sh=1)

    # the village church (small, white, with a slate onion-less pointed spire)
    ch = c.rect(244, 66, 300, 120)
    c.solid(ch, plaster, 5, hl=0, sh=1)
    c.solid(c.poly([(240, 67), (272, 46), (304, 67)]), roof, 3, hl=1, sh=1)
    tw = c.rect(286, 40, 300, 120)
    c.solid(tw, plaster, 5, hl=1, sh=1)
    c.solid(c.poly([(284, 41), (293, 14), (302, 41)]), c.R('slate', '#4E5460'), 3, hl=1, sh=1)
    c.fill(c.rect(293, 8, 293, 14) | c.rect(291, 10, 295, 10), c.R('gold', '#C9A24A'), 4)
    c.fill(c.ell(289, 48, 297, 58), c.R('clock', '#E8E0CC'), 5)
    c.fill(c.rect(293, 50, 293, 53) | c.rect(293, 53, 295, 53), c.R('ink', '#24242C'), 1)
    for wx in (252, 266):
        euro_window(c, wx, 80, 6, 18, frame, glass, arch=True, mullion=False)

    # the vicarage
    timber_house(c, 40, 194, 82, 160, plaster, beam, roof, glass, frame, seed=2)
    door = c.rect(108, 128, 124, 160)
    c.solid(door, c.R('door', '#5E3A26'), 2, hl=1, sh=1)
    c.fill(c.rect(110, 130, 122, 140), c.R('door', '#5E3A26'), 3)
    c.fill(c.rect(120, 145, 121, 146), c.R('brass', '#B8923E'), 5)
    c.solid(c.rect(104, 160, 128, 164), c.R('step', '#A89A84'), 4, hl=1)
    # chimney with a curl of smoke
    c.solid(c.rect(160, 30, 168, 54), c.R('chim', '#9A6A54'), 3, hl=1)
    for k in range(5):
        c.dither_adjust(c.ell(164 + k * 6, 14 - k * 3, 174 + k * 7, 24 - k * 3), 0.45 - k * 0.06)
    # climbing roses
    rng = np.random.default_rng(3)
    for _ in range(40):
        x, y = int(rng.integers(40, 104)), int(rng.integers(124, 160))
        c.fill(c.rect(x, y, x + 1, y + 1), c.R('rleaf', '#4A7A3A'), 3)
        if rng.random() < 0.5:
            c.fill(c.rect(x, y, x, y), flower, 4)

    # front garden, path and fence
    gd = c.rect(0, 160, W - 1, H - 1)
    c.fill(gd, meadow, 4)
    c.tex(gd, tex_noise(c, 0.08, 0.06, seed=9))
    pth = c.poly([(104, 164), (128, 164), (200, H), (136, H)])
    c.fill(pth, path, 4)
    c.tex(pth, tex_noise(c, 0.08, 0.04, seed=10))
    for fx in list(range(0, 100, 7)) + list(range(152, W, 7)):
        c.solid(c.rect(fx, 172, fx + 3, 192), fence, 4, hl=1, sh=1)
        c.fill(c.poly([(fx, 172), (fx + 1.5, 169), (fx + 3, 172)]), fence, 4)
    c.fill(c.rect(0, 177, 100, 178) | c.rect(152, 177, W, 178) | c.rect(0, 186, 100, 187) | c.rect(152, 186, W, 187), fence, 2)
    # a linden tree at right
    trunk(c, 346, 80, 176, 6, c.R('bark', '#5A4A3A'))
    canopy(c, 304, 20, 90, 80, c.R('linden', '#4E7A3A'), seed=5, base=3)
    shadow(c, 300, 172, 384, 182, -1)

    shadow(c, 142, 203, 174, 209, -1)
    shadow(c, 180, 203, 212, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(coat_col='#5A4E40', vest_col='#7A6A50', trousers='#4E4840', hat='straw', hat_col='#D8C08A', grade=g)
    ul = chars.man(skin='fair', hair='#7A6A58', hair_style='cropped', coat='frock', coat_col='#1C1C22', vest_col='#1C1C22', trousers='#24242C', tie='bow', shirt='#F2F0EA', beard=True, holding='book', grade=g)
    anchors = {'rizal': place(img, rz, 140, flip=True), 'ullmer': place(img, ul, 180)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_wilhelmsfeld.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_wilhelmsfeld.png')
    print(a)
