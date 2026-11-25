"""Paris, summer 1889 — the Exposition Universelle.
The new Eiffel Tower in its original red-brown paint rising over the Champ de Mars,
the domed exhibition palaces, flags, gravel walks and flower beds, chestnut trees.
Rizal visits the fair with his friend the painter Juan Luna."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_tiles
from common import W, H, grade_fn, sky, cloud, canopy, trunk, shadow
from kit2 import place
import chars


def tower(c, cx, base_y, top_y, rid):
    """open iron lattice: two curved legs, see-through between them, platforms"""
    hgt = base_y - top_y

    def half_w(y):
        t = (base_y - y) / hgt
        return 50 * (1 - t) ** 2.6 + 1.5
    solid_m = np.zeros((c.H, c.W), bool)
    lattice = np.zeros((c.H, c.W), bool)
    p1 = int(base_y - hgt * 0.14)
    for y in range(top_y, base_y + 1):
        hw = half_w(y)
        x0, x1 = int(round(cx - hw)), int(round(cx + hw))
        t = (base_y - y) / hgt
        sw = max(1, int(hw * (0.30 if t < 0.5 else 0.45)))
        if t > 0.62:
            solid_m[y, x0:x1 + 1] = True
            continue
        solid_m[y, x0:x0 + sw + 1] = True
        solid_m[y, x1 - sw:x1 + 1] = True
        if y < p1:
            lattice[y, x0 + sw:x1 - sw] = True
    # big arch between the legs below the first platform
    ar = c.ell(cx - 36, p1 - 4, cx + 36, base_y + 46) & ~c.ell(cx - 33, p1 - 1, cx + 33, base_y + 48) & (c.yy > p1) & (c.yy < base_y - 6)
    solid_m |= ar
    c.solid(solid_m, rid, 3, hl=1, sh=1)
    c.adjust(solid_m & ((((c.xx - cx) + c.yy) % 4 == 0) | (((c.xx - cx) - c.yy) % 4 == 0)), -1)
    lat = lattice & ((((c.xx - cx) + c.yy) % 6 == 0) | (((c.xx - cx) - c.yy) % 6 == 0))
    c.fill(lat, rid, 2)
    for t in (0.14, 0.45, 0.88):
        y = int(base_y - hgt * t)
        hw = half_w(y) + 3
        c.fill(c.rect(int(cx - hw), y - 2, int(cx + hw), y + 1), rid, 2)
        c.fill(c.rect(int(cx - hw), y - 3, int(cx + hw), y - 3) & ((c.xx % 2) == 0), rid, 4)
    c.fill(c.rect(cx, top_y - 8, cx, top_y), rid, 2)
    c.fill(c.rect(cx + 1, top_y - 8, cx + 6, top_y - 5), c.R('tricolour_b', '#2E4A9A'), 3)
    return solid_m


def build():
    g = grade_fn('#F8E4BE', 0.07, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#5A92D2', '#E8ECEE', 120)
    cloud(c, 10, 30, 90, 14, c.R('cloud', '#F8F6F0'), seed=2)
    cloud(c, 280, 40, 80, 12, c.R('cloud', '#F8F6F0'), seed=5)
    iron = c.R('eiffel', '#8A4A36')
    # distant Trocadéro-side trees and roofs along the horizon
    hz = c.rect(0, 116, W - 1, 142)
    c.fill(hz, c.R('haze', '#9AAA9A'), 3)
    canopy(c, -10, 108, 400, 24, c.R('farleaf', '#7A9A7A'), seed=9, base=3, clumps=30)
    tower(c, 136, 142, 2, iron)

    # exhibition palace with domes (Palais des Beaux-Arts style), far
    pal = c.rect(190, 104, W - 1, 140)
    c.solid(pal, c.R('palace', '#E6D6B4'), 4, hl=0, sh=1)
    for wx in range(196, W, 14):
        c.fill(c.ell(wx, 112, wx + 8, 120) | c.rect(wx, 116, wx + 8, 132), c.R('glass', '#5E7E9A'), 3)
    for dx, dw in ((236, 30), (330, 36)):
        c.solid(c.ell(dx, 80, dx + dw, 116) & (c.yy < 104), c.R('dome', '#4E8A9A'), 3, hl=1, sh=1)
        c.solid(c.rect(dx + 2, 100, dx + dw - 2, 106), c.R('palace', '#E6D6B4'), 5, hl=1)
        c.fill(c.rect(dx + dw // 2, 72, dx + dw // 2, 82), c.R('gold', '#C9A24A'), 4)
        c.adjust(c.ell(dx, 80, dx + dw, 116) & (c.yy < 104) & ((c.xx % 4) == 0), -1)
    # flags along the roofline
    cols = ['#2E4A9A', '#F2F0EA', '#B8322A', '#2E7A4A', '#E8B83A']
    for k, fx in enumerate(range(196, W, 22)):
        c.fill(c.rect(fx, 92, fx, 104), c.R('pole', '#5A5A60'), 2)
        c.fill(c.rect(fx + 1, 92, fx + 7, 96), c.R(f'flag{k % 5}', cols[k % 5]), 3)
    # crowd suggestion: tiny figures along the far walk
    rng = np.random.default_rng(3)
    for _ in range(60):
        x = int(rng.integers(0, W))
        y = int(rng.integers(140, 150))
        h = 5 + (y - 140) // 3
        col = ['#2A2A34', '#4A3A30', '#6A2A32', '#EDE6D6', '#2E3A5A'][int(rng.integers(0, 5))]
        c.fill(c.rect(x, y - h, x + 1, y), c.R(f'crowd{col}', col), 2)
        c.fill(c.rect(x, y - h - 1, x + 1, y - h), c.R('crowdskin', '#C9A080'), 3)

    # gravel walk, lawn borders, flower beds
    gw = c.rect(0, 140, W - 1, H - 1)
    c.fill(gw, c.R('gravel', '#D8C8A6'), 4)
    c.tex(gw, tex_noise(c, 0.06, 0.05, seed=9))
    lawn = c.poly([(0, 150), (90, 150), (60, H), (0, H)]) | c.poly([(300, 150), (W, 150), (W, H), (330, H)])
    c.fill(lawn, c.R('lawn', '#6E9A4A'), 3)
    c.tex(lawn, tex_noise(c, 0.08, 0.06, seed=10))
    for _ in range(90):
        x, y = int(rng.integers(0, W)), int(rng.integers(152, H))
        if lawn[y, x]:
            c.fill(c.rect(x, y, x + 1, y), c.R('bed', '#C8323A'), int(rng.integers(3, 5)))
    # chestnut trees in bloom at the edges
    for tx, cx0 in ((22, -30), (360, 316)):
        trunk(c, tx, 60, 176, 6, c.R('bark', '#4A3A30'))
        cm = canopy(c, cx0, 10, 100, 80, c.R('chestnut', '#4E7A3A'), seed=tx, base=3)
        for _ in range(30):
            x, y = int(rng.integers(cx0, cx0 + 100)), int(rng.integers(14, 86))
            if 0 <= x < W and cm[y, x]:
                c.fill(c.rect(x, y - 2, x, y), c.R('candle', '#F2EADC'), 5)
        shadow(c, tx - 30, 176, tx + 36, 186, -1)
    # gas candelabra lamp
    c.solid(c.rect(250, 120, 252, 176), c.R('iron', '#2E2E34'), 3, hl=1)
    for lx in (244, 258):
        c.solid(c.ell(lx - 3, 112, lx + 3, 120), c.R('globe', '#F4E6C0'), 5, hl=1)
    c.fill(c.rect(244, 120, 258, 121), c.R('iron', '#2E2E34'), 3)

    for x0, x1 in ((150, 182), (188, 220)):
        shadow(c, x0, 203, x1, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(coat_col='#3A3E4E', hat='straw', hat_col='#D8C08A', grade=g)
    lu = chars.man(skin='morena2', hair='#1C1820', coat_col='#4A3A30', vest_col='#6A5A44', trousers='#3E3A3A', hat='bowler', beard=True, holding='cane', grade=g)
    anchors = {'rizal': place(img, rz, 150, flip=True), 'luna': place(img, lu, 188)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_paris1889.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_paris1889.png')
    print(a)
