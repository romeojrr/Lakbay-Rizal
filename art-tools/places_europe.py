"""v2.4 story pictures in Europe and on the way there (no people; see places_kit.py).

  suez_1882          Barcelona 1882, ch.2: through the Suez Canal (opened 1869) on the Djemnah
  chateaudif_1882    Barcelona 1882, ch.2: the Château d'If off Marseille (June 1882); Notre-Dame
                     de la Garde (finished 1864) on its hill behind the city
  lunastudio_1885    Paris 1885, ch.3: Juan Luna's studio, where Rizal posed and they fenced
  eyeclinic_1886     Heidelberg 1886, ch.2: a ward of the University Eye Hospital
  dresden_1886       Leipzig 1886, ch.4: Dresden on the Elbe (late Oct 1886): the Augustus Bridge,
                     the Catholic court church (Hofkirche) and the dome of the Frauenkirche
  berlinroom_1886    Berlin 1887, ch.2: his cheap lodging room in the winter of 1886–87
  blumentritt_1887   Leitmeritz 1887, ch.2: the Blumentritt family's table (May 1887)
  rome_1887          Leitmeritz 1887, ch.4: Rome, the Colosseum (June 1887)
  chalcot_1888       London 1888, ch.1: Chalcot Crescent, Primrose Hill (1888). No blue plaque: it
                     was put up in 1983.
  ghent_1891         Ghent 1891, ch.1: the Graslei guild houses on the Leie (July 1891)
  montjuic_1896      Fort Santiago 1896, ch.2: Montjuïc castle above Barcelona's harbour (Oct 1896)

Run: python places_europe.py  → out/scene_<name>.png, out/prev_<name>.png, out/sheet_eu_*.png
"""
import numpy as np
from PIL import Image
from artkit import Canvas, BAYER, hx, tex_noise, tex_blocks, tex_bricks, tex_planks_h, tex_planks_v, tex_tiles, tex_cobbles
from common import W, H, grade_fn, sky, cloud, ridge, canopy, trunk, palm, lamp_glow, shadow
from kit2 import water, reflect, table, chair, bookshelf, euro_window, paper_stack
from places_kit import steamer, room, stepped_gable, windows_grid, stars, contact, deck
from places_cast import *

CLOUD = ['#8FA8C0', '#AFC3D4', '#CCDAE4', '#E2EAEF', '#F1F4F5', '#FAFBFA', '#FFFFFF']
GREY_CLOUD = ['#7A808A', '#8E949C', '#A2A8AE', '#B6BABE', '#C8CACC', '#D8DADA', '#E8E8E8']


# ---------------------------------------------------------------- the Suez Canal, 1882
def suez_1882():
    g = grade_fn('#FFE8C0', 0.08, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#5A9AD4', '#F4E8D0', 120)
    # flat desert on the far side, a low ridge of dunes
    sand = c.R('sand', '#E2C890')
    ridge(c, c.R('dunes', '#D8BC88'), 112, 6, 0.03, seed=4, tone=4, y_max=124)
    c.fill(c.rect(0, 118, W - 1, 132), sand, 4)
    # a canal station: palms and a low white house with a flat roof
    frond, ptrunk = c.R('frond', '#4E7A3A'), c.R('ptrunk', '#8A7A5A')
    for px, ph in ((290, 40), (312, 46), (338, 36)):
        palm(c, px, 130, ph, 4, frond, ptrunk, seed=px)
    c.solid(c.rect(250, 116, 282, 130), c.R('white', '#F0EADC'), 5, hl=1, sh=1)
    for wx in (256, 266, 276):
        c.fill(c.rect(wx, 121, wx + 2, 125), c.R('win', '#4A3A30'), 2)
    # the canal: a narrow, straight band of water between sand banks
    canal = c.R('canal', '#3E8AA8')
    wm = water(c, 132, 160, canal, seed=3, base=3, top_tone=5)
    # the near bank: sand, a towpath, low scrub
    bank = c.rect(0, 160, W - 1, H - 1)
    c.fill(bank, sand, 4)
    c.tex(bank, tex_noise(c, 0.06, 0.05, seed=5))
    c.fill(c.rect(0, 160, W - 1, 162), sand, 3)
    c.fill(c.rect(0, 176, W - 1, 178), c.R('path', '#C8AE7C'), 3)
    scrub = c.R('scrub', '#8A8A5A')
    rng = np.random.default_rng(12)
    for bx in (20, 90, 200, 330):
        for k in range(14):
            x_, y_ = bx + int(rng.integers(0, 18)), 192 + int(rng.integers(-3, 4))
            c.fill(c.line([(x_, y_ + 4), (x_ + int(rng.integers(-3, 4)), y_ - int(rng.integers(1, 6)))]), scrub, 3 + int(rng.integers(0, 2)))
    deck(c, rail_y=150, deck_y=172)
    return stage(c, [(rizal_young(g, holding='book'), 186, 208, False)])


# ---------------------------------------------------------------- the Château d'If, 1882
def chateaudif_1882():
    g = grade_fn('#FFF0D8', 0.05, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#3A84D0', '#E6EEF2', 112)
    cl = c.R('cloud', colors=[hx(h) for h in CLOUD])
    cloud(c, 30, 20, 90, 18, cl, seed=4)
    # the white limestone hills behind Marseille, Notre-Dame de la Garde on its peak
    hills = c.R('hills', '#B8B4A8')
    hm, yv = ridge(c, hills, 108, 30, 0.02, seed=6, tone=4, peaks=((300, 22, 26),), y_max=120)
    ndg = c.R('ndg', '#D8D0C0')
    nx = 300
    ny = int(yv[nx])
    c.solid(c.rect(nx - 8, ny - 8, nx + 8, ny + 2), ndg, 4, hl=1, sh=1)
    c.solid(c.rect(nx - 2, ny - 24, nx + 2, ny - 8), ndg, 4, hl=1, sh=1)       # the bell tower
    c.fill(c.rect(nx - 1, ny - 29, nx + 1, ny - 25), c.R('gold', '#E8C050'), 5)  # the gilded statue
    c.fill(c.rect(0, 116, W - 1, 120), c.R('city', '#C8BCA8'), 3)
    c.fill(c.rect(0, 116, W - 1, 120) & ((c.xx % 5) == 0), c.R('city', '#C8BCA8'), 2)
    # the sea
    sea = c.R('sea', '#2E78B0')
    wm = water(c, 120, H - 1, sea, seed=5, base=3, top_tone=4)
    # the island: low white rock
    rock = c.R('rock', '#D8D0BC')
    isl = c.poly([(64, 176), (80, 160), (96, 154), (130, 150), (190, 148), (262, 150), (300, 152),
                  (322, 160), (336, 172), (318, 180), (200, 182), (90, 182)])
    c.solid(isl, rock, 4, hl=1, sh=1)
    cliff = isl & (c.yy > 164)
    c.fill(cliff, rock, 3)
    c.fill(cliff & ((c.xx * 3 + c.yy) % 7 == 0), rock, 2)
    c.fill(cliff & ((c.xx + c.yy * 5) % 11 == 0), rock, 5)
    c.tex(isl & (c.yy <= 164), tex_noise(c, 0.10, 0.06, seed=7))
    # the fortress: a ring of ramparts, a square three-storey castle with round towers
    stone = c.R('stone', '#E2DAC6')
    ramp_m = c.rect(100, 136, 292, 154)
    c.solid(ramp_m, stone, 4, hl=1, sh=1)
    c.tex(ramp_m, tex_blocks(c, 10, 5, y0=136, seed=8))
    c.fill(c.rect(100, 134, 292, 135) & (c.xx % 6 < 3), stone, 4)  # battlements
    keep = c.rect(150, 100, 240, 140)
    c.solid(keep, stone, 4, hl=1, sh=1)
    c.tex(keep, tex_blocks(c, 10, 5, y0=100, seed=9))
    for tx in (140, 236):
        tw = c.rect(tx, 92, tx + 16, 140) | c.ell(tx, 88, tx + 16, 96)
        c.solid(tw, stone, 5 if tx < 200 else 3, hl=1, sh=1)
        c.fill(c.rect(tx, 90, tx + 16, 91) & (c.xx % 4 < 2), stone, 4)
    for wx in (166, 186, 206, 224):
        for wy in (108, 122):
            c.fill(c.rect(wx, wy, wx + 2, wy + 4), c.R('slit', '#4A443E'), 2)
    reflect(c, isl | keep | ramp_m, 176, wm & (c.yy > 176), d=-1)
    ledge = c.poly([(0, 186), (60, 180), (130, 186), (176, 200), (190, 216), (0, 216)])
    c.solid(ledge, rock, 4, hl=1, sh=1)
    c.fill(ledge & ((c.xx * 3 + c.yy) % 7 == 0), rock, 3)
    return stage(c, [(rizal_young(g), 56, 204, False)])


# ---------------------------------------------------------------- Juan Luna's studio, Paris
def lunastudio_1885():
    g = grade_fn('#F0E0C8', 0.06, contrast=1.04)
    c = Canvas(W, H, grade=g)
    wall = c.R('wall', '#B8A890')
    floor = c.R('floor', '#7A5A3E')
    room(c, wall, floor, 176)
    # the great north window, slanted into the roof, grey Paris sky beyond
    glass = c.R('glass', '#B8C8D4')
    win = c.poly([(220, 0), (384, 0), (384, 120), (250, 120)])
    c.gradient(win, glass, 5, 3, 0, 120)
    frame = c.R('frame', '#4A3A2E')
    c.fill(win & (((c.xx - 220) % 24) == 0), frame, 2)
    c.fill(win & ((c.yy % 30) == 0), frame, 2)
    c.fill(c.line([(220, 0), (250, 120)], w=2), frame, 2)
    c.fill(c.rect(250, 120, 383, 123), frame, 3)
    c.dither_adjust(c.poly([(250, 124), (384, 124), (384, 216), (180, 216)]), 0.4)  # daylight
    # a very large canvas on a studio easel, laid in with brown underpainting
    wood = c.R('easel', '#6A4A2E')
    c.fill(c.rect(112, 20, 116, 190) | c.line([(114, 20), (86, 190)], w=3) | c.line([(114, 20), (142, 190)], w=3), wood, 3)
    canvas = c.rect(40, 40, 196, 150)
    c.solid(canvas, c.R('canvas', '#8A6A4A'), 3, hl=1, sh=1)
    c.fill(c.rect(44, 44, 192, 146) & ((c.xx * 3 + c.yy * 5) % 11 < 3), c.R('canvas', '#8A6A4A'), 2)
    c.fill(c.rect(44, 104, 192, 146), c.R('canvas', '#8A6A4A'), 4)
    c.solid(c.rect(36, 150, 200, 156), wood, 3, hl=1, sh=1)  # the ledge
    # smaller canvases turned to the wall, a plaster bust on a shelf
    for k, (x0, w_, h_) in enumerate(((210, 40, 50), (236, 30, 40), (262, 44, 56))):
        c.solid(c.rect(x0, 176 - h_, x0 + w_, 176), c.R('stretcher', '#C8B08A'), 4, hl=1, sh=1)
        c.fill(c.rect(x0 + 3, 179 - h_, x0 + w_ - 3, 173) & ((c.xx - x0) % 12 == 0), c.R('stretcher', '#C8B08A'), 2)
    c.solid(c.rect(12, 60, 34, 64), wood, 4, hl=1)
    c.solid(c.ell(16, 40, 30, 56), c.R('plaster', '#ECE6DA'), 5, hl=1, sh=1)
    c.solid(c.rect(18, 54, 28, 60), c.R('plaster', '#ECE6DA'), 5, hl=1, sh=1)
    # two fencing foils crossed under a pair of masks: they fenced here on Sundays
    steel = c.R('steel', '#A8AEB8')
    c.fill(c.line([(300, 140), (370, 168)]) | c.line([(300, 168), (370, 140)]), steel, 5)
    for gx in (300, 370):
        c.fill(c.ell(gx - 3, 151, gx + 3, 157), steel, 4)
    for mx in (316, 344):
        c.solid(c.ell(mx, 124, mx + 14, 140), c.R('mask', '#3A3A44'), 2, hl=1, sh=1)
        c.fill(c.ell(mx, 124, mx + 14, 140) & ((c.xx + c.yy) % 2 == 0), c.R('mask', '#3A3A44'), 3)
    # a model's platform with a red drape
    drape = c.R('drape', '#9A2E2E')
    c.solid(c.rect(150, 178, 260, 192), wood, 3, hl=1, sh=1)
    c.solid(c.poly([(160, 178), (250, 178), (262, 196), (146, 196)]), drape, 3, hl=1, sh=1)
    c.fill(c.poly([(160, 178), (250, 178), (262, 196), (146, 196)]) & ((c.xx % 9) == 0), drape, 2)
    return stage(c, [(luna(g), 4, 208, False), (rizal_suit(g), 194, 184, False)])


# ---------------------------------------------------------------- Heidelberg: the eye hospital
def eyeclinic_1886():
    g = grade_fn('#F0F0E8', 0.04, contrast=1.03)
    c = Canvas(W, H, grade=g)
    wall = c.R('wall', '#D8D4C8')
    floor = c.R('floor', '#8A7058')
    room(c, wall, floor, 168)
    c.fill(c.rect(0, 118, W - 1, 168), c.R('dado', '#A8B4A8'), 3)  # painted lower wall
    c.fill(c.rect(0, 117, W - 1, 118), c.R('dado', '#A8B4A8'), 1)
    # tall windows on the wooded hills above the Neckar
    for wx in (30, 150, 270):
        glass_view = c.rect(wx, 22, wx + 70, 104)
        sky(c, '#7AA8D0', '#E0ECEE', 104, y0=22) if wx == 30 else None
        c.gradient(glass_view, c.R('winsky', '#8AB4D4'), 5, 3, 22, 80)
        hill = glass_view & (c.yy > 62 + ((c.xx - wx) * 0.15).astype(int))
        c.fill(hill, c.R('hills', '#4E7A4E'), 3)
        c.fill(glass_view & ((c.xx - wx) % 35 == 0) | glass_view & ((c.yy - 22) % 27 == 0), c.R('frame', '#F0EEE8'), 5)
        c.solid(c.rect(wx - 3, 104, wx + 73, 108), c.R('sill', '#E8E4DA'), 5, hl=1)
    # iron beds in a row, white sheets, the eye patients' ward
    iron = c.R('iron', '#3A3E48')
    sheet = c.R('sheet', '#F2F0EA')
    for bx in (14, 134, 254):
        c.fill(c.rect(bx, 128, bx + 3, 176) | c.rect(bx + 110, 140, bx + 113, 176), iron, 3)
        c.fill(c.rect(bx, 130, bx + 3, 130) | c.rect(bx, 136, bx + 3, 136), iron, 5)
        c.solid(c.rect(bx + 2, 150, bx + 112, 166), sheet, 5, hl=1, sh=1)
        c.solid(c.ell(bx + 6, 142, bx + 30, 154), sheet, 6, hl=1, sh=1)  # pillow
        c.fill(c.rect(bx + 34, 152, bx + 112, 158), c.R('blanket', '#A8B8C8'), 4)
        c.fill(c.rect(bx + 4, 166, bx + 110, 168), iron, 2)
    # a small table with a basin and a spirit lamp between the beds
    table(c, 122, 186, 136, c.R('wood', '#6A4A2E'), h=18)
    return stage(c, [(rizal_suit(g), 114, 212, False)])


# ---------------------------------------------------------------- Dresden on the Elbe, 1886
def dresden_1886():
    g = grade_fn('#F4E4C8', 0.07, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#6A9ACC', '#EEE6D8', 120)
    cl = c.R('cloud', colors=[hx(h) for h in CLOUD])
    cloud(c, 40, 14, 100, 20, cl, seed=2)
    cloud(c, 290, 26, 70, 14, cl, seed=6)
    sand = c.R('sandstone', '#B8AA90')
    dark = c.R('darkstone', '#7A6E62')
    roofs = c.R('roofs', '#6A7A7A')
    # the old town along the far bank (the Brühl Terrace), roofs and facades
    c.fill(c.rect(0, 104, W - 1, 128), sand, 3)
    rng = np.random.default_rng(4)
    x = 0
    while x < W:
        w_ = int(rng.integers(18, 34))
        h_ = int(rng.integers(10, 18))
        c.solid(c.rect(x, 104 - h_, x + w_ - 1, 118), sand, 3 + int(rng.integers(0, 2)), hl=1, sh=1)
        c.fill(c.poly([(x, 104 - h_), (x + w_ - 1, 104 - h_), (x + w_ - 4, 99 - h_), (x + 3, 99 - h_)]), roofs, 3)
        for wy in range(108 - h_, 116, 4):
            c.fill(c.rect(x + 2, wy, x + w_ - 3, wy + 1) & ((c.xx - x) % 4 == 1), dark, 2)
        x += w_
    # the Frauenkirche: a great stone bell-shaped dome with a lantern (right of centre)
    fx = 250
    c.solid(c.rect(fx - 26, 70, fx + 26, 118), sand, 4, hl=1, sh=1)
    dome = c.ell(fx - 24, 30, fx + 24, 90) & c.rect(0, 0, W - 1, 72)
    c.solid(dome, sand, 4, hl=1, sh=1)
    c.fill(dome & ((c.xx - fx) % 8 == 0), dark, 3)
    c.solid(c.rect(fx - 5, 16, fx + 5, 32), sand, 4, hl=1, sh=1)  # lantern
    c.fill(c.poly([(fx - 6, 16), (fx + 6, 16), (fx, 6)]), dark, 2)
    for tx in (fx - 30, fx + 24):  # the four corner turrets, with small domed caps
        c.solid(c.rect(tx, 60, tx + 6, 80), sand, 4, hl=1, sh=1)
        c.solid(c.ell(tx - 1, 55, tx + 7, 63) & c.rect(0, 0, W - 1, 60), sand, 5, hl=1, sh=1)
    # the Hofkirche: a long church with a tall, openwork tower, at the end of the bridge (left)
    hx_ = 92
    c.solid(c.rect(hx_ - 40, 82, hx_ + 30, 118), sand, 4, hl=1, sh=1)
    c.fill(c.rect(hx_ - 40, 80, hx_ + 30, 81) & (c.xx % 5 == 0), sand, 5)  # balustrade statues
    # the tower: a square base, then stages that narrow upward, each opened by tall arches
    # between columns, a small rounded cupola with a cross at the top
    stages = ((12, 60, 84), (10, 44, 60), (8, 30, 44), (6, 20, 30))
    for k, (w_, y0, y1) in enumerate(stages):
        t = c.rect(hx_ - w_, y0, hx_ + w_, y1)
        c.solid(t, sand, 4, hl=1, sh=1)
        for ox in range(-w_ + 3, w_ - 2, 5):
            c.fill(c.ell(hx_ + ox - 1, y0 + 2, hx_ + ox + 2, y0 + 6) | c.rect(hx_ + ox - 1, y0 + 4, hx_ + ox + 2, y1 - 3), dark, 2)
        c.fill(c.rect(hx_ - w_ - 1, y1 - 2, hx_ + w_ + 1, y1), sand, 5)  # cornice
    cup = c.ell(hx_ - 6, 10, hx_ + 6, 24) & c.rect(0, 0, W - 1, 20)
    c.solid(cup, c.R('copper', '#6E9A8A'), 3, hl=1, sh=1)
    c.fill(c.rect(hx_, 2, hx_, 10) | c.rect(hx_ - 2, 5, hx_ + 2, 5), dark, 2)
    # the river Elbe and the Augustus Bridge: a long stone bridge on many arches
    river = c.R('elbe', '#5A8AA0')
    wm = water(c, 128, H - 1, river, seed=6, base=3, top_tone=4)
    deck_y = 140
    bridge = c.rect(0, deck_y - 6, 210, deck_y + 4)
    for ax in range(4, 206, 26):
        bridge |= c.rect(ax + 16, deck_y + 4, ax + 24, 158)  # piers
    arches = np.zeros((H, W), bool)
    for ax in range(4, 206, 26):
        arches |= c.ell(ax - 4, deck_y - 2, ax + 18, deck_y + 22) & (c.yy > deck_y + 2)
    c.solid(bridge & ~arches, sand, 3, hl=1, sh=1)
    c.fill(c.rect(0, deck_y - 8, 210, deck_y - 7) & (c.xx % 4 < 2), sand, 4)  # parapet
    reflect(c, bridge & ~arches, 158, wm & (c.yy > 158) & (c.yy < 190), d=-1)
    # a paddle steamer moored at the terrace steps
    c.solid(c.rect(260, 150, 330, 158), c.R('steamhull', '#E8E4DA'), 5, hl=1, sh=1)
    c.solid(c.ell(286, 142, 302, 158), c.R('paddlebox', '#D8D0C0'), 4, hl=1, sh=1)
    c.fill(c.rect(296, 130, 300, 150), c.R('steamfunnel', '#2A2A30'), 2)
    # the near bank (Neustadt side): grass and a path
    bank = c.poly([(0, 196), (W - 1, 186), (W - 1, H - 1), (0, H - 1)])
    c.fill(bank, c.R('grass', '#6E9A48'), 3)
    c.fill(bank & ((c.xx * 7 + c.yy * 3) % 11 == 0), c.R('grass', '#6E9A48'), 4)
    return stage(c, [(rizal_overcoat(g), 40, 212, False)])


# ---------------------------------------------------------------- Berlin: the lodging room, winter
def berlinroom_1886():
    g = grade_fn('#C8D0E0', 0.08, contrast=1.04)
    c = Canvas(W, H, grade=g)
    wall = c.R('wall', '#9A9488')
    floor = c.R('floor', '#6A5440')
    room(c, wall, floor, 168)
    c.fill(c.rect(0, 0, W - 1, 168) & ((c.xx % 16) == 0), wall, 3)  # faded striped paper
    # the window: snow on the roofs across the courtyard, frost in the corners
    wx, wy, ww, wh = 220, 30, 90, 96
    view = c.rect(wx, wy, wx + ww, wy + wh)
    c.gradient(view, c.R('wsky', '#A8B4C4'), 5, 3, wy, wy + wh)
    snowroof = view & (c.yy > wy + 50 + ((c.xx - wx) * 0.3).astype(int))
    c.fill(snowroof, c.R('snow', '#E8ECF0'), 5)
    c.fill(view & (c.yy > wy + 70), c.R('farwall', '#6A6A74'), 3)
    for k in range(6):
        c.fill(c.rect(wx + 8 + k * 14, wy + 74, wx + 12 + k * 14, wy + 80), c.R('farwin', '#3A3A44'), 2)
    frame = c.R('frame', '#E8E4DA')
    c.fill(view & ((c.xx == wx + ww // 2) | (c.yy == wy + wh // 2)), frame, 5)
    c.solid(c.rect(wx - 4, wy - 4, wx + ww + 4, wy - 1) | c.rect(wx - 4, wy + wh + 1, wx + ww + 4, wy + wh + 4), frame, 5, hl=1)
    frost = view & ((np.minimum(c.xx - wx, wx + ww - c.xx) + np.minimum(c.yy - wy, wy + wh - c.yy)) < 10)
    c.dither_adjust(frost, 0.8)
    # the tall tiled stove in the corner (fed sparingly)
    tile = c.R('stovetile', '#C8C0B0')
    stove = c.rect(20, 30, 76, 168)
    c.solid(stove, tile, 4, hl=1, sh=1)
    c.tex(stove, tex_tiles(c, 14, 12, x0=20, y0=30))
    c.solid(c.rect(16, 24, 80, 30), tile, 5, hl=1, sh=1)
    c.fill(c.rect(40, 130, 56, 146), c.R('stovedoor', '#3A3430'), 2)
    c.fill(c.rect(43, 136, 53, 143), c.R('ember', '#C86A2A'), 4)
    # a small table: the manuscript in piles, an inkwell, a candle stub
    wood = c.R('wood', '#5A3E2A')
    table(c, 120, 144, 208, wood, h=26)
    paper = c.R('paper', '#E8E0CC')
    ink = c.R('ink', '#2A2430')
    paper_stack(c, 128, 143, 22, paper, ink, n=5)
    paper_stack(c, 156, 143, 18, paper, ink, n=3)
    c.solid(c.ell(184, 139, 191, 145), ink, 3, hl=1)
    c.solid(c.rect(196, 132, 199, 143), c.R('candle', '#EEE4C8'), 5, hl=1)
    c.fill(c.rect(197, 129, 198, 131), c.R('flame', '#FFF0C0'), 6)
    lamp_glow(c, 198, 132, 60, 0.7)
    chair(c, 104, 168, wood, facing=1)
    # a narrow iron bed with a thin blanket
    iron = c.R('iron', '#2E3038')
    c.fill(c.rect(300, 132, 302, 178) | c.rect(380, 144, 382, 178), iron, 3)
    c.solid(c.rect(302, 152, 380, 164), c.R('blanket', '#6A6E7A'), 3, hl=1, sh=1)
    return stage(c, [(rizal_shirt(g), 214, 204, False)])


# ---------------------------------------------------------------- Leitmeritz: the Blumentritts' table
def blumentritt_1887():
    g = grade_fn('#F0C890', 0.08, contrast=1.04)
    c = Canvas(W, H, grade=g)
    wall = c.R('wall', '#C8B898')
    floor = c.R('floor', '#7A5A3E')
    room(c, wall, floor, 166)
    c.fill(c.rect(0, 112, W - 1, 166), c.R('panel', '#8A6A4A'), 3)
    c.fill(c.rect(0, 112, W - 1, 166) & ((c.xx % 32) == 0), c.R('panel', '#8A6A4A'), 2)
    # a window on the evening town, a framed print, a tiled stove
    view = c.rect(40, 30, 104, 100)
    c.gradient(view, c.R('eve', '#E8B070'), 2, 5, 30, 100)
    c.fill(view & (c.yy > 70), c.R('roofs', '#6A4A44'), 2)
    c.fill(view & ((c.xx == 72) | (c.yy == 64)), c.R('frame', '#E8E0D0'), 5)
    c.solid(c.rect(160, 34, 196, 62), c.R('pframe', '#5A3E2A'), 2, hl=1)
    c.fill(c.rect(164, 38, 192, 58), c.R('print', '#B8A888'), 3)
    stove = c.rect(316, 40, 360, 166)
    c.solid(stove, c.R('stove', '#5E7A6A'), 3, hl=1, sh=1)
    c.tex(stove, tex_tiles(c, 11, 10, x0=316, y0=40))
    # the hanging lamp over the table
    c.fill(c.rect(210, 0, 210, 54), c.R('chain', '#3A3430'), 2)
    c.solid(c.ell(196, 54, 224, 66), c.R('shade', '#E8D8B0'), 5, hl=1, sh=1)
    lamp_glow(c, 210, 70, 140, 0.8)
    # the table: white cloth, plates, glasses, a loaf, a jug
    cloth = c.R('cloth', '#F0EADC')
    t = c.poly([(110, 146), (310, 146), (330, 170), (90, 170)])
    c.solid(t, cloth, 5, hl=1, sh=1)
    c.fill(c.rect(92, 170, 328, 186), cloth, 4)
    c.fill(c.rect(92, 170, 328, 186) & ((c.xx % 10) == 0), cloth, 3)
    plate = c.R('plate', '#FAF8F2')
    for px in (122, 168, 214, 260):
        c.solid(c.ell(px, 152, px + 24, 160), plate, 6, hl=0, sh=1)
        c.solid(c.rect(px + 26, 146, px + 30, 154), c.R('glass', '#C8D8D8'), 5, hl=1)
    c.solid(c.ell(196, 140, 226, 152), c.R('bread', '#B8864A'), 4, hl=1, sh=1)
    c.solid(c.rect(282, 132, 294, 152), c.R('jug', '#7A8AA0'), 4, hl=1, sh=1)
    return stage(c, [(blumentritt(g), 44, 206, False), (rizal_suit(g), 302, 206, True), (viola(g), 340, 206, True)])


# ---------------------------------------------------------------- Rome: the Colosseum, June 1887
def rome_1887():
    g = grade_fn('#FFE8C0', 0.07, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#3A86D0', '#EEF0E8', 120)
    cl = c.R('cloud', colors=[hx(h) for h in CLOUD])
    cloud(c, 290, 16, 80, 16, cl, seed=3)
    trav = c.R('travertine', '#D8C49A')
    shade = c.R('shadow', '#7A6A52')
    far = c.R('fartrees', '#6A8A6A')
    c.fill(c.rect(0, 112, W - 1, 176), far, 3)
    canopy(c, -20, 96, 140, 30, far, seed=21, base=3)
    canopy(c, 300, 98, 110, 28, far, seed=22, base=3)
    # the Colosseum: the full outer wall still stands on the left (north) side, four storeys high;
    # to the right it is broken away and the lower inner rings show
    x0, x1, base = 30, 330, 176
    top = np.full(W, 200.0)
    for x in range(x0, x1):
        t = (x - x0) / (x1 - x0)
        if t < 0.5:
            top[x] = 34 + 6 * (t / 0.5) ** 2
        elif t < 0.62:
            top[x] = 40 + (140 - 40) * ((t - 0.5) / 0.12)  # the sloping buttress
        else:
            top[x] = 140 + 3 * np.sin(x * 0.9)  # only the lowest storey of the outer wall
    body = np.zeros((H, W), bool)
    for x in range(x0, x1):
        body[int(top[x]):base, x] = True
    # the inner ring, lower, behind the break
    inner = np.zeros((H, W), bool)
    for x in range(196, 344):
        inner[92 + int(4 * np.sin(x * 0.15)):base, x] = True
    c.solid(inner & ~body, trav, 3, hl=1, sh=1)
    for y0, y1 in ((100, 130), (136, 168)):  # two storeys of the inner ring's arches
        for ax in range(200, 340, 14):
            c.fill((c.ell(ax, y0, ax + 9, y0 + 9) | c.rect(ax, y0 + 4, ax + 9, y1)) & inner & ~body, shade, 1)
    c.solid(body, trav, 4, hl=1, sh=1)
    c.tex(body, tex_noise(c, 0.08, 0.04, seed=4))
    # three storeys of arches between half-columns, a top storey with small windows
    for k, (y0, y1) in enumerate(((140, 176), (104, 136), (68, 100))):
        for ax in range(x0 + 6, x1 - 10, 20):
            arch = c.ell(ax, y0, ax + 12, y0 + 12) | c.rect(ax, y0 + 6, ax + 12, y1)
            c.fill(arch & body, shade, 1)
            c.fill(c.rect(ax + 15, y0, ax + 16, y1) & body, trav, 5)  # half-columns
        c.fill(c.rect(x0, y1, x1, y1 + 3) & body, trav, 5)  # cornices
    for wx in range(x0 + 10, x1 - 10, 20):
        c.fill(c.rect(wx, 46, wx + 4, 54) & body & (c.yy > top[np.clip(c.xx, 0, W - 1)] + 4), shade, 2)
    # grass and umbrella pines around it
    grass = c.R('grass', '#8AA04E')
    gm = c.rect(0, 176, W - 1, H - 1)
    c.fill(gm, grass, 3)
    c.fill(gm & ((c.xx * 5 + c.yy * 3) % 13 == 0), grass, 4)
    c.fill(c.poly([(150, 216), (230, 216), (210, 176), (180, 176)]), c.R('path', '#C8B48A'), 4)
    pine = c.R('pine', '#3E5E3A')
    bark = c.R('bark', '#5A4232')
    for px, py, w_ in ((350, 120, 60), (-20, 128, 56)):
        trunk(c, px + w_ // 2 - 2, py + 10, 180, 4, bark)
        canopy(c, px, py - 12, w_, 26, pine, seed=px + 50, base=3)
    return stage(c, [(rizal_suit(g, hat='bowler'), 238, 210, False)])


# ---------------------------------------------------------------- London: Chalcot Crescent, 1888
def chalcot_1888():
    g = grade_fn('#D8D8D0', 0.08, contrast=1.02)
    c = Canvas(W, H, grade=g)
    sky(c, '#8A98A8', '#D8DADA', 80)
    gc = c.R('greycloud', colors=[hx(h) for h in GREY_CLOUD])
    cloud(c, 0, 4, 200, 30, gc, seed=2)
    cloud(c, 200, 10, 200, 26, gc, seed=5)
    stucco = c.R('stucco', '#DCD6C8')
    dk = c.R('dk', '#3A3A40')
    glass = c.R('glass', '#5A6470')
    # a terrace of four-storey stucco houses, the crescent curving away to the right
    for k in range(6):
        x0 = k * 66 - 6
        sc = 66 / 64
        top = int(36 + k * 6)
        base = 172
        house = c.rect(x0, top, x0 + int(64 * sc), base)
        c.solid(house, stucco, 4 - (k % 2), hl=1, sh=1)
        c.fill(c.rect(x0, top - 3, x0 + int(64 * sc), top - 1), stucco, 5)  # cornice
        for cx_ in (x0 + 6, x0 + int(50 * sc)):  # chimney stacks with pots
            c.solid(c.rect(cx_, top - 14, cx_ + 8, top - 3), c.R('brick', '#8A5A48'), 3, hl=1, sh=1)
            c.fill(c.rect(cx_ + 1, top - 18, cx_ + 2, top - 14) | c.rect(cx_ + 5, top - 18, cx_ + 6, top - 14), c.R('pot', '#A86A4A'), 3)
        rows = [top + 10, top + 40, top + 70]
        for j, wy in enumerate(rows):
            for wx in (x0 + 8, x0 + int(26 * sc), x0 + int(44 * sc)):
                if wy + 18 > 130:
                    continue
                c.fill(c.rect(wx - 1, wy - 1, wx + 10, wy + 18), stucco, 5)
                c.gradient(c.rect(wx, wy, wx + 9, wy + 17), glass, 4, 1, wy, wy + 17)
                c.fill(c.rect(wx, wy + 8, wx + 9, wy + 8), stucco, 5)  # sash bar
        # the door up its steps, a fanlight above
        dx = x0 + int(44 * sc)
        c.fill(c.rect(dx, 138, dx + 12, 164), dk, 2)
        c.fill(c.ell(dx, 132, dx + 12, 144) & c.rect(0, 0, W - 1, 138), glass, 4)
        for s_ in range(3):
            c.fill(c.rect(dx - 2 - s_ * 2, 164 + s_ * 3, dx + 14 + s_ * 2, 166 + s_ * 3), stucco, 5 - s_)
        c.fill(c.rect(x0 + 6, 140, x0 + 30, 160), c.R('basementwin', '#4A4E58'), 2)
    # iron railings round the basement areas, a gas lamp, the street
    iron = c.R('iron', '#1E1E24')
    c.fill(c.rect(0, 160, W - 1, 172) & (c.xx % 4 == 0), iron, 2)
    c.fill(c.rect(0, 160, W - 1, 160), iron, 2)
    lamp = c.rect(300, 120, 302, 192)
    c.fill(lamp, iron, 2)
    c.solid(c.poly([(295, 112), (307, 112), (304, 122), (298, 122)]), c.R('lampglass', '#E8E0B8'), 4, hl=1)
    street = c.rect(0, 180, W - 1, H - 1)
    c.fill(c.rect(0, 172, W - 1, 180), c.R('pavement', '#9A968E'), 4)
    c.fill(street, c.R('road', '#6A665E'), 3)
    c.tex(street, tex_cobbles(c, y0=180))
    return stage(c, [(rizal_overcoat(g), 228, 204, False)])


# ---------------------------------------------------------------- Ghent: the Graslei, July 1891
def ghent_1891():
    g = grade_fn('#F0E8D8', 0.05, contrast=1.03)
    c = Canvas(W, H, grade=g)
    sky(c, '#6A98C8', '#E4E8EA', 100)
    cl = c.R('cloud', colors=[hx(h) for h in CLOUD])
    cloud(c, 40, 10, 120, 24, cl, seed=6)
    # roofs of the town behind, and towers of the old city (a church tower and the belfry)
    backroofs = c.R('backroofs', '#7A6E68')
    c.fill(c.rect(0, 92, W - 1, 150), backroofs, 3)
    for bx in range(0, W, 22):
        c.fill(c.poly([(bx, 92), (bx + 22, 92), (bx + 11, 80 + (bx * 7) % 9)]), backroofs, 2)
    tower = c.R('tower', '#8A8478')
    for tx, w_, tt in ((300, 16, 14), (346, 12, 24)):
        c.solid(c.rect(tx, tt, tx + w_, 110), tower, 3, hl=1, sh=1)
        c.fill(c.poly([(tx - 2, tt), (tx + w_ + 2, tt), (tx + w_ // 2, tt - 16)]), c.R('spire', '#5A5E5A'), 2)
    # the guild houses on the quay: tall, narrow, stepped gables, each a different stone
    colors = ['#B8A68A', '#9A9488', '#C8B08A', '#A89070', '#D0C0A0', '#8E8A82', '#BCA684']
    glass = c.R('glass', '#3A4450')
    xs = [6, 52, 92, 144, 182, 230, 270, 316]
    fronts = np.zeros((H, W), bool)
    for k in range(len(xs) - 1):
        x0, x1 = xs[k] + 1, xs[k + 1] - 1
        top = 40 + (k * 13) % 30
        rid = c.R(f'guild{k}', colors[k % len(colors)])
        m = stepped_gable(c, x0, x1, 150, top, rid, steps=4 + (k % 2), tone=4)
        c.tex(m, tex_blocks(c, 8, 4, y0=top, seed=k + 2) * (k % 3 == 1))
        windows_grid(c, x0 + 3, x1 - 3, top + 26, 146, 2 if x1 - x0 < 44 else 3, 3, rid, glass, w=6, h=11)
        fronts |= m
    # the quay and the Leie, the houses mirrored in it
    c.solid(c.rect(0, 150, W - 1, 158), c.R('quay', '#8A8478'), 4, hl=1, sh=1)
    river = c.R('leie', '#5A7A78')
    wm = water(c, 158, H - 1, river, seed=4, base=3, top_tone=4)
    reflect(c, fronts, 158, wm & (c.yy < 210), d=-1)
    # a moored barge
    bg = c.poly([(40, 176), (150, 176), (144, 186), (46, 186)])
    c.solid(bg, c.R('barge', '#3A3430'), 3, hl=1, sh=1)
    c.fill(c.rect(60, 170, 120, 176), c.R('cargo', '#8A6A4A'), 3)
    quay = c.R('nearquay', '#8A8478')
    c.solid(c.rect(0, 198, W - 1, H - 1), quay, 4, hl=1, sh=1)
    c.tex(c.rect(0, 198, W - 1, H - 1), tex_blocks(c, 18, 6, y0=198, seed=31))
    return stage(c, [(alejandrino(g), 250, 212, False), (rizal_suit(g, hat='bowler'), 288, 212, False)])


# ---------------------------------------------------------------- Montjuïc above Barcelona, Oct 1896
def montjuic_1896():
    g = grade_fn('#F0E4D0', 0.06, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#5A90C8', '#ECE6DC', 120)
    cl = c.R('cloud', colors=[hx(h) for h in CLOUD])
    cloud(c, 30, 20, 90, 18, cl, seed=8)
    # the hill of Montjuïc rising steeply from the harbour, the castle's low walls on top
    # the Collserola hills behind the city
    ridge(c, c.R('collserola', '#8A9AA8'), 118, 20, 0.02, seed=3, tone=4, y_max=150)
    hill = c.R('hill', '#7A8A5A')
    xs = np.arange(W)
    hy = np.full(W, 150.0)
    for x in range(W):
        if x < 180:
            hy[x] = 150 - 40 * np.exp(-((x - 180) / 60.0) ** 2)
        elif x < 330:
            hy[x] = 64 + 4 * np.sin(x * 0.05)  # the plateau
            if x < 220:
                hy[x] = 110 - (110 - 64) * (x - 180) / 40.0
        else:
            hy[x] = 64 + (x - 330) * 1.6  # steep toward the sea
    hm = np.zeros((H, W), bool)
    for x in range(W):
        hm[int(hy[x]):150, x] = True
    c.solid(hm, hill, 3, hl=1, sh=0)
    c.fill(hm & ((c.xx * 3 + c.yy * 7) % 11 == 0), hill, 4)
    cliff = hm & (c.xx > 330) & (c.yy > np.broadcast_to(hy[None, :] + 4, (H, W)))
    c.fill(cliff, c.R('rockface', '#A89878'), 3)
    c.fill(cliff & ((c.xx + c.yy * 3) % 5 == 0), c.R('rockface', '#A89878'), 2)
    stone = c.R('stone', '#B8A888')
    fort = np.zeros((H, W), bool)
    for x0, x1 in ((236, 316),):
        fort |= c.rect(x0, 52, x1, 64)
        for bx in (x0, (x0 + x1) // 2, x1):  # pointed bastions
            fort |= c.poly([(bx - 8, 64), (bx + 8, 64), (bx, 54)]) | c.poly([(bx - 6, 52), (bx + 6, 52), (bx, 46)])
    c.solid(fort, stone, 4, hl=1, sh=1)
    c.fill(c.rect(236, 51, 316, 51) & (c.xx % 4 < 2), stone, 5)
    c.solid(c.rect(270, 40, 282, 52), stone, 4, hl=1, sh=1)  # the inner keep
    c.fill(c.rect(275, 30, 275, 40), c.R('pole', '#3A3430'), 2)
    c.fill(c.rect(276, 30, 284, 31) | c.rect(276, 34, 284, 35), c.R('flagred', '#B8302A'), 3)
    c.fill(c.rect(276, 32, 284, 33), c.R('flaggold', '#E8C040'), 4)
    # the city along the shore to the left
    city = c.R('city', '#C8B89A')
    rng = np.random.default_rng(2)
    for x in range(0, 200, 10):
        h_ = int(rng.integers(8, 24))
        c.solid(c.rect(x, 140 - h_, x + 9, 150), city, 3 + int(rng.integers(0, 2)), hl=1, sh=1)
        c.fill(c.rect(x + 2, 144 - h_, x + 7, 146) & (c.yy % 4 == 0) & (c.xx % 2 == 0), c.R('cwin', '#5A4A3E'), 2)
    # the harbour: a mole, ships at anchor
    sea = c.R('sea', '#3E7AA8')
    wm = water(c, 150, H - 1, sea, seed=7, base=3, top_tone=4)
    c.solid(c.rect(0, 168, 220, 172), c.R('mole', '#A89C88'), 4, hl=1, sh=1)
    for sx, sl in ((40, 90), (230, 110)):
        sm = steamer(c, sx, 194 if sx > 100 else 164, sl, c.R('hull', '#24242C'), c.R('upper', '#E6E0D2'),
                     c.R('funnel', '#2A2A30'), c.R('mast', '#3A3430'), funnels=1, masts=2)
    return c.render()


SCENES = {
    'suez_1882': suez_1882,
    'chateaudif_1882': chateaudif_1882,
    'lunastudio_1885': lunastudio_1885,
    'eyeclinic_1886': eyeclinic_1886,
    'dresden_1886': dresden_1886,
    'berlinroom_1886': berlinroom_1886,
    'blumentritt_1887': blumentritt_1887,
    'rome_1887': rome_1887,
    'chalcot_1888': chalcot_1888,
    'ghent_1891': ghent_1891,
    'montjuic_1896': montjuic_1896,
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
        contact(paths[i:i + 4], f'out/sheet_eu_{i // 4}.png')
