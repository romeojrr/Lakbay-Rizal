"""Mount Makiling, Laguna, late 1887 — the summit Rizal climbed with his bodyguard, Lieutenant
José Taviel de Andrade. A mossy, forested ridge top in the cool morning, a sea of clouds below,
and through a gap in the clouds Laguna de Bay with the hills of its far shore.
No people, and no flag: the sources do not settle which flag they planted, so none is drawn."""
import numpy as np
from PIL import Image
from artkit import Canvas, BAYER, tex_noise, hx
from common import W, H, grade_fn, sky, cloud, ridge, canopy, trunk
from places_cast import stage, rizal_hike, taviel


def build():
    g = grade_fn('#E8F0E0', 0.06, contrast=1.03)
    c = Canvas(W, H, grade=g)
    sky(c, '#5E96CC', '#EAF2EE', 130)
    cl = c.R('cloud', colors=[hx(h) for h in ['#9AAEBE', '#B6C6D2', '#CFDBE2', '#E3EBEE', '#F1F5F5', '#FAFCFA', '#FFFFFF']])
    cloud(c, 40, 18, 70, 14, cl, seed=3)
    cloud(c, 236, 8, 90, 18, cl, seed=7)

    # far shore of Laguna de Bay: low blue hills, then the lake, far below
    far = c.R('farhills', '#7E9CB4')
    ridge(c, far, 112, 18, 0.03, seed=5, tone=4, peaks=((300, 14, 30),), y_max=126)
    lake = c.R('lake', '#8EB8CE')
    lm = c.rect(0, 120, W - 1, 134)
    c.gradient(lm, lake, 5, 3.5, 120, 134)
    for k in range(0, W, 9):
        c.adjust(c.rect(k, 124 + (k * 7) % 9, k + 4, 124 + (k * 7) % 9), 1)
    near_shore = c.R('shore', '#6E8E6A')
    c.fill(c.rect(0, 134, W - 1, H - 1), near_shore, 2)  # the valley floor far below
    ridge(c, near_shore, 140, 8, 0.05, seed=9, tone=3, y_max=150)

    # the sea of clouds below the summit, open in the middle over the lake
    sea = c.R('seacloud', colors=[hx(h) for h in ['#A8B8C4', '#C2CED6', '#D8E0E6', '#E8EEF0', '#F3F6F6', '#FBFCFB', '#FFFFFF']])
    for x, y, w, h, seed in ((-20, 118, 150, 30, 21), (250, 114, 160, 34, 22), (90, 132, 90, 18, 23),
                             (210, 136, 110, 16, 24), (-10, 140, 120, 20, 25), (300, 140, 100, 20, 26)):
        cloud(c, x, y, w, h, sea, seed=seed, base=5)

    # the summit ridge: dark mossy forest, highest on the right
    moss = c.R('moss', '#3E6A3E')
    top, yv = ridge(c, moss, 186, 42, 0.012, seed=4, tone=2, peaks=((320, 26, 60), (60, 10, 40)))
    c.tex(top, tex_noise(c, 0.04, 0.03, seed=4))
    # trees along the crest, lit from the upper left: trunks first, crowns over them
    leaf = c.R('leaf', '#4E7E46')
    leaf2 = c.R('leaf2', '#5E8E4A')
    bark = c.R('bark', '#5A4A3A')
    crowns = ((-10, 70, 40, 31), (48, 54, 34, 32), (240, 60, 44, 33), (290, 70, 52, 34), (346, 50, 46, 35))
    for x, w, h, seed in crowns:
        cx_ = min(W - 3, max(2, x + w // 2))
        ground = int(yv[min(len(yv) - 1, cx_)])
        trunk(c, cx_ - 2, ground - 22, ground + 2, 4, bark)
    for x, w, h, seed in crowns:
        cx_ = min(W - 3, max(2, x + w // 2))
        y = int(yv[min(len(yv) - 1, cx_)]) - h - 10
        canopy(c, x, y, w, h, leaf if seed % 2 else leaf2, seed=seed, base=3)
    # tree ferns on the open summit, silhouetted
    fern = c.R('fern', '#2E5434')
    for fx, fh in ((150, 26), (206, 20)):
        fy = int(yv[fx])
        c.fill(c.rect(fx, fy - fh, fx + 1, fy), bark, 2)
        for k in range(7):
            ang = -2.8 + k * 0.42
            pts = [(fx + np.cos(ang) * s * 1.4, fy - fh + np.sin(ang) * s * 0.6 + (s / 9) ** 2 * 5) for s in range(12)]
            c.fill(c.line([(int(px), int(py)) for px, py in pts], w=2), fern, 3 if k > 2 else 2)
    # a worn path over the open summit, mossy rocks beside it
    clear = c.R('clearing', '#8A7E5E')
    path = c.poly([(150, H - 1), (236, H - 1), (214, 196), (196, 188), (178, 188), (166, 196)]) & top
    c.fill(path, clear, 3)
    c.tex(path, tex_noise(c, 0.10, 0.06, seed=8))
    rock = c.R('rock', '#7A7A72')
    for rx, ry, rw, rh in ((104, 198, 22, 12), (250, 194, 28, 14), (40, 204, 18, 10), (326, 202, 24, 12)):
        rm = c.ell(rx, ry, rx + rw, ry + rh)
        c.solid(rm, rock, 3, hl=1, sh=1)
        c.fill(rm & (c.yy < ry + 3), moss, 4)
    c.dither_adjust(c.rect(0, 200, W - 1, H - 1) & ~path, -0.2)
    # morning mist drifting over the crest
    c.dither_adjust(c.rect(0, 140, W - 1, 170) & top, 0.35)
    return stage(c, [(rizal_hike(g), 150, 206, False), (taviel(g), 196, 206, False)]), {}


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_makiling1887.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_makiling1887.png')
    print('ok')
