"""v2.4 story pictures in the Philippines (no people; see places_kit.py).

  pasig_1868        Calamba 1861, ch.4: up the Pasig River to Manila in a casco (June 1868)
  binan_1869        Biñan 1869, ch.1: the town by moonlight, his first night (1869)
  laguna_1870       Biñan 1869, ch.4: the steamer Talim nears Calamba's shore (17 Dec 1870)
  manilabay_1882    Santo Tomas 1877 ch.4 and Barcelona 1882 ch.1: sailing before dawn (3 May 1882)
  railway_1892      Manila 1892, ch.2: the new railway north through Pampanga, Mount Arayat (1892)
  dapitan_steamer_1892  Dapitan 1892, ch.2: the mail steamer arrives dressed in flags (Sept 1892)
  dapitan_map       Dapitan 1892, ch.4: the relief map of Mindanao in the town plaza
  chapel_1896       Fort Santiago 1896, ch.4: the prison chapel, his last night (29 Dec 1896)

Run: python places_philippines.py  → out/scene_<name>.png, out/prev_<name>.png, out/sheet_ph_*.png
"""
import numpy as np
from PIL import Image
from artkit import Canvas, BAYER, hx, tex_noise, tex_blocks, tex_planks_h, tex_planks_v, tex_thatch, tex_tiles
from common import W, H, grade_fn, sky, cloud, ridge, canopy, trunk, palm, capiz_window, lamp_glow, shadow
from kit2 import water, reflect, table, chair
from places_kit import stars, moon, steamer, room, contact, deck
from places_cast import *
from scene_manila import facade_bahay

CLOUD = ['#8FA8C0', '#AFC3D4', '#CCDAE4', '#E2EAEF', '#F1F4F5', '#FAFBFA', '#FFFFFF']


def nipa_hut(c, x, ground, w, h, wall, thatch, post, seed=1):
    """A nipa house on bamboo stilts: woven walls, a steep thatched roof."""
    floor = ground - h // 3
    for px in (x + 2, x + w // 2, x + w - 3):
        c.fill(c.rect(px, floor, px + 1, ground), post, 2)
    body = c.rect(x, floor - h // 2, x + w, floor)
    c.solid(body, wall, 4, hl=1, sh=1)
    c.fill(body & ((c.xx + c.yy) % 4 == 0), wall, 3)
    c.fill(c.rect(x + w // 3, floor - h // 2 + 3, x + w // 3 + 5, floor - 3), post, 1)  # window
    roof = c.poly([(x - 5, floor - h // 2 + 1), (x + w + 5, floor - h // 2 + 1), (x + w // 2, floor - h - 4)])
    c.fill(roof, thatch, 3)
    c.tex(roof, tex_thatch(c, x0=x, y0=floor - h, seed=seed))
    c.fill(c.rect(x - 5, floor - h // 2, x + w + 5, floor - h // 2 + 1) & roof, thatch, 1)
    return body | roof


def bamboo_clump(c, x, ground, h, rid, seed=1, culm=None):
    """A clump of bamboo: culms arching outward from one base, leaf sprays along the tops."""
    rng = np.random.default_rng(seed)
    stalks = np.zeros((c.H, c.W), bool)
    leaves = np.zeros((c.H, c.W), bool)
    for k in range(9):
        side = -1 if k % 2 else 1
        bend = rng.uniform(0.15, 0.55) * side
        hh = int(h * rng.uniform(0.75, 1.05))
        for t in range(hh):
            px = x + bend * (t * t) / hh + side * (k // 2)
            py = ground - t
            stalks |= c.rect(int(px), py, int(px), py)
            if t > hh * 0.45 and t % 3 == 0:
                leaves |= c.ell(int(px) - 4, py - 1, int(px) + 4, py + 2)
    c.fill(stalks, culm if culm is not None else rid, 4)
    c.solid(leaves, rid, 3, hl=1, sh=1)
    c.adjust(leaves & (BAYER[c.yy % 4, c.xx % 4] < 0.22), 1)
    return stalks | leaves


# ---------------------------------------------------------------- Pasig River, June 1868
def pasig_1868():
    g = grade_fn('#FFF0D0', 0.05, contrast=1.03)
    c = Canvas(W, H, grade=g)
    sky(c, '#4E8CCC', '#DDECEE', 118)
    cl = c.R('cloud', colors=[hx(h) for h in CLOUD])
    cloud(c, 30, 20, 90, 20, cl, seed=3)
    cloud(c, 240, 34, 70, 14, cl, seed=8)
    # the hills of Antipolo, east of the river
    ridge(c, c.R('hills', '#7A9CAA'), 104, 22, 0.02, seed=2, tone=4, peaks=((290, 14, 50),), y_max=124)
    ridge(c, c.R('hills2', '#5E8A6A'), 114, 10, 0.04, seed=5, tone=3, y_max=126)
    # far bank: bamboo, palms, nipa houses on stilts at the water's edge
    bank = c.R('bank', '#6E9A48')
    c.fill(c.rect(0, 112, W - 1, 126), bank, 3)
    trees = c.R('trees', '#4A7A3A')
    canopy(c, 150, 92, 70, 28, trees, seed=4, base=3)
    canopy(c, 300, 96, 84, 24, trees, seed=6, base=3)
    bam, culm = c.R('bamboo', '#6E9A44'), c.R('culm', '#B8B060')
    bamboo_clump(c, 40, 124, 46, bam, seed=2, culm=culm)
    bamboo_clump(c, 236, 124, 42, bam, seed=5, culm=culm)
    frond, ptrunk = c.R('frond', '#3E6E36'), c.R('ptrunk', '#8A7A5A')
    palm(c, 112, 124, 52, 6, frond, ptrunk, seed=1)
    palm(c, 344, 124, 48, -8, frond, ptrunk, seed=7)
    wall, thatch, post = c.R('sawali', '#C8B08A'), c.R('nipa', '#9A7A4A'), c.R('post', '#5A4A32')
    huts = nipa_hut(c, 62, 128, 30, 30, wall, thatch, post, seed=3) | nipa_hut(c, 268, 128, 34, 32, wall, thatch, post, seed=4)
    # the river, brown-green in the rainy season
    river = c.R('river', '#5E7E6A')
    wm = water(c, 126, H - 1, river, seed=7, base=3, top_tone=4)
    reflect(c, huts, 126, wm & (c.yy < 150), d=-1)
    # aboard the casco: its deck in front, the arched roof of matting behind; José and his
    # father stand at the bow as the boat goes up the river
    hull = c.R('hull', '#4E3A2A')
    mat = c.R('mat', '#B89A62')
    roof = c.ell(-30, 146, 206, 250) & c.rect(0, 0, W - 1, 195)
    c.solid(roof, mat, 4, hl=1, sh=1)
    c.fill(roof & ((c.xx + 30) % 5 == 0), mat, 3)
    c.fill(roof & ((c.yy + c.xx // 3) % 4 == 0), mat, 5)
    c.fill(c.line([(0, 160), (200, 166)]), c.R('pole', '#C8B070'), 4)  # push-poles on the roof
    hm = c.poly([(0, 194), (310, 194), (384, 184), (384, 216), (0, 216)])
    c.solid(hm, hull, 3, hl=1, sh=1)
    c.tex(hm, tex_planks_h(c, ph=5, y0=194, seam=70, grain=0.06))
    c.fill(c.poly([(0, 194), (310, 194), (384, 184), (384, 187), (310, 197), (0, 197)]), hull, 5)
    # a small banca near the bank
    bn = c.poly([(300, 150), (338, 150), (334, 154), (304, 154)])
    c.solid(bn, hull, 3, hl=1, sh=1)
    return stage(c, [(francisco(g), 246, 203, False), (jose_boy(g, barefoot=True), 286, 203, False)])


# ---------------------------------------------------------------- Biñan by moonlight, 1869
def binan_1869():
    g = grade_fn('#9AB0E0', 0.10, contrast=1.02)
    c = Canvas(W, H, grade=g)
    night = sky(c, '#0E1430', '#3A4A78', 150)
    stars(c, c.rect(0, 0, W - 1, 110), c.R('star', '#E8ECF8'), seed=3)
    moon(c, 300, 40, 12, c.R('moon', '#F2EED8'))
    stone = c.R('stone', '#8C8CA0')
    wood = c.R('wood', '#3E3446')
    dk = c.R('dk', '#1E1A2A')
    capiz = c.R('capiz', '#B8B4C8')
    inter = c.R('inter', '#14121E')
    tile = c.R('tile', '#5A4058')
    iron = c.R('iron', '#2A2A34')
    back = c.R('backtrees', '#1A2232')
    c.fill(c.rect(0, 110, W - 1, 170), back, 2)
    canopy(c, -10, 92, 120, 40, back, seed=4, base=2)
    canopy(c, 150, 96, 120, 36, back, seed=6, base=2)
    canopy(c, 300, 90, 100, 44, back, seed=7, base=2)
    facade_bahay(c, 20, 170, 168, 128, 90, stone, wood, dk, capiz, inter, tile, iron, 4, open_idx=(1,))
    c.adjust(c.rect(20, 128, 170, 168), -1)
    door = c.rect(84, 140, 104, 168)
    c.fill(door, dk, 2)
    c.tex(door, tex_planks_v(c, pw=4, x0=84))
    # lamplight behind one window
    warm = c.R('lampwin', '#E8B860')
    c.fill(c.rect(66, 100, 78, 112), warm, 4)
    c.dither_adjust(c.rect(60, 96, 84, 118), 0.4)
    # nipa houses and a mango tree across the street
    wall, thatch, post = c.R('sawali', '#6A6478'), c.R('nipa', '#4E4658'), c.R('post', '#2E2A36')
    nipa_hut(c, 214, 168, 40, 40, wall, thatch, post, seed=2)
    nipa_hut(c, 300, 170, 44, 44, wall, thatch, post, seed=5)
    leaf = c.R('mango', '#2A3A3E')
    trunk(c, 274, 116, 170, 5, c.R('bark', '#2A2430'))
    canopy(c, 244, 70, 70, 52, leaf, seed=9, base=3)
    # bamboo fence along the street
    fence = c.R('fence', '#5A5468')
    c.fill(c.rect(176, 158, 212, 170) & ((c.xx % 4) < 2), fence, 3)
    c.fill(c.rect(176, 160, 212, 160) | c.rect(176, 166, 212, 166), fence, 2)
    # the street: packed earth, moon shadows
    road = c.R('road', '#5A5468')
    rm = c.rect(0, 170, W - 1, H - 1)
    c.fill(rm, road, 3)
    c.tex(rm, tex_noise(c, 0.08, 0.05, seed=4))
    c.dither_adjust(c.rect(0, 170, W - 1, 186), -0.5)
    c.fill(c.rect(0, 168, 176, 171), stone, 2)
    # moonlight on the open street
    c.dither_adjust(rm & c.ell(140, 176, 420, 240), 0.35)
    return stage(c, [(cousin(g), 206, 208, False), (jose_boy(g, barefoot=True), 240, 208, False)])


# ---------------------------------------------------------------- Laguna de Bay, 17 Dec 1870
def laguna_1870():
    g = grade_fn('#FFE0B0', 0.07, contrast=1.03)
    c = Canvas(W, H, grade=g)
    sky(c, '#5A94CC', '#F0E6D2', 126)
    cl = c.R('cloud', colors=[hx(h) for h in CLOUD])
    cloud(c, 160, 24, 80, 16, cl, seed=5)
    # Mount Makiling above Calamba's shore (its long ridge with several summits)
    mak = c.R('makiling', '#5E7E8A')
    ridge(c, mak, 112, 46, 0.012, seed=3, tone=4, peaks=((250, 26, 46), (300, 20, 30), (196, 12, 40)), y_max=128)
    shore = c.R('shore', '#5E8A4E')
    c.fill(c.rect(0, 116, W - 1, 128), shore, 3)
    canopy(c, 150, 104, 120, 18, c.R('shoretrees', '#4A7A3A'), seed=7, base=3)
    frond, ptrunk = c.R('frond', '#3E6E36'), c.R('ptrunk', '#8A7A5A')
    for px, ph in ((176, 30), (214, 34), (262, 28), (300, 32)):
        palm(c, px, 126, ph, 4, frond, ptrunk, seed=px)
    # low houses along the shore
    roofs = c.R('roofs', '#9A5A3E')
    for hx_ in (196, 232, 248, 280):
        c.solid(c.rect(hx_, 118, hx_ + 10, 126), c.R('walls', '#E0D8C4'), 4, hl=1)
        c.fill(c.poly([(hx_ - 2, 118), (hx_ + 12, 118), (hx_ + 5, 113)]), roofs, 3)
    # the lake
    lake = c.R('lake', '#6A9AB0')
    wm = water(c, 128, H - 1, lake, seed=4, base=3, top_tone=5)
    # the captain's boat, rowed out to meet it
    bn = c.poly([(240, 190), (282, 190), (278, 195), (244, 195)])
    c.solid(bn, c.R('banca', '#6A4A2E'), 3, hl=1, sh=1)
    for ox in (250, 258, 266, 274):
        c.fill(c.line([(ox, 189), (ox - 4, 197)]), c.R('oar', '#C8A870'), 3)
    # we are aboard the steamer: its deck and rail in front, under the awning's edge
    deck(c, rail_y=166, deck_y=188)
    return stage(c, [(camps(g), 120, 210, False), (jose_boy(g), 160, 210, False)])


# ---------------------------------------------------------------- Manila Bay before dawn, 3 May 1882
def manilabay_1882():
    g = grade_fn('#B8C0E0', 0.08, contrast=1.04)
    c = Canvas(W, H, grade=g)
    # facing east, toward the city: the first light behind it
    cols = [hx(h) for h in ['#0C1230', '#18204A', '#2A3260', '#4A4A74', '#7A6A84', '#B88A80', '#E0A880']]
    rid = c.R('dawn', colors=cols)
    c.gradient(c.rect(0, 0, W - 1, 122), rid, 0, 6.4, 0, 122)
    stars(c, c.rect(0, 0, W - 1, 60), c.R('star', '#E8ECF8'), seed=5, density=0.003)
    # the low city along the shore, a few church towers, darker than the sky
    city = c.R('city', '#1E1E34')
    cm = c.rect(0, 112, W - 1, 126)
    rng = np.random.default_rng(3)
    x = 0
    while x < W:
        w = int(rng.integers(8, 22))
        hgt = int(rng.integers(4, 12))
        cm |= c.rect(x, 112 - hgt, x + w, 126)
        x += w
    for tx, th in ((70, 30), (150, 22), (236, 34), (318, 24)):
        cm |= c.rect(tx, 112 - th, tx + 7, 126) | c.poly([(tx - 1, 112 - th), (tx + 8, 112 - th), (tx + 3, 106 - th)])
    c.fill(cm, city, 2)
    for lx in range(6, W, 23):
        c.fill(c.rect(lx, 118, lx, 118), c.R('citylight', '#E8B860'), 5)
    # the bay
    bay = c.R('bay', '#2E3A5E')
    wm = water(c, 126, H - 1, bay, seed=9, base=2, top_tone=3)
    c.dither_adjust(wm & (c.yy < 140) & (c.xx > 120) & (c.xx < 280), 0.4)  # dawn on the water
    deck(c, rail_y=164, deck_y=186)
    return stage(c, [(rizal_young(g), 230, 210, False)])


# ---------------------------------------------------------------- the railway north, 1892
def railway_1892():
    g = grade_fn('#FFF0D0', 0.05, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#3E86CC', '#E2EEEE', 120)
    cl = c.R('cloud', colors=[hx(h) for h in CLOUD])
    cloud(c, 40, 22, 80, 18, cl, seed=2)
    cloud(c, 270, 14, 90, 22, cl, seed=6)
    # Mount Arayat: a lone volcano rising from the flat Pampanga plain
    ar = c.R('arayat', '#6A8AA0')
    xs = np.arange(W)
    top = 116 - 54 * np.exp(-((xs - 270) / 46.0) ** 2)
    top -= 6 * np.exp(-((xs - 290) / 10.0) ** 2) - 4 * np.exp(-((xs - 262) / 6.0) ** 2)
    am = np.zeros((H, W), bool)
    for x in range(W):
        am[int(top[x]):122, x] = True
    c.solid(am, ar, 4, hl=1, sh=0)
    c.dither_adjust(am & (c.xx > 274), -0.4)
    # the plain: rice paddies divided by low dikes
    paddy = c.R('paddy', '#7EAA4A')
    pm = c.rect(0, 120, W - 1, H - 1)
    c.fill(pm, paddy, 3)
    for k, y in enumerate((124, 130, 138, 150, 168, 192)):
        c.fill(c.rect(0, y, W - 1, y), paddy, 2)
        c.fill(c.rect(0, y + 1, W - 1, y + 1), paddy, 5)
    c.fill(pm & ((c.xx * 3 + c.yy * 5) % 13 == 0), paddy, 4)
    frond, ptrunk = c.R('frond', '#3E6E36'), c.R('ptrunk', '#8A7A5A')
    for px, ph in ((22, 40), (54, 34), (352, 44)):
        palm(c, px, 132, ph, 5, frond, ptrunk, seed=px)
    canopy(c, 90, 108, 60, 18, c.R('trees', '#4E7E3E'), seed=3, base=3)
    # the embankment and the track
    base = 172
    emb = c.R('ballast', '#A8987A')
    c.fill(c.poly([(0, base), (W - 1, base), (W - 1, base + 14), (0, base + 14)]), emb, 3)
    c.tex(c.rect(0, base, W - 1, base + 14), tex_noise(c, 0.1, 0.05, seed=5))
    c.fill(c.rect(0, base + 2, W - 1, base + 2) & (c.xx % 5 < 3), c.R('sleeper', '#5A4A3A'), 2)
    c.fill(c.rect(0, base + 1, W - 1, base + 1), c.R('rail', '#6A6A72'), 4)
    # flooded paddies in front, newly planted, mirroring the sky
    flood = c.R('flood', '#8CB8D0')
    for y0, y1 in ((190, 200), (204, H - 1)):
        fm_ = c.rect(0, y0, W - 1, y1)
        c.fill(fm_, flood, 4)
        c.fill(fm_ & ((c.xx * 5 + c.yy * 7) % 9 == 0), paddy, 3)
        c.fill(fm_ & ((c.xx * 3 + c.yy * 11) % 13 == 0), paddy, 4)
    c.fill(c.rect(0, 186, W - 1, 189) | c.rect(0, 201, W - 1, 203), paddy, 2)
    # telegraph poles beside the line
    for px in (8, 120, 232, 344):
        c.fill(c.rect(px, 128, px, base), c.R('tpole', '#5A4A3A'), 2)
        c.fill(c.rect(px - 4, 130, px + 4, 130), c.R('tpole', '#5A4A3A'), 2)
    c.fill(c.line([(0, 132), (W - 1, 132)]), c.R('wire', '#3A3A40'), 2)
    # the train: a small tank engine and three wooden coaches, heading north (left)
    blk, red, cream = c.R('loco', '#26262E'), c.R('buffer', '#8A2E2A'), c.R('coach', '#7A4A2E')
    boiler = c.rect(70, base - 22, 118, base - 10)
    c.solid(boiler, blk, 3, hl=1, sh=1)
    c.solid(c.rect(112, base - 32, 132, base - 8), blk, 2, hl=1, sh=1)          # cab
    c.fill(c.rect(116, base - 28, 128, base - 20), c.R('cabwin', '#C8D8E0'), 4)
    c.fill(c.poly([(76, base - 22), (84, base - 22), (88, base - 38), (72, base - 38)]), blk, 3)  # chimney
    c.fill(c.rect(70, base - 40, 90, base - 38), blk, 3)
    c.solid(c.ell(92, base - 28, 100, base - 22), c.R('brass', '#C8A040'), 4, hl=1)      # dome
    c.fill(c.rect(64, base - 10, 134, base - 7), red, 3)
    for wx in (78, 96, 114):
        c.solid(c.ell(wx, base - 10, wx + 12, base + 1), blk, 2, hl=1, sh=1)
    for k in range(3):
        x0 = 140 + k * 72
        cm_ = c.rect(x0, base - 26, x0 + 66, base - 8)
        c.solid(cm_, cream, 3, hl=1, sh=1)
        c.fill(c.rect(x0 - 2, base - 29, x0 + 68, base - 26), c.R('coachroof', '#5A5A5E'), 3)
        for wx in range(x0 + 5, x0 + 62, 9):
            c.fill(c.rect(wx, base - 22, wx + 5, base - 15), c.R('coachwin', '#2E2A2A'), 2)
        for wx in (x0 + 6, x0 + 48):
            c.solid(c.ell(wx, base - 9, wx + 10, base + 1), blk, 2, hl=1, sh=1)
    smoke = c.R('smoke', '#D8D4D0')
    for k in range(8):
        c.solid(c.ell(70 + k * 14, base - 54 - k * 3, 92 + k * 16, base - 40 - k * 3), smoke, 4 + (k % 2), hl=1, sh=0)
    plat = c.R('platform', '#9A8A70')
    c.fill(c.rect(0, 194, W - 1, H - 1), plat, 4)
    c.tex(c.rect(0, 194, W - 1, H - 1), tex_planks_h(c, ph=5, y0=194, seam=60, grain=0.05))
    c.fill(c.rect(0, 194, W - 1, 195), plat, 6)
    c.dither_adjust(c.rect(0, 196, W - 1, 200), -0.5)
    return stage(c, [(rizal_suit(g, hat='bowler'), 300, 210, False)])


# ---------------------------------------------------------------- Dapitan: the mail steamer, Sept 1892
def dapitan_steamer_1892():
    g = grade_fn('#FFF0D0', 0.05, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#3A86D0', '#E4F0F0', 118)
    cl = c.R('cloud', colors=[hx(h) for h in CLOUD])
    cloud(c, 120, 18, 100, 22, cl, seed=4)
    ridge(c, c.R('headland', '#5E8A6E'), 112, 16, 0.03, seed=8, tone=3, x0=250, peaks=((330, 12, 30),), y_max=124)
    sea = c.R('sea', '#3A8AB0')
    wm = water(c, 116, 176, sea, seed=2, base=3, top_tone=5)
    flags = [c.R('fr', '#C83A2E'), c.R('fy', '#E8C040'), c.R('fb', '#2E5AA8'), c.R('fw', '#F0EEE8')]
    sm = steamer(c, 70, 150, 150, c.R('hull', '#24242C'), c.R('upper', '#EAE4D6'), c.R('funnel', '#2E2A2A'),
                 c.R('mast', '#3A3430'), funnel_top=c.R('ftop', '#1A1818'), funnels=1, masts=2, flags=flags,
                 boot=c.R('boot', '#8A2E2A'))
    reflect(c, sm, 150, wm, d=-1)
    # the beach of the bay, palms leaning over the sand
    sand = c.R('sand', '#E2D2A8')
    beach = c.poly([(0, 176), (W - 1, 168), (W - 1, H - 1), (0, H - 1)])
    c.fill(beach, sand, 4)
    c.tex(beach, tex_noise(c, 0.06, 0.05, seed=3))
    c.fill(c.line([(0, 176), (W - 1, 168)], w=2), c.R('foam', '#F4F4EE'), 5)
    frond, ptrunk = c.R('frond', '#3E6E36'), c.R('ptrunk', '#8A7A5A')
    palm(c, 24, 210, 120, 24, frond, ptrunk, seed=3)
    palm(c, 340, 206, 104, -30, frond, ptrunk, seed=9)
    bn = c.poly([(250, 188), (300, 186), (296, 192), (254, 193)])
    c.solid(bn, c.R('banca', '#6A4A2E'), 3, hl=1, sh=1)
    c.fill(c.line([(244, 194), (306, 191)]), c.R('outrigger', '#C8B080'), 3)
    shadow(c, 240, 192, 310, 198, -1)
    return c.render()


# ---------------------------------------------------------------- Dapitan plaza: the relief map of Mindanao
def mindanao_mask(w, h):
    """Mindanao's coastline, read from the game's Philippines map (drawn from real coastlines,
    legacy-v1/gen_ph.py; bounds lat 4.8–20.2, lon 114.6–130.2), largest island only."""
    im = np.array(Image.open('../assets/maps/philippines.png').convert('RGB')).astype(int)
    S = im.shape[0]
    def px(lat, lon):
        return int((lon - 114.6) / 15.6 * S), int((20.2 - lat) / 15.4 * S)
    x0, y0 = px(10.0, 121.7)
    x1, y1 = px(5.4, 126.7)
    crop = im[y0:y1, x0:x1]
    r, g_, b = crop[..., 0], crop[..., 1], crop[..., 2]
    land = ~((b > r + 25) & (b >= g_ - 10))
    # keep the largest connected piece (Mindanao itself)
    lab = np.zeros(land.shape, int)
    best, best_n, cur = 0, 0, 0
    for sy in range(land.shape[0]):
        for sx in range(land.shape[1]):
            if land[sy, sx] and lab[sy, sx] == 0:
                cur += 1
                stack, n = [(sy, sx)], 0
                lab[sy, sx] = cur
                while stack:
                    y, x = stack.pop()
                    n += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        yy, xx = y + dy, x + dx
                        if 0 <= yy < land.shape[0] and 0 <= xx < land.shape[1] and land[yy, xx] and lab[yy, xx] == 0:
                            lab[yy, xx] = cur
                            stack.append((yy, xx))
                if n > best_n:
                    best, best_n = cur, n
    island = lab == best
    # fill lakes and rivers inside the island (the source map draws them in blue): any
    # non-land area that does not reach the crop's edge is part of the island's surface
    outside = np.zeros(island.shape, bool)
    stack = [(y, x) for y in range(island.shape[0]) for x in (0, island.shape[1] - 1)]
    stack += [(y, x) for x in range(island.shape[1]) for y in (0, island.shape[0] - 1)]
    while stack:
        y, x = stack.pop()
        if outside[y, x] or island[y, x]:
            continue
        outside[y, x] = True
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if 0 <= yy < island.shape[0] and 0 <= xx < island.shape[1]:
                stack.append((yy, xx))
    island = ~outside
    m = Image.fromarray((island * 255).astype(np.uint8)).resize((w, h), Image.NEAREST)
    return np.array(m) > 0


def dapitan_map():
    g = grade_fn('#FFF0D0', 0.05, contrast=1.03)
    c = Canvas(W, H, grade=g)
    sky(c, '#4A8ED0', '#E6F0EE', 70)
    # trees around the plaza
    leaf = c.R('acacia', '#4E7E3E')
    c.fill(c.rect(0, 50, W - 1, 92), leaf, 2)
    canopy(c, -10, 30, 140, 60, leaf, seed=2, base=3)
    canopy(c, 250, 26, 150, 64, leaf, seed=5, base=3)
    canopy(c, 110, 44, 150, 46, c.R('acacia2', '#5A8A46'), seed=8, base=3)
    frond, ptrunk = c.R('frond', '#3E6E36'), c.R('ptrunk', '#8A7A5A')
    palm(c, 196, 96, 70, 6, frond, ptrunk, seed=4)
    # the plaza lawn, seen from a little above
    lawn = c.R('lawn', '#7AA44E')
    lm = c.rect(0, 92, W - 1, H - 1)
    c.fill(lm, lawn, 3)
    c.fill(lm & ((c.xx * 7 + c.yy * 3) % 11 == 0), lawn, 4)
    c.dither_adjust(c.rect(0, 92, W - 1, 100), -0.5)
    # the raised map of Mindanao: its coastline traced from the real island, squashed by the view
    mw, mh = 220, 104
    mm = mindanao_mask(mw, mh)
    ox, oy = (W - mw) // 2, 98
    full = np.zeros((H, W), bool)
    full[oy:oy + mh, ox:ox + mw] = mm
    rel = c.R('relief', '#9AAA6A')
    side = c.shift(full, 3, 0) & ~full
    c.fill(side, c.R('reliefside', '#6A6A4A'), 2)
    c.solid(full, rel, 4, hl=1, sh=1)
    c.fill(full & ((c.xx + c.yy * 2) % 9 == 0), rel, 3)
    shadow(c, ox - 6, oy + mh - 6, ox + mw + 6, oy + mh + 8, -1)
    # a low edging of stones around the lawn's walk
    c.fill(c.rect(0, 206, W - 1, 207), c.R('kerb', '#C8C0AA'), 4)
    return stage(c, [(rizal_dapitan(g), 22, 212, False), (sanchez(g), 330, 212, True)])


# ---------------------------------------------------------------- Fort Santiago: the chapel, 29 Dec 1896
def chapel_1896():
    g = grade_fn('#E8B070', 0.12, contrast=1.05)
    c = Canvas(W, H, grade=g)
    stone = c.R('stone', '#7A6A5A')
    floor = c.R('floor', '#5A4A3E')
    wm, fm = room(c, stone, floor, 170, wall_tex=None, floor_tex=None)
    c.tex(wm, tex_blocks(c, 16, 8, seed=6))
    c.fill(fm, floor, 2)
    c.tex(fm, tex_blocks(c, 20, 6, y0=170, seed=7))
    # a barred window high in the wall, night outside
    c.gradient(c.rect(40, 40, 76, 74), c.R('night', '#2E3A6A'), 4, 2, 40, 74)
    c.fill(c.rect(40, 40, 76, 74) & ((c.xx - 40) % 7 == 3), c.R('bars', '#14141A'), 1)
    c.solid(c.rect(36, 74, 80, 78), stone, 5, hl=1)
    # the altar: a cloth, a crucifix, two candles
    wood = c.R('wood', '#5A3A26')
    cloth = c.R('altarcloth', '#E6DCC6')
    c.solid(c.rect(150, 120, 250, 170), wood, 3, hl=1, sh=1)
    c.fill(c.rect(148, 118, 252, 126), cloth, 5)
    c.fill(c.rect(150, 126, 250, 140) & ((c.xx % 6) < 3), cloth, 4)
    cross = c.rect(198, 62, 201, 112) | c.rect(188, 72, 211, 75)
    c.solid(cross, wood, 3, hl=1, sh=1)
    for cx_ in (166, 232):
        c.solid(c.rect(cx_, 100, cx_ + 3, 117), c.R('candle', '#F0E6C8'), 5, hl=1)
        c.fill(c.rect(cx_ + 1, 96, cx_ + 2, 99), c.R('flame', '#FFF0C0'), 6)
        pass
    # a small table with papers, a pen, the little alcohol cooking stove, a bench
    table(c, 280, 144, 350, wood, h=26)
    c.solid(c.rect(290, 140, 312, 143), c.R('paper', '#ECE4CE'), 5, hl=1, sh=1)
    c.fill(c.rect(300, 139, 312, 139), c.R('pen', '#2A2430'), 2)
    stove = c.R('stove', '#8A8A90')
    c.solid(c.rect(322, 134, 334, 143), stove, 4, hl=1, sh=1)
    c.fill(c.rect(320, 132, 336, 133), stove, 5)
    c.solid(c.rect(60, 176, 130, 180), wood, 3, hl=1, sh=1)
    for lx in (64, 124):
        c.fill(c.rect(lx, 180, lx + 2, 196), wood, 2)
    # a dark room, warm candlelight falling off softly around the altar
    d = np.sqrt((c.xx - 200) ** 2 + ((c.yy - 140) * 1.2) ** 2)
    every = np.ones((H, W), bool)
    for start in (50, 110, 170):  # each pass takes one more tone away, further out
        c.dither_adjust(every, -np.clip((d - start) / 80, 0, 1))
    c.dither_adjust(every, np.clip(1 - d / 80, 0, 1) * 0.8)
    return stage(c, [(rizal_black(g), 244, 206, False)])


SCENES = {
    'pasig_1868': pasig_1868,
    'binan_1869': binan_1869,
    'laguna_1870': laguna_1870,
    'manilabay_1882': manilabay_1882,
    'railway_1892': railway_1892,
    'dapitan_steamer_1892': dapitan_steamer_1892,
    'dapitan_map': dapitan_map,
    'chapel_1896': chapel_1896,
}

if __name__ == '__main__':
    import sys
    names = sys.argv[1:] or list(SCENES)
    for name in names:
        im = SCENES[name]()
        im.save(f'out/scene_{name}.png')
        im.resize((W * 3, H * 3), Image.NEAREST).save(f'out/prev_{name}.png')
        print('ok', name)
    paths = [f'out/scene_{n}.png' for n in names]
    for i in range(0, len(paths), 4):
        contact(paths[i:i + 4], f'out/sheet_ph_{i // 4}.png')
