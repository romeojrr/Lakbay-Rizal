"""Shared parts for the v2.4 story pictures ("places"): steamers, night skies, moon, stars,
a simple room shell, stepped and pointed gables. Same Canvas/ramp style as kit2.py.

These pictures have no people in them: they show where the narration has moved to."""
import numpy as np
from PIL import Image
from artkit import BAYER, tex_noise, tex_planks_h, tex_planks_v
from common import W, H


def stars(c, mask, rid, seed=1, density=0.004, tone=6):
    rng = np.random.default_rng(seed)
    pts = np.argwhere(mask & (rng.random(mask.shape) < density))
    for y, x in pts:
        c.fill(c.rect(x, y, x, y), rid, tone - int(rng.integers(0, 3)))


def moon(c, x, y, r, rid, glow=True):
    m = c.ell(x - r, y - r, x + r, y + r)
    c.solid(m, rid, 5, hl=1, sh=1)
    c.adjust(m & c.ell(x - r // 3, y - r // 4, x + r // 6, y + r // 5), -1)  # a soft "mare"
    if glow:
        d = np.sqrt((c.xx - x) ** 2 + (c.yy - y) ** 2)
        c.dither_adjust(~m & (d < r * 3.2), np.clip(1 - (d - r) / (r * 2.2), 0, 1) * 0.55)
    return m


def steamer(c, x, wl, length, hull, upper, funnel, mast, *, funnel_top=None, funnels=1, masts=2,
            boot=None, awning=None, flags=None, lights=None, portholes=True, sails=False):
    """A side view of an 1870s–1890s steamer, bow to the right, waterline at y = wl.
    Iron hull with a sheer, white deckhouses, raked funnel(s) and pole masts with stays."""
    h = max(5, length // 9)
    bow, stern = x + length, x
    hull_m = c.poly([(stern + 2, wl), (bow - 4, wl), (bow, wl - h - 2), (stern, wl - h)])
    c.solid(hull_m, hull, 2, hl=1, sh=1)
    if boot is not None:
        c.fill(hull_m & (c.yy >= wl - 1), boot, 3)
    c.fill(c.rect(stern, wl - h - 1, bow - 1, wl - h) & hull_m, hull, 4)  # rail line
    if portholes:
        for px in range(stern + 6, bow - 8, 6):
            c.fill(c.rect(px, wl - h // 2 - 1, px, wl - h // 2 - 1), upper, 5)
    # deckhouses
    d0, d1 = stern + length // 5, stern + length * 2 // 3
    house = c.rect(d0, wl - h - 6, d1, wl - h - 1)
    c.solid(house, upper, 5, hl=1, sh=1)
    for wx in range(d0 + 3, d1 - 2, 4):
        c.fill(c.rect(wx, wl - h - 4, wx + 1, wl - h - 3), hull, 2)
    c.solid(c.rect(d1 - 10, wl - h - 10, d1 - 2, wl - h - 7), upper, 5, hl=1, sh=1)  # bridge
    if awning is not None:
        c.fill(c.rect(d0 - 2, wl - h - 8, d1 - 12, wl - h - 7), awning, 4)
        c.fill(c.rect(d0 - 2, wl - h - 8, d1 - 12, wl - h - 8) & (c.xx % 4 < 2), awning, 2)
    # funnels, raked aft
    top = funnel_top if funnel_top is not None else funnel
    fx0 = stern + length * 2 // 5
    for k in range(funnels):
        fx = fx0 + k * 11
        f = c.poly([(fx, wl - h - 6), (fx + 6, wl - h - 6), (fx + 3, wl - h - 24), (fx - 3, wl - h - 24)])
        c.solid(f, funnel, 3, hl=1, sh=1)
        c.fill(f & (c.yy <= wl - h - 21), top, 1)
    # pole masts with stays
    mx = [stern + length // 7, stern + length * 5 // 6][:masts] if masts > 1 else [stern + length // 2]
    tops = []
    for k, mx_ in enumerate(mx):
        mt = wl - h - (34 if k == 0 else 32)
        c.fill(c.rect(mx_, mt, mx_, wl - h - 1), mast, 2)
        c.fill(c.rect(mx_ - 4, mt + 6, mx_ + 4, mt + 6), mast, 2)  # yard
        c.fill(c.line([(mx_, mt), (mx_ - 9, wl - h - 1)]) | c.line([(mx_, mt), (mx_ + 9, wl - h - 1)]), mast, 1)
        tops.append((mx_, mt))
        if sails:
            sm = c.poly([(mx_ + 1, mt + 7), (mx_ + 10, wl - h - 6), (mx_ + 1, wl - h - 6)])
            c.solid(sm, upper, 4, hl=1, sh=1)
    if len(tops) == 2:
        (ax, ay), (bx, by) = tops
        c.fill(c.line([(ax, ay), (bx, by)]), mast, 1)
        c.fill(c.line([(stern, wl - h - 2), (ax, ay)]) | c.line([(bx, by), (bow, wl - h - 2)]), mast, 1)
    if flags is not None and len(tops) == 2:
        # "dressed overall": a line of signal flags from bow to stern over the mastheads
        (ax, ay), (bx, by) = tops
        pts = [(stern, wl - h - 2), (ax, ay), (bx, by), (bow, wl - h - 2)]
        k = 0
        for (x0_, y0_), (x1_, y1_) in zip(pts, pts[1:]):
            n = max(2, int(abs(x1_ - x0_) / 4))
            for i in range(n):
                t = i / n
                fx_, fy_ = int(x0_ + (x1_ - x0_) * t), int(y0_ + (y1_ - y0_) * t)
                c.fill(c.rect(fx_, fy_ + 1, fx_ + 1, fy_ + 2), flags[k % len(flags)], 4)
                k += 1
    if lights is not None:
        for lx, ly in ((d0 + 4, wl - h - 4), (d1 - 6, wl - h - 4), (mx[0], wl - h - 30)):
            c.fill(c.rect(lx, ly, lx, ly), lights, 6)
    return hull_m | house


def room(c, wall, floor, y_floor, wall_tex='plaster', floor_tex='planks', seed=1):
    """An interior: a back wall down to y_floor, a floor below, a skirting board."""
    wm = c.rect(0, 0, W - 1, y_floor - 1)
    c.fill(wm, wall, 4)
    if wall_tex == 'plaster':
        c.tex(wm, tex_noise(c, 0.05, 0.03, seed=seed))
    elif wall_tex == 'boards':
        c.tex(wm, tex_planks_v(c, pw=6, grain=0.05))
    fm = c.rect(0, y_floor, W - 1, H - 1)
    c.fill(fm, floor, 3)
    if floor_tex == 'planks':
        c.tex(fm, tex_planks_h(c, ph=6, y0=y_floor, seam=80, grain=0.07))
    c.dither_adjust(c.rect(0, y_floor, W - 1, y_floor + 6), -0.6)
    return wm, fm


def stepped_gable(c, x0, x1, base, top, rid, steps=5, tone=4):
    """A Flemish stepped gable: a house front whose top climbs in steps to a point."""
    w = x1 - x0
    m = c.rect(x0, top + (steps * 4), x1, base)
    for k in range(steps):
        inset = int(w * k / (2 * steps + 1))
        m |= c.rect(x0 + inset, top + (steps - k - 1) * 4 + 0, x1 - inset, top + steps * 4)
    m |= c.rect(x0 + w // 2 - 3, top - 4, x0 + w // 2 + 3, top + steps * 4)
    c.solid(m, rid, tone, hl=1, sh=1)
    return m


def windows_grid(c, x0, x1, y0, y1, cols, rows, frame, glass, w=6, h=9):
    for i in range(cols):
        for j in range(rows):
            wx = int(x0 + (i + 0.5) * (x1 - x0) / cols - w / 2)
            wy = int(y0 + (j + 0.5) * (y1 - y0) / rows - h / 2)
            c.fill(c.rect(wx - 1, wy - 1, wx + w, wy + h), frame, 4)
            c.gradient(c.rect(wx, wy, wx + w - 1, wy + h - 1), glass, 4, 1.5, wy, wy + h)


def contact(paths, out, cols=2, scale=2):
    """A sheet of renders at `scale`, to look at several new pictures at once."""
    ims = [Image.open(p) for p in paths]
    w, h = ims[0].size
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * w * scale + (cols - 1) * 6, rows * h * scale + (rows - 1) * 6), (40, 40, 40))
    for i, im in enumerate(ims):
        sheet.paste(im.resize((w * scale, h * scale), Image.NEAREST), ((i % cols) * (w * scale + 6), (i // cols) * (h * scale + 6)))
    sheet.save(out)


def deck(c, rail_y=150, deck_y=172):
    """The foreground of a picture seen from on board: a teak deck whose planks run along the
    ship (parallel to the rail), the bulwark rail on its stanchions, the rail's shadow."""
    teak = c.R('teak', '#B89068')
    dm = c.rect(0, deck_y, W - 1, H - 1)
    c.fill(dm, teak, 4)
    y, gap, k = deck_y + 2.0, 2.0, 0
    while y < H:
        c.fill(c.rect(0, int(y), W - 1, int(y)), teak, 3)
        for bx in range((k * 53) % 97, W, 97):
            c.fill(c.rect(bx, int(y - gap) + 1, bx, int(y) - 1), teak, 3)
        y += gap
        gap *= 1.28
        k += 1
    wood = c.R('rail', '#6A4A2E')
    c.solid(c.rect(0, rail_y, W - 1, rail_y + 4), wood, 4, hl=1, sh=1)
    for px in range(0, W, 24):
        c.solid(c.rect(px, rail_y + 4, px + 2, deck_y), wood, 3, hl=1, sh=1)
    c.fill(c.rect(0, (rail_y + deck_y) // 2, W - 1, (rail_y + deck_y) // 2), wood, 2)
    c.dither_adjust(c.rect(0, deck_y, W - 1, deck_y + 8), -0.5)
