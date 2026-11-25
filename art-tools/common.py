"""Shared scene parts: sky, clouds, ridges, foliage, palms, lamps, windows."""
import numpy as np
from artkit import Canvas, BAYER, tex_noise, tex_planks_v, hx, lerp

W, H = 384, 216


def grade_fn(tint, amount, lift=0.0, contrast=1.0):
    t = hx(tint)

    def g(c):
        c = tuple(min(255, max(0, int((v - 128) * contrast + 128 + lift * 255))) for v in c)
        return lerp(c, t, amount) if amount else c
    return g


def sky(c, top, bottom, y1, y0=0, n_from=6, n_to=1):
    """sky: a 7-tone ramp built between two colours, dithered vertically"""
    cols = [lerp(hx(top), hx(bottom), i / 6) for i in range(7)]
    rid = c.R('sky', colors=cols)
    m = c.rect(0, y0, W - 1, y1)
    c.gradient(m, rid, 0, 6.4, y0, y1)
    return rid


def cloud(c, x, y, w, h, rid, seed=0, base=5):
    r = np.random.default_rng(seed)
    m = np.zeros((c.H, c.W), bool)
    for _ in range(max(3, w // 6)):
        bw = r.integers(w // 4, w // 2 + 1)
        bx = x + r.integers(0, max(1, w - bw))
        bh = r.integers(h // 2, h + 1)
        m |= c.ell(bx, y + h - bh, bx + bw, y + h)
    m &= c.rect(0, 0, c.W, y + h - 1)
    c.solid(m, rid, base, light=(-1, -1), hl=1, sh=1, sh2=1)
    return m


def ridge(c, rid, y_base, amp, freq, seed, x0=0, x1=W, tone=3, peaks=(), y_max=None):
    """distant hill/mountain silhouette; peaks = [(x, height, width)] extra bumps"""
    r = np.random.default_rng(seed)
    xs = np.arange(x0, x1)
    ph = r.random(4) * 6.28
    yv = y_base - amp * (0.5 + 0.3 * np.sin(xs * freq + ph[0]) + 0.2 * np.sin(xs * freq * 2.7 + ph[1]) + 0.08 * np.sin(xs * freq * 7 + ph[2]))
    for px, ph_, pw in peaks:
        yv -= ph_ * np.exp(-((xs - px) / pw) ** 2)
    m = np.zeros((c.H, c.W), bool)
    for i, x in enumerate(xs):
        if 0 <= x < c.W:
            m[int(max(0, yv[i])):, x] = True
    m &= c.rect(0, 0, c.W, y_max if y_max is not None else y_base + 200)
    c.solid(m, rid, tone, light=(-1, -1), hl=1, sh=0)
    return m, yv


def canopy(c, x, y, w, h, rid, seed=1, base=3, clumps=None):
    """leafy tree crown made from overlapping shaded clumps (back to front)"""
    r = np.random.default_rng(seed)
    total = np.zeros((c.H, c.W), bool)
    n = clumps or max(5, (w * h) // 90)
    blobs = []
    for _ in range(n):
        bw = r.integers(max(6, w // 4), max(8, w // 2))
        bh = int(bw * r.uniform(0.6, 0.85))
        bx = x + r.integers(0, max(1, w - bw))
        by = y + r.integers(0, max(1, h - bh))
        blobs.append((by, bx, bw, bh))
    blobs.sort()
    for by, bx, bw, bh in blobs:
        m = c.ell(bx, by, bx + bw, by + bh)
        c.solid(m, rid, base, light=(-1, -1), hl=1, sh=1, sh2=1)
        # leaf texture: little lit flecks on upper-left, dark pockets lower-right
        fl = m & (BAYER[c.yy % 4, c.xx % 4] < 0.18) & (c.yy < by + bh * 0.5) & (c.xx < bx + bw * 0.6)
        c.adjust(fl, 1)
        dk = m & (BAYER[(c.yy + 2) % 4, (c.xx + 1) % 4] < 0.15) & (c.yy > by + bh * 0.55)
        c.adjust(dk, -1)
        total |= m
    return total


def trunk(c, x, y0, y1, w, rid):
    m = c.poly([(x, y0), (x + w, y0), (x + w + 2, y1), (x - 2, y1)])
    c.solid(m, rid, 2, hl=1, sh=1)
    c.tex(m, tex_planks_v(c, pw=3, x0=x, grain=0.15) * (c.yy % 5 == 0))
    return m


def palm(c, x, y_base, height, lean, frond, trunk_rid, seed=0):
    """coconut palm: curved ringed trunk + drooping fronds"""
    r = np.random.default_rng(seed)
    pts = []
    for i in range(height):
        t = i / height
        pts.append((x + lean * t * t, y_base - i))
    m = np.zeros((c.H, c.W), bool)
    for i, (px, py) in enumerate(pts):
        wv = 3 if i < height * 0.7 else 2
        m |= c.rect(int(px) - 1, int(py), int(px) + wv - 1, int(py))
    c.solid(m, trunk_rid, 3, hl=1, sh=1)
    c.adjust(m & (c.yy % 3 == 0), -1)
    tx, ty = pts[-1]
    tx, ty = int(tx), int(ty)
    for k in range(9):
        ang = -2.9 + k * 0.72 + r.uniform(-0.15, 0.15)
        L = r.integers(16, 24)
        segs = []
        for s in range(L):
            t = s / L
            dx = np.cos(ang) * s
            dy = np.sin(ang) * s * 0.55 + (t * t) * L * 0.55
            segs.append((tx + dx, ty + dy))
        for s, (sx, sy) in enumerate(segs):
            t = s / L
            wv = 3 if t < 0.7 else 2
            fm = c.rect(int(sx) - 1, int(sy) - 1, int(sx) + 1, int(sy) + wv - 1)
            tone = 4 if (k < 4 and t < 0.6) else 3 if t < 0.8 else 2
            c.fill(fm, frond, tone)
            # leaflets
            if s % 2 == 0 and t > 0.15:
                c.fill(c.rect(int(sx), int(sy) + wv, int(sx), int(sy) + wv + 2), frond, tone - 1)
    c.fill(c.ell(tx - 3, ty - 1, tx + 3, ty + 4), c.R('coconut', '#5E4A2A'), 3)
    return m


def lamp_glow(c, x, y, radius, strength=0.9, mask=None):
    """warm pool of light: dithered +1 tone, fading with distance"""
    d = np.sqrt((c.xx - x) ** 2 + ((c.yy - y) * 1.1) ** 2)
    s = np.clip(1 - d / radius, 0, 1) * strength
    m = mask if mask is not None else np.ones((c.H, c.W), bool)
    c.dither_adjust(m, s)
    c.dither_adjust(m, np.clip(s - 0.55, 0, 1) * 1.6)


def capiz_window(c, x, y, w, h, frame_rid, capiz_rid, open_frac=0.0, interior_rid=None, panes=3):
    """sliding capiz-shell window: dark frame, lattice of translucent squares"""
    fr = c.rect(x, y, x + w, y + h)
    c.solid(fr, frame_rid, 1, hl=1, sh=0)
    inner = c.rect(x + 1, y + 1, x + w - 1, y + h - 1)
    c.fill(inner, capiz_rid, 4)
    lat = inner & (((c.xx - x - 1) % panes == panes - 1) | ((c.yy - y - 1) % panes == panes - 1))
    c.fill(lat, frame_rid, 2)
    sheen = inner & ~lat & ((c.xx + c.yy) % 7 == 0)
    c.adjust(sheen, 1)
    if open_frac > 0 and interior_rid:
        ow = int((w - 1) * open_frac)
        op = c.rect(x + 1, y + 1, x + ow, y + h - 1)
        c.fill(op, interior_rid, 1)
        c.fill(c.rect(x + ow + 1, y + 1, x + ow + 1, y + h - 1), frame_rid, 0)


def shadow(c, x0, y0, x1, y1, d=-1):
    c.adjust(c.ell(x0, y0, x1, y1), d)


def ground_shadow_of(c, mask, dx, dy, ground_mask, d=-1):
    sh = c.shift(mask, dy, dx) & ground_mask & ~mask
    c.adjust(sh, d)
