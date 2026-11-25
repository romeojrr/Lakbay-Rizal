"""Nevada, May 1888 — a stop on the line east from San Francisco.
A wooden depot with a water tank, a 4-4-0 locomotive with a balloon stack and a
varnished passenger car, the snow-tipped Sierra behind and sagebrush flats.
Rizal steps down to stretch on the long ride to New York."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_planks_v, tex_planks_h
from common import W, H, grade_fn, sky, cloud, ridge, shadow
from kit2 import place
import chars


def build():
    g = grade_fn('#F6DEB0', 0.08, contrast=1.05)
    c = Canvas(W, H, grade=g)
    sky(c, '#4E8AD0', '#E6E4D6', 110)
    cl = c.R('cloud', '#F8F6F0')
    cloud(c, 20, 14, 80, 12, cl, seed=1)
    cloud(c, 260, 6, 70, 12, cl, seed=4)
    snow = c.R('snow', '#EEF0F4')
    mtn = c.R('sierra', '#7A86A0')
    m1, yv = ridge(c, mtn, 92, 50, 0.018, seed=7, peaks=((80, 30, 30), (300, 24, 40)), y_max=120)
    ytop = np.interp(c.xx, np.arange(W), yv)
    sn = m1 & (ytop < 66) & (c.yy < ytop + (66 - ytop) * 0.9 + ((c.xx * 7) % 5))
    c.fill(sn, snow, 5)
    c.adjust(sn & (((c.xx - c.yy) % 5) == 0), -1)
    ridge(c, c.R('foothill', '#9A8A6A'), 112, 14, 0.03, seed=2, y_max=130)
    flat = c.rect(0, 120, W - 1, 150)
    c.fill(flat, c.R('sage', '#A8A47A'), 4)
    rng = np.random.default_rng(3)
    for _ in range(160):
        x, y = int(rng.integers(0, W)), int(rng.integers(122, 150))
        c.fill(c.ell(x, y, x + 3, y + 2), c.R('brush', '#7A8A5E'), int(rng.integers(2, 4)))

    wood = c.R('depot', '#B88A5A')
    trim = c.R('trim', '#6A3E2A')
    iron = c.R('iron', '#26262C')
    brass = c.R('brass', '#C9A24A')
    red = c.R('red', '#8A2E26')
    car = c.R('car', '#6A2E1E')
    glass = c.R('glass', '#3E4650')

    # water tank on stilts
    c.solid(c.ell(318, 50, 370, 62) | c.rect(318, 56, 370, 92), c.R('tank', '#8A5A3A'), 3, hl=1, sh=1)
    c.tex(c.rect(318, 56, 370, 92), tex_planks_v(c, pw=4, x0=318))
    for bx in (322, 344, 366):
        c.fill(c.rect(bx, 92, bx + 2, 140), trim, 2)
    c.fill(c.line([(322, 96), (366, 132)]) | c.line([(366, 96), (322, 132)]), trim, 2)
    c.fill(c.rect(318, 64, 370, 65) | c.rect(318, 82, 370, 83), iron, 2)

    # depot building
    dm = c.rect(180, 96, 300, 150)
    c.solid(dm, wood, 4, hl=0, sh=1)
    c.tex(dm, tex_planks_h(c, ph=3, y0=96, seam=200, grain=0.05))
    c.solid(c.poly([(170, 98), (240, 72), (310, 98)]), trim, 2, hl=1, sh=1)
    c.fill(c.rect(170, 96, 310, 98), trim, 3)
    for wx in (192, 268):
        c.fill(c.rect(wx, 108, wx + 14, 128), glass, 2)
        c.fill(c.rect(wx - 2, 106, wx + 16, 107) | c.rect(wx + 7, 108, wx + 7, 128), trim, 3)
    c.fill(c.rect(228, 110, 248, 150), trim, 1)
    c.solid(c.rect(214, 100, 262, 106), c.R('sign', '#E8DCC0'), 5, hl=0, sh=1)
    c.fill(c.rect(220, 102, 256, 103) & (c.xx % 4 != 3), iron, 1)

    # track bed
    c.fill(c.rect(0, 148, W - 1, 156), c.R('ballast', '#8A7E70'), 3)
    c.tex(c.rect(0, 148, W - 1, 156), tex_noise(c, 0.2, 0.1, seed=6))
    for tx in range(0, W, 7):
        c.fill(c.rect(tx, 154, tx + 4, 156), c.R('tie', '#5A4030'), 2)
    c.fill(c.rect(0, 152, W - 1, 152), iron, 4)

    # passenger car (left) and the locomotive (right of it)
    cm = c.rect(0, 108, 108, 146)
    c.solid(cm, car, 3, hl=1, sh=1)
    c.solid(c.poly([(-2, 108), (110, 108), (104, 98), (4, 98)]), c.R('carroof', '#3A2A26'), 2, hl=1)
    for wx in range(6, 104, 12):
        c.fill(c.ell(wx, 112, wx + 8, 118) | c.rect(wx, 115, wx + 8, 126), glass, 2)
        c.fill(c.rect(wx + 1, 113, wx + 2, 116), glass, 4)
    c.fill(c.rect(0, 130, 108, 131), brass, 4)
    for wx in (16, 84):
        c.solid(c.ell(wx - 8, 140, wx + 8, 156), iron, 2, hl=1)
    lx = 118
    c.solid(c.rect(lx + 50, 96, lx + 86, 140), c.R('cab', '#5A2E22'), 3, hl=1, sh=1)  # cab
    c.solid(c.rect(lx + 46, 92, lx + 90, 96), c.R('carroof', '#3A2A26'), 2, hl=1)
    c.fill(c.rect(lx + 56, 102, lx + 80, 116), glass, 2)
    boiler = c.ell(lx + 4, 108, lx + 24, 132) | c.rect(lx + 14, 108, lx + 54, 132)
    c.solid(boiler, c.R('boiler', '#2E3A34'), 3, hl=1, sh=1, sh2=1)
    for bx in (lx + 22, lx + 34, lx + 46):
        c.fill(c.rect(bx, 108, bx + 1, 132), brass, 4)
    c.solid(c.poly([(lx + 8, 108), (lx + 18, 108), (lx + 24, 84), (lx + 2, 84)]), iron, 3, hl=1)  # balloon stack
    c.solid(c.ell(lx - 2, 76, lx + 28, 88), iron, 3, hl=1)
    c.solid(c.ell(lx + 30, 100, lx + 40, 110), brass, 4, hl=1)  # dome
    c.solid(c.rect(lx - 2, 112, lx + 6, 122), c.R('lamp', '#E8D8A0'), 4, hl=1)
    c.fill(c.poly([(lx - 14, 146), (lx + 4, 132), (lx + 4, 146)]), red, 3)  # cowcatcher
    c.fill(c.poly([(lx - 14, 146), (lx + 4, 132), (lx + 4, 146)]) & ((c.xx % 3) == 0), red, 1)
    for wx, r in ((lx + 18, 7), (lx + 40, 12), (lx + 66, 12)):
        c.solid(c.ell(wx - r, 146 - 2 * r + 4, wx + r, 150), red, 3, hl=1, sh=1)
        c.fill(c.ell(wx - 2, 146 - r, wx + 2, 150 - r + 2), iron, 2)
    c.fill(c.rect(lx + 28, 138, lx + 72, 139), iron, 4)
    # steam and smoke drifting back
    for k in range(7):
        c.dither_adjust(c.ell(lx + 4 - k * 16, 60 - k * 5, lx + 30 - k * 12, 78 - k * 4), 0.7 - k * 0.08)

    # wooden platform
    pf = c.rect(0, 160, W - 1, H - 1)
    c.fill(pf, c.R('boards', '#A07A50'), 3)
    c.tex(pf, tex_planks_h(c, ph=4, y0=160, seam=60, grain=0.1))
    c.fill(c.rect(0, 157, W - 1, 160), c.R('boards', '#A07A50'), 1)
    # trunk and carpet bag
    c.solid(c.rect(268, 182, 300, 202), c.R('trunk', '#5A3E2A'), 3, hl=1, sh=1)
    c.fill(c.rect(268, 188, 300, 189) | c.rect(276, 182, 277, 202) | c.rect(292, 182, 293, 202), brass, 4)
    shadow(c, 266, 200, 304, 206, -1)
    shadow(c, 182, 203, 214, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(coat='over', coat_col='#3A3A44', hat='bowler', holding='book', grade=g)
    anchors = {'rizal': place(img, rz, 182)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_usa.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_usa.png')
    print(a)
