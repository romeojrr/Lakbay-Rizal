"""v2.4 story pictures in Asia and America (no people; see places_kit.py).

  deck_1888        Japan 1888 ch.4 (the Belgic), USA 1888 ch.4 (the City of Rome), Ghent 1891 ch.4
                   (the Melbourne): on the deck of a mail steamer at sea. Nothing on it names a ship.
  sfbay_1888       USA 1888, ch.1: held in quarantine in San Francisco Bay (28 April – 4 May 1888).
                   No Ferry Building (1898) and no Golden Gate Bridge (1937).
  niagara_1888     USA 1888, ch.2: the Horseshoe Falls at Niagara (May 1888)
  sandakan_1892    Hong Kong 1891, ch.3: Sandakan, British North Borneo (March 1892)

Run: python places_asia_america.py  → out/scene_<name>.png, out/prev_<name>.png, out/sheet_aa_*.png
"""
import numpy as np
from PIL import Image
from artkit import Canvas, BAYER, hx, tex_noise, tex_planks_h, tex_planks_v, tex_thatch, tex_blocks
from common import W, H, grade_fn, sky, cloud, ridge, canopy, trunk, palm, shadow
from kit2 import water, reflect
from places_kit import steamer, contact

CLOUD = ['#8FA8C0', '#AFC3D4', '#CCDAE4', '#E2EAEF', '#F1F4F5', '#FAFBFA', '#FFFFFF']


# ---------------------------------------------------------------- on deck at sea
def deck_1888():
    g = grade_fn('#FFF4E0', 0.04, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#3A7CC4', '#DDEAF0', 120)
    cl = c.R('cloud', colors=[hx(h) for h in CLOUD])
    cloud(c, 60, 30, 110, 26, cl, seed=3)
    cloud(c, 250, 50, 90, 18, cl, seed=7)
    sea = c.R('sea', '#2E6A9A')
    wm = water(c, 120, 170, sea, seed=4, base=3, top_tone=4)
    c.fill(c.rect(0, 120, W - 1, 120), sea, 5)
    # the deck: looking out over the side, the planks run along the ship, parallel to the rail,
    # their seams spreading wider as they come nearer
    teak = c.R('teak', '#B89068')
    dm = c.rect(0, 172, W - 1, H - 1)
    c.fill(dm, teak, 4)
    y, gap = 174.0, 2.0
    k = 0
    while y < H:
        c.fill(c.rect(0, int(y), W - 1, int(y)), teak, 3)
        off = (k * 53) % 97
        for bx in range(off, W, 97):  # butt joints, staggered
            c.fill(c.rect(bx, int(y - gap) + 1, bx, int(y) - 1), teak, 3)
        y += gap
        gap *= 1.28
        k += 1
    c.fill(dm & ((c.xx * 5 + c.yy * 3) % 17 == 0), teak, 5)
    # the bulwark rail with its stanchions, the sea beyond
    wood = c.R('rail', '#6A4A2E')
    c.solid(c.rect(0, 150, W - 1, 154), wood, 4, hl=1, sh=1)
    for px in range(0, W, 24):
        c.solid(c.rect(px, 154, px + 2, 172), wood, 3, hl=1, sh=1)
    c.fill(c.rect(0, 162, W - 1, 162), wood, 2)
    # a lifeboat slung from curved davits over the rail (left)
    boat = c.R('lifeboat', '#E8E4DA')
    cover = c.R('cover', '#C8BCA0')
    hull = c.poly([(22, 106), (130, 106), (122, 116), (108, 124), (44, 124), (30, 116)])
    c.solid(hull, boat, 5, hl=1, sh=1)
    c.fill(c.rect(22, 106, 130, 107), c.R('gunwale', '#5A4A3A'), 3)
    top = c.ell(26, 98, 126, 114) & c.rect(0, 0, W - 1, 106)
    c.solid(top, cover, 4, hl=1, sh=1)
    davit = c.R('davit', '#3A3A40')
    for dx, dirn in ((34, -1), (118, 1)):
        c.fill(c.line([(dx, 150), (dx, 92)], w=2), davit, 3)
        c.fill(c.line([(dx, 92), (dx + 6 * dirn, 86), (dx + 12 * dirn, 88)], w=2), davit, 3)
        c.fill(c.line([(dx + 12 * dirn, 88), (dx + 12 * dirn, 104)]), c.R('fall', '#6A5A48'), 2)
    vent = c.R('vent', '#E2DED4')
    c.solid(c.rect(250, 130, 258, 172), vent, 5, hl=1, sh=1)
    c.solid(c.ell(242, 118, 266, 138), vent, 5, hl=1, sh=1)
    c.fill(c.ell(248, 122, 262, 134), c.R('ventin', '#8A2E2A'), 3)
    mast = c.R('mast', '#8A6A4A')
    c.solid(c.rect(334, 0, 342, 172), mast, 4, hl=1, sh=1)
    rope = c.R('rope', '#4A3E30')
    for ax in (300, 372):
        c.fill(c.line([(338, 0), (ax, 150)]), rope, 2)
    c.fill(c.line([(338, 20), (W - 1, 60)]), rope, 2)
    c.dither_adjust(c.rect(0, 172, W - 1, 180), -0.5)  # the rail's shadow
    return c.render()


# ---------------------------------------------------------------- San Francisco Bay, 1888
def sfbay_1888():
    g = grade_fn('#E8ECF0', 0.08, contrast=1.02)
    c = Canvas(W, H, grade=g)
    sky(c, '#7EA6C8', '#E6ECEE', 110)
    fog = c.R('fog', colors=[hx(h) for h in ['#A8B4BE', '#BCC6CE', '#CED6DC', '#DEE4E8', '#EAEEF0', '#F4F6F6', '#FFFFFF']])
    cloud(c, -20, 52, 170, 30, fog, seed=2)
    cloud(c, 230, 46, 180, 34, fog, seed=4)
    # the city's hills (Telegraph Hill, Russian Hill, Nob Hill) covered in low wooden houses
    hill = c.R('hill', '#8A9A7A')
    hm, yv = ridge(c, hill, 116, 40, 0.018, seed=5, tone=4, peaks=((90, 18, 30), (170, 22, 36), (250, 12, 30)), y_max=124)
    house = c.R('houses', '#D8D0C0')
    roof = c.R('roofs', '#8A6A5A')
    rng = np.random.default_rng(6)
    for x in range(4, W - 6, 6):
        y = int(yv[x]) + int(rng.integers(3, 18))
        if y > 118:
            continue
        c.fill(c.rect(x, y, x + 3, min(y + 3, 120)), house, 4 + int(rng.integers(0, 2)))
        c.fill(c.rect(x, y - 1, x + 3, y - 1), roof, 3)
    for sx in (150, 206, 300):  # church spires
        y = int(yv[sx]) + 4
        c.fill(c.rect(sx, y - 10, sx + 2, y + 4), house, 5)
        c.fill(c.poly([(sx - 1, y - 10), (sx + 3, y - 10), (sx + 1, y - 18)]), roof, 2)
    # the waterfront: wharves on piles
    c.fill(c.rect(0, 120, W - 1, 124), c.R('wharf', '#6A5A4A'), 3)
    c.fill(c.rect(0, 124, W - 1, 126) & (c.xx % 4 == 0), c.R('wharf', '#6A5A4A'), 2)
    bay = c.R('bay', '#5A7A8A')
    wm = water(c, 126, H - 1, bay, seed=8, base=3, top_tone=4)
    # sailing ships at anchor, masts against the city
    for sx, h_ in ((40, 40), (310, 46)):
        hull = c.poly([(sx, 140), (sx + 44, 140), (sx + 40, 146), (sx + 4, 146)])
        c.solid(hull, c.R('shiphull', '#2A2A30'), 2, hl=1, sh=1)
        for mx in (sx + 10, sx + 22, sx + 34):
            c.fill(c.rect(mx, 140 - h_, mx, 140), c.R('spar', '#3A3430'), 2)
            for yy in (140 - h_ + 6, 140 - h_ + 16, 140 - h_ + 26):
                c.fill(c.rect(mx - 5, yy, mx + 5, yy), c.R('spar', '#3A3430'), 2)
    # our ship's rail and a stanchion in the foreground: we are held out here
    rail = c.R('rail', '#6A4A2E')
    c.solid(c.rect(0, 186, W - 1, 190), rail, 4, hl=1, sh=1)
    for px in range(10, W, 40):
        c.solid(c.rect(px, 190, px + 2, H - 1), rail, 3, hl=1, sh=1)
    c.fill(c.rect(0, 202, W - 1, 202), rail, 2)
    c.fill(c.rect(0, 191, W - 1, H - 1) & ~(c.rect(0, 191, W - 1, H - 1) & wm) & (c.yy > 214), rail, 2)
    return c.render()


# ---------------------------------------------------------------- Niagara Falls, May 1888
def niagara_1888():
    g = grade_fn('#F4F0E4', 0.04, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#4A8ACC', '#E4EEF0', 96)
    cl = c.R('cloud', colors=[hx(h) for h in CLOUD])
    cloud(c, 230, 14, 100, 20, cl, seed=5)
    # far bank and the trees of Goat Island beyond the crest
    leaf = c.R('trees', '#4E7A44')
    c.fill(c.rect(0, 70, W - 1, 92), leaf, 2)
    canopy(c, 60, 56, 120, 26, leaf, seed=2, base=3)
    canopy(c, 210, 54, 130, 28, leaf, seed=4, base=3)
    # the Horseshoe Falls: a curved crest, deepest in the middle, far across the gorge
    xs = np.arange(W)
    crest = 84 + 18 * ((xs - 192) / 130.0) ** 2
    fall = np.zeros((H, W), bool)
    for x in range(W):
        fall[int(crest[x]):150, x] = True
    green = c.R('falls', colors=[hx(h) for h in ['#2E5A5A', '#3E7A72', '#5E9A8A', '#8ABEAE', '#B8DCD0', '#DCEEE8', '#FFFFFF']])
    c.fill(fall, green, 3)
    # falling water: vertical streaks, green at the lip, breaking white as it drops
    rng = np.random.default_rng(3)
    for x in range(W):
        if rng.random() < 0.55:
            y0 = int(crest[x]) + int(rng.integers(2, 12))
            L = int(rng.integers(8, 40))
            c.adjust(c.rect(x, y0, x, y0 + L) & fall, 1 + int(rng.random() < 0.3))
    c.fill(fall & (c.yy <= np.broadcast_to(crest[None, :] + 2, (H, W))), green, 2)
    c.dither_adjust(fall & (c.yy > 112), np.clip((c.yy - 112) / 30.0, 0, 1))
    c.dither_adjust(fall & (c.yy > 128), np.clip((c.yy - 128) / 20.0, 0, 1))
    # the river below: green water flecked with foam
    river = c.R('river', '#3E7A7A')
    wm = water(c, 150, H - 1, river, seed=6, base=3, top_tone=5)
    foam = np.random.default_rng(11).random((H, W)) < 0.025 * np.clip((216 - c.yy) / 66.0, 0, 1)
    c.fill(wm & foam, green, 6)
    # the gorge walls in front, layered rock, closing in from both sides
    rock = c.R('rock', '#7A6E62')
    left = c.poly([(0, 60), (70, 92), (96, 150), (60, 216), (0, 216)])
    right = c.poly([(W - 1, 64), (316, 94), (290, 150), (330, 216), (W - 1, 216)])
    for m in (left, right):
        c.solid(m, rock, 3, hl=1, sh=1)
        c.fill(m & ((c.yy % 7) == 0), rock, 2)  # the strata
        c.fill(m & ((c.yy % 7) == 3) & ((c.xx * 3) % 5 == 0), rock, 4)
    canopy(c, -20, 40, 110, 30, leaf, seed=7, base=3)
    canopy(c, 300, 44, 110, 30, leaf, seed=9, base=3)
    # spray rising from the foot of the falls, thin enough to see through
    mist = c.ell(70, 112, 320, 176) & ~(left | right)
    c.dither_adjust(mist, 0.75)
    c.dither_adjust(c.ell(120, 120, 270, 166) & ~(left | right), 0.6)
    return c.render()


# ---------------------------------------------------------------- Sandakan, March 1892
def sandakan_1892():
    g = grade_fn('#FFF0D0', 0.05, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#3E86CC', '#E2EEEC', 100)
    cl = c.R('cloud', colors=[hx(h) for h in CLOUD])
    cloud(c, 20, 18, 110, 24, cl, seed=8)
    cloud(c, 280, 30, 80, 16, cl, seed=3)
    # steep forested hills behind the town
    forest = c.R('forest', '#3E6E3E')
    hm, yv = ridge(c, forest, 110, 60, 0.015, seed=9, tone=3, peaks=((120, 18, 50), (300, 14, 60)), y_max=134)
    canopy(c, 20, 48, 120, 40, c.R('forest2', '#4E7E46'), seed=4, base=3)
    canopy(c, 250, 52, 130, 40, c.R('forest2', '#4E7E46'), seed=6, base=3)
    # a few white government buildings on the slope
    white, roof = c.R('white', '#ECE6D8'), c.R('roof', '#8A4A3A')
    for bx, by in ((150, 92), (196, 98), (236, 90)):
        c.solid(c.rect(bx, by, bx + 22, by + 12), white, 5, hl=1, sh=1)
        c.fill(c.poly([(bx - 3, by), (bx + 25, by), (bx + 11, by - 8)]), roof, 3)
        for wx in range(bx + 3, bx + 20, 5):
            c.fill(c.rect(wx, by + 4, wx + 1, by + 8), c.R('win', '#3A3430'), 2)
    # the water village: houses on piles over the bay, joined by plank walks
    bay = c.R('bay', '#3E8AA8')
    wm = water(c, 134, H - 1, bay, seed=5, base=3, top_tone=4)
    post, wall, atap = c.R('post', '#4A3A2A'), c.R('plank', '#9A7A58'), c.R('atap', '#8A7048')
    houses = np.zeros((H, W), bool)
    for k, (hx_, hw, fy) in enumerate(((10, 40, 146), (66, 34, 150), (120, 44, 144), (250, 40, 148), (306, 46, 145))):
        for px in range(hx_ + 2, hx_ + hw, 8):
            c.fill(c.rect(px, fy, px + 1, fy + 18), post, 2)
        body = c.rect(hx_, fy - 18, hx_ + hw, fy)
        c.solid(body, wall, 4, hl=1, sh=1)
        c.fill(body & ((c.xx - hx_) % 4 == 0), wall, 3)
        r = c.poly([(hx_ - 4, fy - 17), (hx_ + hw + 4, fy - 17), (hx_ + hw // 2, fy - 32)])
        c.fill(r, atap, 3)
        c.tex(r, tex_thatch(c, x0=hx_, y0=fy - 32, seed=k + 2))
        houses |= body | r
    walk = c.rect(0, 160, W - 1, 162) & ~c.rect(170, 160, 240, 162)
    c.fill(walk, wall, 3)
    for px in range(0, W, 10):
        c.fill(c.rect(px, 162, px + 1, 170) & ~c.rect(170, 160, 240, 172), post, 2)
    reflect(c, houses, 170, wm & (c.yy > 170) & (c.yy < 200), d=-1)
    # boats in the open water between
    for bx, by in ((176, 186), (60, 200)):
        bn = c.poly([(bx, by), (bx + 40, by), (bx + 36, by + 5), (bx + 4, by + 5)])
        c.solid(bn, c.R('boat', '#6A4A2E'), 3, hl=1, sh=1)
    return c.render()


SCENES = {
    'deck_1888': deck_1888,
    'sfbay_1888': sfbay_1888,
    'niagara_1888': niagara_1888,
    'sandakan_1892': sandakan_1892,
}

if __name__ == '__main__':
    import sys
    names = sys.argv[1:] or list(SCENES)
    for name in names:
        im = SCENES[name]()
        im.save(f'out/scene_{name}.png')
        im.resize((W * 3, H * 3), Image.NEAREST).save(f'out/prev_{name}.png')
        print('ok', name)
    contact([f'out/scene_{n}.png' for n in names], 'out/sheet_aa.png')
