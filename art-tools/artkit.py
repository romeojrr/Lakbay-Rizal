"""Lakbay Rizal pixel-art kit v2.

Every pixel stores (ramp id, tone index). Ramps are short hue-shifted colour
ramps (dark -> light), so lighting and texture are applied as tone offsets and
the final image keeps a disciplined, limited palette instead of blended colours.
"""
import colorsys
import numpy as np
from PIL import Image, ImageDraw

N = 7  # tones per ramp
BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0


def hx(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def ramp(base, n=N, spread=0.62, hue_shift=22, sat_boost=0.10):
    """Hue-shifted ramp around a base colour: shadows drift toward blue/violet,
    highlights toward warm yellow; saturation peaks in the mid tones."""
    r, g, b = [c / 255 for c in hx(base)]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    out = []
    mid = (n - 1) / 2
    for i in range(n):
        t = (i - mid) / mid  # -1 .. 1
        hd = h * 360
        target = 250 if t < 0 else 55
        d = ((target - hd + 540) % 360) - 180
        hh = (hd + max(-hue_shift, min(hue_shift, d)) * min(1, abs(t))) % 360 / 360
        ll = min(0.97, max(0.04, l + t * spread * (0.5 if t > 0 else 0.62) * (1 if l < 0.8 else 0.5)))
        ss = min(1, max(0, s * (1 + sat_boost * (1 - abs(t)) - 0.25 * abs(t) * (t > 0) - 0.12 * abs(t) * (t < 0))))
        rr, gg, bb = colorsys.hls_to_rgb(hh, ll, ss)
        out.append((int(rr * 255), int(gg * 255), int(bb * 255)))
    return out


def lerp(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))


class Canvas:
    def __init__(self, W, H, grade=None):
        self.W, self.H = W, H
        self.rid = np.zeros((H, W), np.int32)
        self.tone = np.zeros((H, W), np.int32)
        self.ramps = [[(0, 0, 0)] * N]
        self.names = {}
        self.grade = grade
        self.yy, self.xx = np.mgrid[0:H, 0:W]

    # ---- palette -------------------------------------------------------
    def R(self, name, base=None, colors=None, **kw):
        if name in self.names:
            return self.names[name]
        cols = colors if colors is not None else ramp(base, **kw)
        cols = list(cols) + [cols[-1]] * (N - len(cols))
        self.ramps.append(cols[:N])
        self.names[name] = len(self.ramps) - 1
        return self.names[name]

    # ---- masks ---------------------------------------------------------
    def _m(self):
        return Image.new('L', (self.W, self.H), 0)

    def rect(self, x0, y0, x1, y1):
        m = np.zeros((self.H, self.W), bool)
        m[max(0, y0):max(0, y1 + 1), max(0, x0):max(0, x1 + 1)] = True
        return m

    def poly(self, pts):
        im = self._m(); ImageDraw.Draw(im).polygon([tuple(p) for p in pts], fill=1)
        return np.array(im) > 0

    def ell(self, x0, y0, x1, y1):
        im = self._m(); ImageDraw.Draw(im).ellipse([x0, y0, x1, y1], fill=1)
        return np.array(im) > 0

    def line(self, pts, w=1):
        im = self._m(); ImageDraw.Draw(im).line([tuple(p) for p in pts], fill=1, width=w)
        return np.array(im) > 0

    # ---- painting ------------------------------------------------------
    def fill(self, mask, rid, tone):
        if np.isscalar(tone):
            self.tone[mask] = tone
        else:
            self.tone[mask] = np.asarray(tone)[mask]
        self.rid[mask] = rid

    def shift(self, m, dy, dx, fill=False):
        out = np.full_like(m, fill)
        H, W = m.shape
        y0, y1 = max(dy, 0), H + min(dy, 0)
        x0, x1 = max(dx, 0), W + min(dx, 0)
        out[y0:y1, x0:x1] = m[y0 - dy:y1 - dy, x0 - dx:x1 - dx]
        return out

    def edge(self, m, dx, dy, k=1):
        """pixels of m whose neighbour k steps toward (dx,dy) is outside m"""
        return m & ~self.shift(m, -dy * k, -dx * k)

    def solid(self, mask, rid, base, light=(-1, -1), hl=1, sh=1, sh2=0, rim=0):
        """Fill a form and shade it: edges facing the light get brighter,
        edges facing away get darker (one or two pixels deep)."""
        t = np.full((self.H, self.W), base)
        lx, ly = light
        t[self.edge(mask, lx, 0) | self.edge(mask, 0, ly)] += hl
        dark = self.edge(mask, -lx, 0) | self.edge(mask, 0, -ly)
        t[dark] -= sh
        if sh2:
            t[(self.edge(mask, -lx, 0, 2) | self.edge(mask, 0, -ly, 2)) & ~dark] -= sh2
        if rim:
            t[self.edge(mask, -lx, 0) & self.edge(mask, 0, -ly)] += rim
        self.fill(mask, rid, t)

    def tex(self, mask, offs):
        """add a tone-offset texture inside mask"""
        self.tone[mask] += offs[mask]

    def adjust(self, mask, d):
        self.tone[mask] += d

    def dither_adjust(self, mask, strength):
        """strength: float array/scalar 0..1 -> +1 tone where bayer < strength (negative darkens)"""
        s = np.broadcast_to(strength, (self.H, self.W))
        b = BAYER[self.yy % 4, self.xx % 4]
        up = mask & (s > 0) & (b < s)
        dn = mask & (s < 0) & (b < -s)
        self.tone[up] += 1
        self.tone[dn] -= 1

    def gradient(self, mask, rid, t_top, t_bot, y0, y1):
        """vertical dithered gradient across tones"""
        v = t_top + (t_bot - t_top) * np.clip((self.yy - y0) / max(1, y1 - y0), 0, 1)
        fl = np.floor(v)
        fr = v - fl
        # solid bands; dither only in the last 35% of each band (pixel-art style)
        edge = np.clip((fr - 0.65) / 0.35, 0, 1)
        t = (fl + (BAYER[self.yy % 4, self.xx % 4] < edge)).astype(int)
        self.fill(mask, rid, t)

    # ---- render --------------------------------------------------------
    def palette(self):
        P = np.array(self.ramps, dtype=np.float64)
        if self.grade:
            P = np.array([[self.grade(tuple(c)) for c in r] for r in self.ramps], dtype=np.float64)
        return P.astype(np.uint8)

    def render(self, alpha=False):
        P = self.palette()
        t = np.clip(self.tone, 0, N - 1)
        rgb = P[self.rid, t]
        if alpha:
            a = (self.rid > 0).astype(np.uint8) * 255
            return Image.fromarray(np.dstack([rgb, a]), 'RGBA')
        return Image.fromarray(rgb, 'RGB')


# ---------------- textures (tone offsets) ----------------------------------
def tex_bricks(c, bw=8, bh=4, x0=0, y0=0, var=0.25, seed=1):
    r = np.random.default_rng(seed)
    yy, xx = c.yy - y0, c.xx - x0
    row = yy // bh
    off = (row % 2) * (bw // 2)
    col = (xx + off) // bw
    o = np.zeros_like(yy)
    o[(yy % bh) == bh - 1] = -1
    o[((xx + off) % bw) == bw - 1] = -1
    rnd = r.random((c.H // bh + 3, c.W // bw + 3))
    v = rnd[np.clip(row, 0, rnd.shape[0] - 1), np.clip(col, 0, rnd.shape[1] - 1)]
    o[(o == 0) & (v < var)] = -1
    o[(o == 0) & (v > 1 - var * 0.6)] = 1
    o[((yy % bh) == 0) & (o == 0) & (v > 0.5)] = 1
    return o


def tex_blocks(c, bw=12, bh=6, x0=0, y0=0, seed=2):
    """dressed stone (sillar) blocks with chiselled top-left highlight"""
    r = np.random.default_rng(seed)
    yy, xx = c.yy - y0, c.xx - x0
    row = yy // bh
    off = (row % 2) * (bw // 2)
    o = np.zeros_like(yy)
    o[(yy % bh) == bh - 1] = -1
    o[((xx + off) % bw) == bw - 1] = -1
    o[((yy % bh) == 0) & (o == 0)] = 1
    o[(((xx + off) % bw) == 0) & (o == 0)] = 1
    spk = r.random((c.H, c.W))
    o[(o == 0) & (spk < 0.05)] = -1
    return o


def tex_planks_v(c, pw=4, x0=0, seed=3, grain=0.06):
    r = np.random.default_rng(seed)
    xx = c.xx - x0
    o = np.zeros_like(xx)
    o[(xx % pw) == pw - 1] = -1
    o[(xx % pw) == 0] = 1
    g = r.random((c.H, c.W))
    o[(o == 0) & (g < grain)] = -1
    return o


def tex_planks_h(c, ph=4, y0=0, seed=4, seam=40, grain=0.08):
    r = np.random.default_rng(seed)
    yy = c.yy - y0
    o = np.zeros_like(yy)
    o[(yy % ph) == ph - 1] = -1
    o[(yy % ph) == 0] = 1
    row = yy // ph
    o[((c.xx + row * 17) % seam) == 0] = -1
    g = r.random((c.H, c.W))
    streak = (g < grain) & (r.random((c.H, c.W)) < 0.6)
    o[(o == 0) & streak] = -1
    return o


def tex_noise(c, p_dark=0.08, p_light=0.04, seed=5):
    r = np.random.default_rng(seed).random((c.H, c.W))
    o = np.zeros((c.H, c.W), int)
    o[r < p_dark] = -1
    o[r > 1 - p_light] = 1
    return o


def tex_tiles(c, tw=4, th=3, x0=0, y0=0):
    """clay roof tiles (teja): vertical channels with scalloped row edges"""
    yy, xx = c.yy - y0, c.xx - x0
    o = np.zeros_like(yy)
    o[(xx % tw) == tw - 1] = -1
    o[(xx % tw) == 0] = 1
    o[(yy % th) == th - 1] = -1
    o[((yy % th) == th - 1) & ((xx % tw) == 1)] = -2
    return o


def tex_thatch(c, x0=0, y0=0, seed=6):
    """nipa thatch: layered rows of drooping fronds"""
    r = np.random.default_rng(seed)
    yy, xx = c.yy - y0, c.xx - x0
    o = np.zeros_like(yy)
    o[(yy % 4) == 3] = -1
    v = r.random((c.H, c.W))
    o[((xx + yy // 4 * 2) % 3 == 0) & (v < 0.6)] = -1
    o[((yy % 4) == 0) & (v > 0.4)] = 1
    return o


def tex_cobbles(c, x0=0, y0=0, seed=7):
    r = np.random.default_rng(seed)
    yy, xx = c.yy - y0, c.xx - x0
    row = yy // 3
    off = (row % 2) * 2
    o = np.zeros_like(yy)
    o[(yy % 3) == 2] = -1
    o[((xx + off) % 5) == 4] = -1
    o[((yy % 3) == 0) & (((xx + off) % 5) == 1)] = 1
    v = r.random((c.H, c.W))
    o[(o == 0) & (v < 0.06)] = -1
    return o


# ---------------- tiny pixel font (3x5) ------------------------------------
FONT = {
    'A': ['010', '101', '111', '101', '101'], 'B': ['110', '101', '110', '101', '110'],
    'C': ['011', '100', '100', '100', '011'], 'D': ['110', '101', '101', '101', '110'],
    'E': ['111', '100', '110', '100', '111'], 'F': ['111', '100', '110', '100', '100'],
    'G': ['011', '100', '101', '101', '011'], 'H': ['101', '101', '111', '101', '101'],
    'I': ['111', '010', '010', '010', '111'], 'J': ['001', '001', '001', '101', '010'],
    'K': ['101', '101', '110', '101', '101'], 'L': ['100', '100', '100', '100', '111'],
    'M': ['101', '111', '111', '101', '101'], 'N': ['110', '101', '101', '101', '101'],
    'O': ['010', '101', '101', '101', '010'], 'P': ['110', '101', '110', '100', '100'],
    'Q': ['010', '101', '101', '110', '011'], 'R': ['110', '101', '110', '101', '101'],
    'S': ['011', '100', '010', '001', '110'], 'T': ['111', '010', '010', '010', '010'],
    'U': ['101', '101', '101', '101', '111'], 'V': ['101', '101', '101', '101', '010'],
    'W': ['101', '101', '111', '111', '101'], 'X': ['101', '101', '010', '101', '101'],
    'Y': ['101', '101', '010', '010', '010'], 'Z': ['111', '001', '010', '100', '111'],
    ' ': ['000', '000', '000', '000', '000'], '.': ['000', '000', '000', '000', '010'],
    '-': ['000', '000', '111', '000', '000'],
}


def text_mask(c, s, x, y):
    m = np.zeros((c.H, c.W), bool)
    cx = x
    for ch in s.upper():
        g = FONT.get(ch, FONT[' '])
        for r_, row in enumerate(g):
            for k, bit in enumerate(row):
                if bit == '1' and 0 <= y + r_ < c.H and 0 <= cx + k < c.W:
                    m[y + r_, cx + k] = True
        cx += 4
    return m


def text_width(s):
    return len(s) * 4 - 1


# ---------------- sprite helpers --------------------------------------------
def selout(img_rgba, darken=0.45, floor=(20, 16, 28)):
    """selective outline: outline colour is a darkened version of the adjacent
    sprite colour (not flat black), so the silhouette reads but stays soft."""
    a = np.array(img_rgba).astype(np.int32)
    al = a[:, :, 3] > 0
    H, W = al.shape
    out = a.copy()
    for y in range(H):
        for x in range(W):
            if al[y, x]:
                continue
            nb = []
            for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and al[yy, xx]:
                    nb.append(a[yy, xx, :3])
            if nb:
                c = np.mean(nb, axis=0) * darken
                c = np.maximum(c, floor) if c.sum() < sum(floor) else c
                out[y, x, :3] = (c * 0.6 + np.array(floor) * 0.4).astype(int)
                out[y, x, 3] = 255
    return Image.fromarray(out.astype(np.uint8), 'RGBA')


def paste(scene_img, sprite, x, y):
    scene_img.alpha_composite(sprite, (int(x), int(y)))


def shadow_ellipse(img, cx, cy, w, h, color=(0, 0, 0), alpha=70):
    """soft-edged pixel shadow made of two stacked ellipses (no blur)"""
    ov = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    d.ellipse([cx - w, cy - h, cx + w, cy + h], fill=color + (alpha // 2,))
    d.ellipse([cx - w + 2, cy - h + 1, cx + w - 2, cy + h - 1], fill=color + (alpha,))
    img.alpha_composite(ov)
