"""Close-up portraits for Lakbay Rizal dialogue (SRS v2.3 §3.6, §7.10).

Each character gets one sprite sheet: 64 x 64 frames, 4 columns x 6 rows.
  columns: 0 idle, 1 blink, 2 talk (mouth half open), 3 talk (mouth open)
  rows:    0 neutral, 1 happy, 2 sad, 3 serious, 4 surprised, 5 thinking
Sheet size 256 x 384. Faces look toward viewer-left, like the scene sprites.
Light comes from the upper left. Colours reuse the skin ramps in chars.py.

Run:  python portraits.py  ->  out/portraits/<id>.png and out/portraits_contact.png
"""
import os
import numpy as np
from PIL import Image
import colorsys

S = 64
OUT = os.path.join(os.path.dirname(__file__), 'out', 'portraits')

SKIN_RAMPS = {
    'morena': ['#3A2428', '#5C3A34', '#82543F', '#A06C4E', '#BB8660', '#D3A27A', '#E6BF98'],
    'morena2': ['#36222A', '#563632', '#7A4E3C', '#97664A', '#B27E5A', '#CA9A72', '#DEB690'],
    'brown': ['#2C1C20', '#462C2A', '#664034', '#835740', '#9E6F50', '#B88A66', '#CFA684'],
    'fair': ['#4A2E34', '#764C48', '#A07062', '#C08E78', '#D9AB92', '#EBC6AC', '#F7DEC8'],
    'pale': ['#4E3438', '#7E5654', '#A87C70', '#C79C88', '#DFB8A2', '#EFD0BC', '#FAE6D6'],
}
INK = (31, 26, 36)
MOODS = ['neutral', 'happy', 'sad', 'serious', 'surprised', 'thinking']


def hx(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def ramp_from(base, spread=0.11):
    """7-tone ramp from a base colour (base = tone 3), with hue shift: warm lights, cool shadows."""
    r, g, b = [v / 255 for v in hx(base)]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    out = []
    for i in range(7):
        d = (i - 3)
        L = min(max(l + d * spread * (0.9 if d > 0 else 1.0), 0.04), 0.97)
        H = (h + d * 0.008) % 1.0
        Sx = min(max(s * (1 - abs(d) * 0.06), 0), 1)
        rr, gg, bb = colorsys.hls_to_rgb(H, L, Sx)
        out.append((int(rr * 255), int(gg * 255), int(bb * 255)))
    return out


class Pic:
    def __init__(self):
        self.col = np.zeros((S, S, 3), np.uint8)
        self.a = np.zeros((S, S), bool)
        self.layer = np.full((S, S), -1, int)
        self.n = 0
        yy, xx = np.mgrid[0:S, 0:S]
        self.xx, self.yy = xx, yy
        self.dith = ((xx + yy) % 2 == 0)

    # shapes
    def ell(self, cx, cy, rx, ry):
        return ((self.xx - cx) / rx) ** 2 + ((self.yy - cy) / ry) ** 2 <= 1.0

    def rect(self, x0, y0, x1, y1):
        return (self.xx >= x0) & (self.xx <= x1) & (self.yy >= y0) & (self.yy <= y1)

    def poly(self, pts):
        from matplotlib.path import Path
        p = Path(pts)
        inside = p.contains_points(np.c_[self.xx.ravel() + 0.5, self.yy.ravel() + 0.5]).reshape(S, S)
        return inside

    @staticmethod
    def shift(m, dx, dy):
        o = np.zeros_like(m)
        h, w = m.shape
        xs0, xs1 = max(0, -dx), min(w, w - dx)
        ys0, ys1 = max(0, -dy), min(h, h - dy)
        o[ys0 + dy:ys1 + dy, xs0 + dx:xs1 + dx] = m[ys0:ys1, xs0:xs1]
        return o

    def shade(self, m, ramp, base=3, hl=2, sh=2, flat=False, grad=0.0):
        """Paint mask m with ramp; light from upper-left."""
        t = np.full((S, S), float(base))
        if not flat:
            sparse = (self.xx % 2 == 0) & (self.yy % 2 == 0)
            for k in range(1, hl + 1):
                e = m & ~self.shift(m, k, k)
                t[e & ((k == 1) | sparse)] += 1
            for k in range(1, sh + 2):
                e = m & ~self.shift(m, -k, -k) & (self.yy < S - 3)
                t[e & ((k <= sh - 1) | sparse)] -= 1
            if grad:
                ys = np.where(m.any(1))[0]
                if len(ys):
                    y0, y1 = ys.min(), ys.max() + 1
                    g = (self.yy - y0) / max(1, (y1 - y0))
                    t -= grad * g
        ti = np.clip(np.round(t), 0, 6).astype(int)
        R = np.array(ramp)
        self.col[m] = R[ti[m]]
        self.a |= m
        self.n += 1
        self.layer[m] = self.n

    def put(self, m, color):
        self.col[m] = color
        self.a |= m
        self.n += 1
        self.layer[m] = self.n

    def px(self, pts, color):
        for (x, y) in pts:
            if 0 <= x < S and 0 <= y < S:
                self.col[y, x] = color
                self.a[y, x] = True

    def outline(self, dark=INK):
        a = self.a
        edge = np.zeros_like(a)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            edge |= ~a & self.shift(a, dx, dy)
        # selective outline: softer on lit (upper-left) side
        out = self.col.copy()
        lit = edge & (self.shift(a, 1, 0) | self.shift(a, 0, 1)) & ~(self.shift(a, -1, 0) | self.shift(a, 0, -1))
        out[edge] = dark
        softer = (np.array(dark) * 0.6 + np.array([90, 70, 70]) * 0.4).astype(np.uint8)
        out[lit] = softer
        self.col = out
        self.a = a | edge

    def image(self):
        rgba = np.zeros((S, S, 4), np.uint8)
        rgba[..., :3] = self.col
        rgba[..., 3] = np.where(self.a, 255, 0)
        return Image.fromarray(rgba, 'RGBA')


# ─────────────────────────────── character specs ───────────────────────────────
DEF = dict(skin='morena', hair='#1E1A22', hair_style='side', facial=None, glasses=False, age=0,
           outfit='suit', coat='#2E3346', vest='#3B3E50', shirt='#ECE6D8', tie='bow', tie_col='#1C1820',
           child=0, female=False, long_neck=False, sharp_nose=False, extra=None)

SPECS = {
    'rizal': dict(facial='mustache_thin'),
    'rizal-dapitan': dict(facial='mustache_thin', outfit='white_jacket', coat='#E9E2D2', tie='string', age=1),
    'rizal-young': dict(coat='#2A2E3C', vest='#3A3E4E'),
    'jose-boy': dict(child=1, outfit='white_jacket', coat='#EDE7DA', tie='long', tie_col='#2A2430'),
    'jose-child': dict(child=2, outfit='camisa', shirt='#F0EADC', hair_style='child'),
    'teodora': dict(skin='morena2', female=True, hair='#1C1820', hair_style='bun', outfit='filipina', shirt='#F2EEE4', extra='#EDE3CF'),
    'teodora-older': dict(skin='morena2', female=True, hair='#6E676C', hair_style='bun', outfit='filipina', shirt='#EEE8DA', extra='#E6DCC6', age=2),
    'paciano': dict(hair_style='cropped', facial='mustache', coat='#2C2A30', vest='#3A3640', age=1, tie='string'),
    'viola': dict(skin='morena2', facial='mustache', coat='#4A3E36', vest='#5C4E40', hair_style='side'),
    'jesuit': dict(skin='fair', hair='#3A3036', hair_style='cropped', outfit='cassock', coat='#1E1C24', age=1),
    'pupil': dict(skin='brown', child=1, hair_style='child', outfit='camisa', shirt='#E6DCC4'),
    'justiniano': dict(skin='brown', hair='#5A5458', hair_style='cropped', outfit='camisa', shirt='#D9CCA8', long_neck=True, sharp_nose=True, age=2),
    'dominican': dict(skin='fair', hair='#4A3C38', hair_style='tonsure', outfit='dominican', age=1),
    'gentleman': dict(skin='fair', hair='#4A3A30', facial='mustache', coat='#5A4A3A', vest='#7A6650', tie='bow', tie_col='#3A2A24'),
    'de-wecker': dict(skin='fair', hair='#A8A29C', hair_style='cropped', facial='beard_full', glasses=True, coat='#1E1E26', vest='#2A2A34', age=2, tie='string'),
    'ullmer': dict(skin='fair', hair='#7A6A58', hair_style='cropped', facial='beard_full', outfit='pastor', coat='#1C1C22', age=1),
    'blumentritt': dict(skin='pale', hair='#6A4E36', hair_style='side', facial='beard_full', glasses=True, coat='#3A3430', vest='#5A4E44', tie='string'),
    'seiko': dict(skin='pale', female=True, hair='#18141C', hair_style='japanese', outfit='kimono', coat='#4A5A8A', shirt='#E8E2D6'),
    'luna': dict(skin='morena2', hair='#1C1820', hair_style='side', facial='beard_goatee', coat='#4A3A30', vest='#6A5A44'),
    'nellie': dict(skin='fair', female=True, hair='#5A3A26', hair_style='updo', outfit='euro_dress', coat='#5A6A8A', shirt='#EDE6DA'),
    'printer': dict(skin='pale', hair='#7A5A3A', hair_style='cropped', facial='mustache', outfit='apron', shirt='#E4DCCB', coat='#B8AC90'),
    'member': dict(skin='morena', hair='#241C1A', hair_style='side', outfit='camisa', shirt='#DCD2BC'),
    'taviel': dict(skin='fair', hair='#2A2224', hair_style='side', facial='mustache', outfit='uniform', coat='#5C6E86'),
    'luis-taviel': dict(skin='fair', hair='#3A2E28', hair_style='cropped', facial='mustache_thin', outfit='uniform', coat='#34405A', age=1),
}


def spec(cid):
    d = dict(DEF)
    d.update(SPECS[cid])
    return d


# ─────────────────────────────── drawing ───────────────────────────────
def draw(cid, mood='neutral', frame=0):
    sp = spec(cid)
    P = Pic()
    skin = [hx(c) for c in SKIN_RAMPS[sp['skin']]]
    hair = ramp_from(sp['hair'], 0.075)
    child = sp['child']
    fem = sp['female']

    cx, cy = 31, 26
    rx, ry = 14, 16
    if fem: rx = 13
    if child == 1: rx, ry = 14, 15
    if child == 2: rx, ry, cy = 15, 15, 28
    if sp['long_neck']: cy -= 3
    neck_top = cy + ry - 5
    neck_len = 9 if sp['long_neck'] else 6
    ytop = neck_top + neck_len

    body(P, sp, ytop)
    neck = P.poly([(cx - 6, neck_top), (cx + 5, neck_top), (cx + 5, ytop + 3), (cx - 6, ytop + 3)])
    P.shade(neck, skin, base=3, hl=1, sh=1)
    P.put(neck & (P.xx >= cx + 2), skin[2])
    P.put(neck & (P.yy <= neck_top + 2) & (P.xx >= cx - 3), skin[1])   # shadow under the jaw
    collar(P, sp, cx, ytop)

    back_hair(P, sp, hair, cx, cy, rx, ry)

    head = P.ell(cx, cy, rx, ry) & (P.yy <= cy + 4)
    jaw = P.poly([(cx - rx + 1, cy + 1), (cx + rx, cy), (cx + rx - 3, cy + 9), (cx + 4, cy + ry - 1),
                  (cx - 3, cy + ry + 1), (cx - 8, cy + ry - 3), (cx - rx + 2, cy + 8)])
    if child:
        jaw = P.ell(cx, cy + 3, rx - 1, ry - 2)
    if fem:
        jaw = P.poly([(cx - rx + 1, cy + 1), (cx + rx, cy), (cx + rx - 3, cy + 9), (cx + 3, cy + ry),
                      (cx - 3, cy + ry + 1), (cx - 8, cy + ry - 4), (cx - rx + 2, cy + 7)])
    face = head | jaw
    ear = P.ell(cx + rx - 1, cy + 3, 3, 4.5)
    P.shade(ear, skin, base=3, hl=1, sh=1)
    P.shade(face, skin, base=4, hl=2, sh=2)
    # 3/4 view: far side of the face turns away from the light
    P.put(face & (P.xx >= cx + 8) & ~((P.xx == cx + 8) & (P.yy % 2 == 0)), skin[3])
    P.put(face & (P.xx >= cx + 11), skin[2])
    P.put(P.ell(cx + rx - 1, cy + 3, 1.2, 2.5), skin[1])
    # cheek and forehead light
    P.put(P.ell(cx - 7, cy + 5, 3, 2) & face, skin[5])
    P.put(P.ell(cx - 4, cy - 6, 4, 2) & face, skin[5])
    if sp['age'] >= 1:
        P.px([(cx - 10, cy + 8), (cx - 9, cy + 9)], skin[3])
    if sp['age'] >= 2:
        P.px([(cx - 11, cy + 7), (cx + 2, cy + 11), (cx - 4, cy - 8), (cx - 1, cy - 8), (cx + 2, cy - 8), (cx - 3, cy - 6), (cx, cy - 6)], skin[2])

    fh = sp['facial']
    if fh == 'beard_full':
        bd = P.poly([(cx - rx + 2, cy + 3), (cx + rx, cy + 1), (cx + rx - 1, cy + 10), (cx + 6, cy + ry + 3),
                     (cx - 2, cy + ry + 6), (cx - 9, cy + ry + 1), (cx - rx + 2, cy + 9)])
        bd &= ~P.ell(cx - 5, cy + 6, 6, 4)
        bd &= ~(P.xx < cx - 9) | (P.yy > cy + 8)
        P.shade(bd, hair, base=3, hl=1, sh=2)
        P.px([(x, y) for x in range(cx - 8, cx + 10, 3) for y in range(cy + 12, cy + ry + 4, 3)], hair[1])
    elif fh == 'beard_goatee':
        bd = P.poly([(cx - 8, cy + 12), (cx + 3, cy + 12), (cx + 1, cy + ry + 5), (cx - 4, cy + ry + 6), (cx - 7, cy + ry + 2)])
        P.shade(bd, hair, base=2, hl=1, sh=1)

    front_hair(P, sp, hair, cx, cy, rx, ry)
    features(P, sp, skin, hair, cx, cy, mood, frame)
    if sp['glasses']:
        g = (58, 52, 56)
        ey = cy + 2
        ring = lambda x0, w: [(x0 + i, ey - 1) for i in range(w)] + [(x0 + i, ey + 3) for i in range(w)] + \
                             [(x0 - 1, ey), (x0 - 1, ey + 1), (x0 - 1, ey + 2), (x0 + w, ey), (x0 + w, ey + 1), (x0 + w, ey + 2)]
        P.px(ring(cx - 10, 6) + ring(cx, 5) + [(cx - 3, ey), (cx - 2, ey), (cx - 1, ey), (cx + 6, ey), (cx + 7, ey), (cx + 8, ey + 1), (cx + 9, ey + 1), (cx + 10, ey + 2)], g)
        P.px([(cx - 9, ey), (cx + 1, ey)], (240, 238, 232))
    P.outline()
    return P.image()


def body(P, sp, ytop):
    o = sp['outfit']
    if o in ('suit', 'white_jacket', 'cassock', 'pastor', 'uniform', 'apron', 'dominican'):
        main = ramp_from(sp['coat'], 0.06 if o != 'white_jacket' else 0.045)
    elif o in ('kimono', 'euro_dress'):
        main = ramp_from(sp['coat'], 0.06)
    else:
        main = ramp_from(sp['shirt'], 0.05)
    sh = P.poly([(3, 64), (6, ytop + 7), (15, ytop + 1), (24, ytop - 1), (38, ytop - 1), (47, ytop + 1), (56, ytop + 7), (60, 64)])
    P.shade(sh, main, base=3, hl=2, sh=2, grad=0.6)
    if o == 'suit' or o == 'white_jacket':
        shirt = ramp_from(sp['shirt'], 0.045)
        vest = ramp_from(sp['vest'], 0.06)
        # shirt front + vest V + lapels
        P.shade(P.poly([(25, ytop), (37, ytop), (35, 64), (27, 64)]), shirt, base=5, hl=1, sh=1)
        if o == 'suit':
            P.shade(P.poly([(24, ytop + 4), (30, ytop + 14), (35, ytop + 4), (38, 64), (22, 64)]) & ~P.poly([(27, ytop + 3), (35, ytop + 3), (31, ytop + 13)]), vest, base=3, hl=1, sh=1)
            P.px([(31, ytop + 16), (31, ytop + 20)], vest[6])
        lap_l = P.poly([(18, ytop + 1), (26, ytop - 1), (30, ytop + 16), (25, 64), (19, 64)])
        lap_r = P.poly([(44, ytop + 1), (36, ytop - 1), (33, ytop + 16), (37, 64), (43, 64)])
        P.shade(lap_l, main, base=4, hl=1, sh=1)
        P.shade(lap_r, main, base=2, hl=1, sh=1)
        P.px([(x, ytop + 5 + (x - 21)) for x in range(21, 27)], main[1])
    elif o == 'cassock':
        P.px([(31, y) for y in range(ytop + 6, 64, 4)], main[5])
    elif o == 'pastor':
        bands = P.rect(28, ytop + 2, 30, ytop + 9) | P.rect(32, ytop + 2, 34, ytop + 9)
        P.shade(bands, ramp_from('#F2F0EA', 0.04), base=5, hl=0, sh=1, flat=True)
    elif o == 'dominican':
        P.shade(P.poly([(20, ytop), (42, ytop), (40, 64), (22, 64)]), ramp_from('#ECE6D8', 0.045), base=4, hl=1, sh=1)
        cape = P.poly([(6, 64), (9, ytop + 6), (19, ytop + 1), (24, 64)]) | P.poly([(57, 64), (53, ytop + 6), (43, ytop + 1), (38, 64)])
        P.shade(cape, ramp_from('#1E1C22', 0.06), base=3, hl=1, sh=1)
    elif o == 'filipina':
        pan = P.poly([(5, 64), (8, ytop + 7), (18, ytop + 2), (31, ytop + 13), (44, ytop + 2), (54, ytop + 7), (58, 64), (31, 58)])
        P.shade(pan, ramp_from(sp['extra'], 0.045), base=4, hl=1, sh=2)
        # embroidery
        P.px([(x, ytop + 9 + abs(x - 31) // 3) for x in range(16, 47, 3)], ramp_from(sp['extra'], 0.045)[1])
    elif o == 'kimono':
        inner = ramp_from(sp['shirt'], 0.045)
        P.shade(P.poly([(26, ytop - 1), (36, ytop - 1), (31, ytop + 14)]), inner, base=5, hl=0, sh=1)
        P.px([(26 + i, ytop + i * 2 // 2) for i in range(0, 6)], inner[6])
        P.px([(36 - i, ytop + i) for i in range(0, 6)], ramp_from(sp['coat'], 0.06)[1])
        obi = P.rect(10, 58, 53, 63)
        P.shade(obi, ramp_from('#C9A24A', 0.06), base=3, hl=1, sh=1)
        P.px([(x, y) for x in range(12, 52, 6) for y in (ytop + 10, ytop + 16) if (x + y) % 4 == 0], (236, 232, 240))
    elif o == 'euro_dress':
        P.shade(P.rect(27, ytop - 4, 35, ytop + 2), ramp_from(sp['shirt'], 0.04), base=5, hl=1, sh=1)
        P.px([(31, y) for y in range(ytop + 4, 64, 4)], ramp_from(sp['coat'], 0.06)[5])
        P.px([(x, ytop + 3) for x in range(26, 37)], ramp_from(sp['shirt'], 0.04)[3])
    elif o == 'apron':
        P.shade(P.poly([(10, 64), (12, ytop + 5), (20, ytop + 2), (42, ytop + 2), (50, ytop + 5), (52, 64)]), ramp_from(sp['shirt'], 0.045), base=4, hl=1, sh=1, grad=0.5)
        P.shade(P.poly([(20, ytop + 10), (42, ytop + 10), (43, 64), (19, 64)]), main, base=3, hl=1, sh=1)
        P.px([(21, y) for y in range(ytop + 2, ytop + 10)] + [(41, y) for y in range(ytop + 2, ytop + 10)], main[1])
    elif o == 'camisa':
        P.px([(31, y) for y in range(ytop + 2, ytop + 12)], main[2])
        P.px([(32, y) for y in range(ytop + 4, ytop + 12, 3)], main[6])
    elif o == 'uniform':
        P.px([(31, y) for y in range(ytop + 3, 64, 4)], (214, 182, 92))
        P.px([(x, y) for x in range(10, 54) for y in range(ytop + 2, 64) if x % 3 == 0 and (x + y) % 2 == 0 and P.a[y, x]],
             ramp_from(sp['coat'], 0.06)[5])
        P.shade(P.rect(14, ytop + 1, 20, ytop + 3), ramp_from('#C9A24A', 0.06), base=3, hl=1, sh=0)
        P.shade(P.rect(42, ytop + 1, 48, ytop + 3), ramp_from('#C9A24A', 0.06), base=2, hl=1, sh=0)


def collar(P, sp, cx, y):
    o = sp['outfit']
    if o in ('suit', 'white_jacket'):
        wc = ramp_from('#F4F0E6', 0.04)
        P.shade(P.poly([(cx - 6, y - 2), (cx, y + 3), (cx + 6, y - 2), (cx + 5, y - 4), (cx, y - 1), (cx - 5, y - 4)]), wc, base=5, hl=0, sh=1)
        t = sp['tie']
        tc = ramp_from(sp['tie_col'], 0.05)
        if t == 'bow':
            P.shade(P.poly([(cx - 5, y), (cx, y + 2), (cx - 5, y + 4)]) | P.poly([(cx + 5, y), (cx, y + 2), (cx + 5, y + 4)]) | P.rect(cx - 1, y + 1, cx + 1, y + 3), tc, base=3, hl=1, sh=1)
        elif t == 'string':
            P.shade(P.rect(cx - 1, y + 1, cx + 1, y + 2), tc, base=3, hl=1, sh=0)
            P.px([(cx - 1, y + 3), (cx - 1, y + 4), (cx + 1, y + 3), (cx + 2, y + 5)], tc[2])
        elif t == 'long':
            P.shade(P.poly([(cx - 2, y + 1), (cx + 2, y + 1), (cx + 2, y + 10), (cx, y + 13), (cx - 2, y + 10)]), tc, base=3, hl=1, sh=1)
    elif o == 'cassock' or o == 'uniform':
        c = ramp_from('#F2F0EA', 0.04) if o == 'cassock' else ramp_from(sp['coat'], 0.06)
        P.shade(P.rect(cx - 5, y - 3, cx + 5, y - 1), c, base=5 if o == 'cassock' else 2, hl=0, sh=1)
    elif o == 'pastor':
        P.shade(P.rect(cx - 5, y - 3, cx + 5, y - 1), ramp_from('#F2F0EA', 0.04), base=5, hl=0, sh=1)
    elif o == 'dominican':
        P.shade(P.poly([(cx - 9, y - 2), (cx + 9, y - 2), (cx + 6, y + 5), (cx - 6, y + 5)]), ramp_from('#ECE6D8', 0.045), base=4, hl=1, sh=1)
    elif o == 'euro_dress':
        P.shade(P.rect(cx - 5, y - 5, cx + 5, y - 1), ramp_from(sp['shirt'], 0.04), base=5, hl=1, sh=1)
        P.px([(cx - 2, y - 1), (cx + 2, y - 1), (cx, y)], (196, 168, 96))
    elif o == 'kimono':
        P.shade(P.poly([(cx - 6, y - 3), (cx, y + 4), (cx + 6, y - 3), (cx + 7, y - 1), (cx, y + 7), (cx - 7, y - 1)]), ramp_from(sp['shirt'], 0.045), base=5, hl=0, sh=1)


def back_hair(P, sp, hair, cx, cy, rx, ry):
    st = sp['hair_style']
    if st == 'bun':
        P.shade(P.ell(cx + 12, cy - 1, 6, 6), hair, base=3, hl=2, sh=2)
        P.shade(P.ell(cx + 3, cy + 1, rx + 1, ry - 1) & (P.yy <= cy + 8), hair, base=2, hl=1, sh=1)
    elif st == 'japanese':
        P.shade(P.ell(cx + 1, cy - 12, 13, 7), hair, base=3, hl=2, sh=1)
        P.shade(P.ell(cx + 14, cy - 2, 5, 7) | P.ell(cx - 12, cy - 2, 4, 7), hair, base=2, hl=2, sh=1)
        P.shade(P.ell(cx + 4, cy + 2, rx, ry - 2) & (P.yy <= cy + 9), hair, base=2, hl=1, sh=1)
    elif st == 'updo':
        P.shade(P.ell(cx + 5, cy - 13, 9, 6), hair, base=3, hl=2, sh=2)
        P.shade(P.ell(cx + 3, cy + 1, rx + 1, ry - 1) & (P.yy <= cy + 8), hair, base=2, hl=1, sh=1)


def front_hair(P, sp, hair, cx, cy, rx, ry):
    st = sp['hair_style']
    if st == 'side':
        # thick hair, side part on the viewer's left, volume rising over the brow, short at the temple
        m = P.ell(cx + 1, cy - 8, rx + 2, 11) & (P.yy <= cy - 5)
        m |= P.poly([(cx - rx - 1, cy - 9), (cx - 4, cy - 16), (cx + 6, cy - 17), (cx + rx + 2, cy - 10),
                     (cx + rx + 1, cy + 2), (cx + rx - 3, cy), (cx + rx - 4, cy - 5), (cx - 2, cy - 7), (cx - rx + 1, cy - 4)])
        m |= P.poly([(cx - rx, cy - 6), (cx - rx + 3, cy - 6), (cx - rx + 2, cy + 1), (cx - rx, cy)])
        P.shade(m, hair, base=2, hl=2, sh=1)
        for k, (x0, y0) in enumerate([(cx - 9, cy - 13), (cx - 3, cy - 16), (cx + 3, cy - 16)]):
            P.px([(x0 + i, y0 + (1 if i in (0, 4) else 0)) for i in range(5)], hair[5 - (k % 2)])
        P.px([(cx - 8 + i, cy - 9 + (i // 3)) for i in range(0, 9)], hair[3])
        P.px([(cx - 11, cy - 11), (cx - 10, cy - 12), (cx - 9, cy - 12)], hair[0])
    elif st in ('cropped', 'tonsure'):
        m = P.ell(cx + 1, cy - 5, rx + 1, ry - 4) & (P.yy <= cy - 5)
        m |= P.poly([(cx + rx - 4, cy - 8), (cx + rx + 1, cy - 5), (cx + rx + 1, cy + 2), (cx + rx - 3, cy)])
        m |= P.poly([(cx - rx, cy - 6), (cx - rx + 3, cy - 6), (cx - rx + 2, cy), (cx - rx, cy - 1)])
        P.shade(m, hair, base=2, hl=2, sh=1)
        P.px([(x, cy - 12 + (x % 3 == 0)) for x in range(cx - 7, cx + 8, 2)], hair[4])
        if st == 'tonsure':
            sk = [hx(c) for c in SKIN_RAMPS[sp['skin']]]
            P.shade(P.ell(cx + 1, cy - 14, 8, 3.5), sk, base=4, hl=1, sh=1)
    elif st == 'child':
        m = P.ell(cx + 1, cy - 5, rx + 2, ry - 3) & (P.yy <= cy - 3)
        m |= P.poly([(cx - rx - 1, cy - 5), (cx - 2, cy - 7), (cx - rx + 2, cy + 1)])
        m |= P.poly([(cx + rx - 4, cy - 6), (cx + rx + 2, cy - 4), (cx + rx + 1, cy + 3), (cx + rx - 3, cy + 1)])
        P.shade(m, hair, base=2, hl=2, sh=1)
        P.px([(cx - 9 + i, cy - 5 + (i % 2)) for i in range(0, 14, 2)], hair[1])
        P.px([(cx - 3 + i, cy - 15) for i in range(0, 8, 2)], hair[5])
    elif st == 'bun':
        m = P.ell(cx + 1, cy - 4, rx + 1, ry - 3) & (P.yy <= cy - 7)
        m |= P.poly([(cx + rx - 4, cy - 9), (cx + rx + 2, cy - 5), (cx + rx + 1, cy + 6), (cx + rx - 3, cy + 3)])
        m |= P.poly([(cx - rx, cy - 8), (cx - rx + 3, cy - 9), (cx - rx + 1, cy), (cx - rx, cy - 2)])
        P.shade(m, hair, base=2, hl=2, sh=1)
        P.px([(cx - 3 + (i // 4), cy - 19 + i) for i in range(0, 11)], hair[0])      # centre part
        P.px([(cx - 9 + i, cy - 12 + i // 4) for i in range(0, 6)] + [(cx + 1 + i, cy - 13 + i // 3) for i in range(0, 8)], hair[4])
    elif st in ('japanese', 'updo'):
        m = P.ell(cx + 1, cy - 6, rx + 2, ry - 5) & (P.yy <= cy - 4)
        m |= P.poly([(cx - rx - 1, cy - 4), (cx - 2, cy - 11), (cx - rx + 2, cy + 3)])
        m |= P.poly([(cx + rx - 3, cy - 8), (cx + rx + 2, cy - 4), (cx + rx + 1, cy + 7), (cx + rx - 3, cy + 4)])
        P.shade(m, hair, base=2, hl=2, sh=1)
        P.px([(cx - 4 + i, cy - 12 + i // 3) for i in range(0, 12, 2)], hair[5])
        P.px([(cx - 1, cy - 12), (cx, cy - 11), (cx + 1, cy - 10)], hair[0])
        if st == 'japanese':
            P.px([(cx + 8, cy - 18), (cx + 9, cy - 19), (cx + 10, cy - 20), (cx + 11, cy - 21)], (214, 182, 92))
            P.px([(cx - 9, cy - 15), (cx - 10, cy - 16), (cx - 9, cy - 16)], (196, 70, 70))


def features(P, sp, skin, hair, cx, cy, mood, frame):
    child = sp['child']
    fem = sp['female']
    ey = cy + 2
    exn, exf = cx - 9, cx + 1
    wn, wf = 4, 4
    white = (238, 232, 224)
    light_eyes = sp['skin'] in ('pale', 'fair') and sp['hair'] in ('#6A4E36', '#5A3A26', '#7A5A3A', '#4A3A30')
    iris = (68, 86, 112) if light_eyes else (44, 30, 30)
    brow = hair[1]
    if sp['hair'] in ('#6E676C', '#A8A29C', '#5A5458', '#7A6A58'):
        brow = hair[2]

    lift = {'neutral': 0, 'happy': -1, 'sad': 0, 'serious': 1, 'surprised': -2, 'thinking': 0}[mood]
    by = ey - 3 + lift
    if mood == 'sad':
        near = [(exn - 1, by + 1), (exn, by + 1), (exn + 1, by), (exn + 2, by), (exn + 3, by - 1)]
        far = [(exf - 1, by - 1), (exf, by), (exf + 1, by), (exf + 2, by + 1), (exf + 3, by + 1)]
    elif mood == 'serious':
        near = [(exn - 1, by - 1), (exn, by - 1), (exn + 1, by), (exn + 2, by), (exn + 3, by + 1)]
        far = [(exf - 1, by + 1), (exf, by), (exf + 1, by), (exf + 2, by - 1), (exf + 3, by - 1)]
    elif mood == 'thinking':
        near = [(exn - 1, by + 1), (exn, by), (exn + 1, by), (exn + 2, by), (exn + 3, by)]
        far = [(exf - 1, by - 1), (exf, by - 2), (exf + 1, by - 2), (exf + 2, by - 2), (exf + 3, by - 1)]
    else:
        near = [(exn - 1, by + 1), (exn, by), (exn + 1, by), (exn + 2, by), (exn + 3, by)]
        far = [(exf - 1, by), (exf, by), (exf + 1, by), (exf + 2, by), (exf + 3, by + 1)]
    P.px(near, brow)
    P.px(far, brow)
    if not fem and not child:
        P.px([(x, y - 1) for (x, y) in near[1:4]], hair[2])

    blink = frame == 1
    big = mood == 'surprised'
    for ex, w in ((exn, wn), (exf, wf)):
        P.px([(ex - 1 + i, ey - 1) for i in range(w + 1)], skin[1])
        if blink:
            P.px([(ex - 1 + i, ey + 1) for i in range(w + 1)], skin[0])
            P.px([(ex + i, ey) for i in range(w)], skin[3])
            continue
        h = 3 if (big or child) else 2
        P.px([(ex + i, ey + j) for i in range(w) for j in range(h)], white)
        ix = ex + (1 if mood == 'thinking' else 0) + (0 if ex == exn else 0)
        iy = ey + (-0 if mood != 'thinking' else 0)
        P.px([(ix + i, iy + j) for i in range(2) for j in range(min(h, 3))], iris)
        P.px([(ix, iy)], (252, 250, 246))
        P.px([(ex + i, ey + h) for i in range(w)], skin[3] if mood != 'happy' else skin[2])
        if fem:
            P.px([(ex - 2, ey - 1), (ex - 1, ey - 2)], (34, 24, 30))
    # nose, pointing left (3/4 view)
    nx = cx - 4
    ln = 6 if sp['sharp_nose'] else 5
    P.px([(nx + 1, ey + 1 + i) for i in range(ln - 1)], skin[5])
    P.px([(nx + 2, ey + 2 + i) for i in range(ln - 1)], skin[3])
    tip = [(nx - 1, ey + ln), (nx, ey + ln), (nx + 1, ey + ln)]
    if sp['sharp_nose']:
        tip += [(nx - 2, ey + ln)]
    P.px(tip, skin[2])
    P.px([(nx + 2, ey + ln + 1), (nx + 3, ey + ln + 1), (nx + 3, ey + ln)], skin[1])
    P.px([(nx, ey + ln - 1)], skin[6])

    my = ey + ln + 3
    fh = sp['facial']
    if fh in ('mustache_thin', 'mustache', 'beard_full', 'beard_goatee'):
        if fh == 'mustache_thin':
            P.px([(cx - 9 + i, my - 1 - (1 if i in (0, 9) else 0) + (1 if i in (0, 9) else 0)) for i in range(10)], hair[1])
            P.px([(cx - 10, my), (cx + 1, my)], hair[1])
        else:
            P.px([(cx - 10 + i, my - 1) for i in range(12)] + [(cx - 9 + i, my - 2) for i in range(10)], hair[1])
            P.px([(cx - 11, my), (cx + 2, my)], hair[1])
            P.px([(cx - 8 + i, my - 2) for i in range(0, 8, 2)], hair[3])
        my += 1

    mx, mw = cx - 9, 8
    lip = (156, 78, 72) if fem else skin[1]
    lipl = (186, 104, 96) if fem else skin[3]
    dark = (60, 26, 32)
    teeth = (238, 232, 224)
    if frame in (0, 1):
        if mood == 'happy':
            P.px([(mx - 1, my - 1)] + [(mx + i, my) for i in range(mw)] + [(mx + mw, my - 1)], lip)
            P.px([(mx + 1 + i, my + 1) for i in range(mw - 2)], lipl)
        elif mood == 'sad':
            P.px([(mx, my + 1)] + [(mx + 1 + i, my) for i in range(mw - 2)] + [(mx + mw - 1, my + 1)], lip)
        elif mood == 'surprised':
            P.px([(mx + 3 + i, my + j) for i in range(2) for j in range(2)], dark)
            P.px([(mx + 2, my), (mx + 2, my + 1), (mx + 5, my), (mx + 5, my + 1), (mx + 3, my - 1), (mx + 4, my - 1), (mx + 3, my + 2), (mx + 4, my + 2)], lip)
        elif mood == 'serious':
            P.px([(mx + i, my) for i in range(mw)], skin[0] if not fem else lip)
        elif mood == 'thinking':
            P.px([(mx + 1 + i, my) for i in range(mw - 3)] + [(mx + mw - 2, my - 1), (mx + mw - 1, my - 1)], lip)
        else:
            P.px([(mx + 1 + i, my) for i in range(mw - 1)], lip)
        if fem and mood not in ('surprised',):
            P.px([(mx + 2 + i, my + 1) for i in range(mw - 4)], lipl)
    else:
        h = 1 if frame == 2 else 2
        wide = mood in ('happy', 'surprised')
        x0 = mx + (1 if wide else 2)
        w = mw - 2 if wide else mw - 4
        P.px([(x0 + i, my + j) for i in range(w) for j in range(h)], dark)
        h -= 1
        if mood == 'happy' or frame == 3:
            P.px([(x0 + 1 + i, my) for i in range(w - 2)], teeth)
        P.px([(x0 - 1, my), (x0 + w, my)], lip)
        P.px([(x0 + i, my + h + 1) for i in range(w)], lip if not fem else lipl)
        if mood == 'sad':
            P.px([(x0 - 1, my + 1), (x0 + w, my + 1)], lip)
    P.px([(cx - 6, my + 4), (cx - 5, my + 4), (cx - 4, my + 4)], skin[5])


def sheet(cid):
    sh = Image.new('RGBA', (S * 4, S * 6), (0, 0, 0, 0))
    for r, mood in enumerate(MOODS):
        for c in range(4):
            sh.paste(draw(cid, mood, c), (c * S, r * S))
    return sh


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    ids = list(SPECS)
    for cid in ids:
        sheet(cid).save(os.path.join(OUT, f'{cid}.png'))
    # contact sheet: idle neutral + happy talk, 2x scale
    cols = 8
    rows = (len(ids) + cols - 1) // cols
    cs = Image.new('RGBA', (cols * (S + 8) + 8, rows * (S + 8) + 8), (232, 224, 206, 255))
    for i, cid in enumerate(ids):
        cs.alpha_composite(draw(cid, 'neutral', 0), (8 + (i % cols) * (S + 8), 8 + (i // cols) * (S + 8)))
    cs = cs.resize((cs.width * 3, cs.height * 3), Image.NEAREST)
    cs.save(os.path.join(os.path.dirname(OUT), 'portraits_contact.png'))
    print('ok', len(ids))
