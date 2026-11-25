"""Heidelberg, April 1886 — the Neckar in spring.
From the north bank: the river, the Old Bridge with its twin-towered gate, the
red sandstone castle ruin on the wooded Königstuhl, the old town roofs and the
Heiliggeistkirche spire. Forget-me-nots on the bank where Rizal stands."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_blocks, tex_tiles
from common import W, H, grade_fn, sky, cloud, ridge, canopy, shadow
from kit2 import place, water, reflect
import chars


def build():
    g = grade_fn('#F4E6C8', 0.06, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#6E9ED2', '#E2ECEE', 70)
    cl = c.R('cloud', '#F6F4EE')
    cloud(c, 30, 10, 80, 14, cl, seed=3)
    cloud(c, 220, 4, 110, 16, cl, seed=8)
    hill = c.R('forest', '#4E6E44')
    hill2 = c.R('forest2', '#6E8A5A')
    sand = c.R('sandstone', '#A06456')
    roof = c.R('roof', '#8E4436')
    plaster = c.R('plaster', '#E2D4B8')
    slate = c.R('slate', '#4E5460')
    riv = c.R('river', '#5E8AA0')
    grass = c.R('grass', '#5E8A3E')

    ridge(c, hill2, 70, 30, 0.012, seed=2, peaks=((300, 18, 60),))
    m_hill, yv = ridge(c, hill, 96, 34, 0.02, seed=5, peaks=((230, 22, 70),), y_max=140)
    # spring foliage dots on the hill
    c.adjust(m_hill & (((c.xx * 7 + c.yy * 13) % 17) == 0), 1)
    c.adjust(m_hill & (((c.xx * 11 + c.yy * 5) % 19) == 0), -1)

    # the castle ruin on the hillside (red sandstone)
    cx0 = 196
    body = c.rect(cx0, 58, cx0 + 74, 92)
    c.solid(body, sand, 3, hl=1, sh=1)
    c.tex(body, tex_blocks(c, 6, 3, x0=cx0, y0=58, seed=4))
    for wx in range(cx0 + 5, cx0 + 70, 9):
        c.fill(c.rect(wx, 64, wx + 3, 71) | c.rect(wx, 77, wx + 3, 84), c.R('void', '#2E2228'), 1)
    c.fill(c.poly([(cx0 + 24, 58), (cx0 + 30, 44), (cx0 + 38, 50), (cx0 + 44, 42), (cx0 + 50, 58)]), sand, 2)  # broken gable
    tw = c.rect(cx0 + 64, 46, cx0 + 82, 94)
    c.solid(tw, sand, 3, hl=1, sh=1)
    c.tex(tw, tex_blocks(c, 6, 3, x0=cx0 + 64, y0=46, seed=6))
    c.fill(c.rect(cx0 + 64, 46, cx0 + 82, 48) & ((c.xx % 4) < 2), sand, 1)
    # the blown-up powder tower: cut away the upper corner so sky/hill shows through
    cut = c.poly([(cx0 + 70, 45), (cx0 + 84, 45), (cx0 + 84, 74)])
    c.fill(cut, hill, 3)
    c.fill(c.line([(cx0 + 70, 46), (cx0 + 83, 73)]), sand, 1)
    # ragged roofless top edge of the palace walls
    for k in range(cx0, cx0 + 64, 3):
        c.fill(c.rect(k, 58, k + 1, 58 + (k * 7) % 4), hill, 3)
    c.dither_adjust(body | tw, -0.25)
    canopy(c, cx0 - 24, 78, 60, 22, hill, seed=3, base=3)
    canopy(c, cx0 + 30, 84, 60, 16, hill, seed=7, base=3)
    canopy(c, cx0 + 78, 80, 44, 20, hill, seed=4, base=3)

    # old town below: plaster houses with steep red roofs and the church spire
    rng = np.random.default_rng(2)
    x = 0
    while x < W:
        w = int(rng.integers(14, 24))
        h = int(rng.integers(14, 22))
        top = 122 - h
        hm = c.rect(x, top, x + w, 130)
        c.solid(hm, plaster, 4, hl=0, sh=1)
        for wx in range(x + 3, x + w - 3, 5):
            c.fill(c.rect(wx, top + 4, wx + 1, top + 6) | c.rect(wx, top + 10, wx + 1, top + 12), c.R('win', '#3E4450'), 2)
        rm = c.poly([(x - 1, top + 1), (x + w // 2, top - int(w * 0.55)), (x + w + 1, top + 1)])
        c.solid(rm, roof, 3, hl=1, sh=1)
        c.tex(rm, tex_tiles(c, 3, 2))
        x += w + int(rng.integers(0, 3))
    sp = c.rect(122, 80, 136, 126)
    c.solid(sp, sand, 3, hl=1, sh=1)
    c.solid(c.poly([(120, 82), (129, 58), (138, 82)]), slate, 3, hl=1, sh=1)
    c.solid(c.ell(125, 72, 133, 82), slate, 2, hl=1)
    c.fill(c.rect(128, 52, 129, 58), c.R('gold', '#C9A24A'), 4)
    c.fill(c.rect(126, 92, 131, 100), c.R('void', '#2E2228'), 1)
    c.fill(c.rect(0, 128, W - 1, 132), c.R('quay', '#8A7A6A'), 3)

    # river with the Old Bridge (arches, gate with twin round towers)
    wm = water(c, 132, 176, riv, seed=4, base=3, top_tone=4)
    br = c.rect(0, 124, 300, 140)
    c.solid(br, sand, 3, hl=1, sh=1)
    c.tex(br, tex_blocks(c, 10, 4, x0=0, y0=124, seed=8))
    c.dither_adjust(br, -0.3)
    for ax in range(10, 290, 42):
        op = c.ell(ax, 130, ax + 32, 162) & (c.yy >= 130) & (c.yy <= 146)
        c.fill(op, riv, 1)
    c.fill(c.rect(0, 122, 300, 123), sand, 5)
    c.fill(c.rect(0, 120, 300, 121) & ((c.xx % 3) == 0), sand, 2)
    for tx in (300, 320):
        t = c.rect(tx, 92, tx + 14, 142)
        c.solid(t, plaster, 4, hl=1, sh=1)
        c.solid(c.ell(tx - 1, 80, tx + 15, 98) & (c.yy < 94), slate, 3, hl=1, sh=1)
        c.fill(c.rect(tx + 6, 72, tx + 7, 82), slate, 2)
        c.fill(c.rect(tx + 5, 104, tx + 8, 110) | c.rect(tx + 5, 120, tx + 8, 126), c.R('void', '#2E2228'), 1)
    gate = c.rect(310, 106, 324, 142)
    c.solid(gate, plaster, 3, hl=0, sh=1)
    c.fill(c.ell(312, 124, 322, 134) | c.rect(312, 129, 322, 142), c.R('void', '#2E2228'), 1)
    reflect(c, br | c.rect(300, 92, 334, 142) | sp, 140, wm, -1)

    # near bank: grass with forget-me-nots, a willow
    bank = c.poly([(0, 172), (120, 168), (260, 174), (W, 170), (W, H), (0, H)])
    c.fill(bank, grass, 3)
    c.tex(bank, tex_noise(c, 0.10, 0.08, seed=12))
    fmn = c.R('forgetmenot', '#7AA6E8')
    rng = np.random.default_rng(9)
    for _ in range(220):
        fx, fy = int(rng.integers(0, W)), int(rng.integers(172, H))
        if bank[fy, fx]:
            c.fill(c.rect(fx, fy, fx + 1, fy), fmn, int(rng.integers(3, 6)))
            if rng.random() < 0.4:
                c.fill(c.rect(fx, fy, fx, fy), c.R('fmn_eye', '#F2D44A'), 5)
    willow = c.R('willow', '#6E8E46')
    c.solid(c.rect(356, 110, 362, 176), c.R('bark', '#5A4A3A'), 2, hl=1)
    for k in range(40):
        x0 = 326 + k * 1.6
        c.fill(c.line([(x0, 100 + (k % 5)), (x0 - 3, 150 + (k * 7) % 24)]), willow, 3 + (k % 3 == 0))
    canopy(c, 330, 88, 54, 26, willow, seed=6, base=3)
    shadow(c, 150, 203, 182, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(coat_col='#3A3E4E', vest_col='#4A4A5A', hat='bowler', grade=g)
    anchors = {'rizal': place(img, rz, 150)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_heidelberg.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_heidelberg.png')
    print(a)
