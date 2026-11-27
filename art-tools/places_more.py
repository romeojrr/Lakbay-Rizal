"""v2.4 story pictures for the stops that had none yet, each with the people the paragraph puts there.

  ateneo_class_1872    Ateneo 1872, ch.2–3: his first class with Father Bech; the two rival
                       "empires" of the class (two banners, no names written on them)
  madrid_banquet_1884  Madrid 1882, ch.4: the banquet of 25 June 1884 for Luna and Hidalgo, Rizal
                       giving the main speech (the restaurant is not named, so none is drawn)
  vicarage_1886        Wilhelmsfeld 1886, ch.3: writing the last chapters of the Noli in the vicarage
  luna_fencing_1889    Paris 1889, ch.4: Sunday fencing at Juan Luna's house, Nellie Boustead his
                       opponent, Luna looking on
  calamba_1891         Brussels 1890, ch.3: Calamba after the evictions of 1890–91: houses torn
                       down, no one left. No soldiers and no violence shown; Rizal was in Europe.
  eliada_1891          Biarritz 1891, ch.3: finishing El Filibusterismo at the Villa Eliada, the
                       Atlantic outside the window

Run: python places_more.py  → out/scene_<name>.png, out/prev_<name>.png, out/sheet_more_*.png
"""
import numpy as np
from PIL import Image
from artkit import Canvas, hx, tex_noise, tex_blocks, tex_planks_h, tex_planks_v, tex_tiles, tex_thatch
from common import W, H, grade_fn, sky, cloud, ridge, canopy, trunk, palm, lamp_glow, shadow
from kit2 import table, chair, bookshelf, paper_stack, water
from places_kit import room, contact
from places_cast import *
import chars

CLOUD = ['#8FA8C0', '#AFC3D4', '#CCDAE4', '#E2EAEF', '#F1F4F5', '#FAFBFA', '#FFFFFF']
GREY_CLOUD = ['#7A808A', '#8E949C', '#A2A8AE', '#B6BABE', '#C8CACC', '#D8DADA', '#E8E8E8']


def window_view(c, x, y, w, h, frame_rid, paint):
    """A window: `paint(mask)` draws what is outside; then the frame and its bars."""
    m = c.rect(x, y, x + w, y + h)
    paint(m)
    c.fill(m & ((c.xx == x + w // 2) | (c.yy == y + h // 2)), frame_rid, 4)
    c.solid(c.rect(x - 4, y - 4, x + w + 4, y - 1) | c.rect(x - 4, y + h + 1, x + w + 4, y + h + 5)
            | c.rect(x - 4, y, x - 1, y + h) | c.rect(x + w + 1, y, x + w + 4, y + h), frame_rid, 4, hl=1, sh=1)
    return m


# ---------------------------------------------------------------- the Ateneo classroom, 1872
def ateneo_class_1872():
    g = grade_fn('#FFF0D8', 0.05, contrast=1.04)
    c = Canvas(W, H, grade=g)
    wall = c.R('lime', '#E6DCC6')
    floor = c.R('floor', '#8A6A4A')
    room(c, wall, floor, 168)
    wood = c.R('narra', '#5A3A26')
    c.fill(c.rect(0, 0, W - 1, 12), wood, 2)  # ceiling beams
    for bx in range(0, W, 40):
        c.solid(c.rect(bx, 0, bx + 8, 14), wood, 3, hl=1, sh=1)
    # tall windows with capiz panes half open on the bright street
    capiz = c.R('capiz', '#E8E0C8')
    for wx in (20, 300):
        view = c.rect(wx, 30, wx + 60, 120)
        c.gradient(view, c.R('daylight', '#BCD8EC'), 5, 4, 30, 120)
        half = c.rect(wx + 30, 30, wx + 60, 120)
        c.fill(half, capiz, 4)
        c.fill(half & (((c.xx - wx) % 4 == 0) | ((c.yy - 30) % 4 == 0)), wood, 2)
        c.solid(c.rect(wx - 4, 26, wx + 64, 29) | c.rect(wx - 4, 121, wx + 64, 125), wood, 3, hl=1, sh=1)
    # the blackboard, a crucifix, and the two banners of the rival "empires"
    c.solid(c.rect(122, 44, 262, 104), c.R('board', '#2E3A34'), 2, hl=1, sh=1)
    c.fill(c.rect(118, 104, 266, 107), wood, 3)
    c.fill(c.line([(134, 60), (170, 60)]) | c.line([(134, 70), (190, 70)]) | c.line([(134, 80), (160, 80)]), c.R('chalk', '#D8DED8'), 4)
    c.solid(c.rect(190, 22, 193, 40) | c.rect(184, 27, 199, 29), wood, 3, hl=1, sh=1)
    for bx, col in ((98, '#A8302A'), (274, '#2E4A8A')):
        b = c.poly([(bx, 30), (bx + 18, 30), (bx + 18, 64), (bx + 9, 58), (bx, 64)])
        c.solid(b, c.R(f'banner{bx}', col), 3, hl=1, sh=1)
        c.fill(c.rect(bx - 2, 28, bx + 20, 29), c.R('rod', '#B89A4A'), 4)
    # the teacher's raised desk and rows of benches
    c.solid(c.rect(30, 150, 100, 172), wood, 3, hl=1, sh=1)
    c.solid(c.rect(24, 146, 106, 150), wood, 4, hl=1)
    for k, y in enumerate((158, 170)):
        c.solid(c.rect(150 + k * 6, y, 384, y + 4), wood, 4, hl=1, sh=1)
        for lx in range(160 + k * 6, W, 60):
            c.fill(c.rect(lx, y + 4, lx + 2, y + 16), wood, 2)
    pa = chars.child(scale='boy', skin='brown', shirt='#F0EADC', shorts='#2E3446', barefoot=False, grade=g)
    pb = chars.child(scale='boy', skin='fair', shirt='#F0EADC', shorts='#2E3446', barefoot=False, grade=g)
    return stage(c, [(jesuit(g), 112, 206, False), (pa, 196, 208, False), (jose_boy(g, books=True), 232, 208, False),
                     (pb, 268, 208, False)])


# ---------------------------------------------------------------- the banquet, Madrid, 25 June 1884
def madrid_banquet_1884():
    g = grade_fn('#F0C890', 0.08, contrast=1.05)
    c = Canvas(W, H, grade=g)
    wall = c.R('damask', '#7A2E2E')
    floor = c.R('parquet', '#7A5236')
    room(c, wall, floor, 166)
    c.fill(c.rect(0, 0, W - 1, 166) & ((c.xx + c.yy) % 6 == 0), wall, 3)
    gilt = c.R('gilt', '#C8A048')
    # gilt-framed mirrors, a chandelier
    for mx in (40, 280):
        c.solid(c.rect(mx, 24, mx + 64, 104), gilt, 4, hl=1, sh=1)
        c.gradient(c.rect(mx + 5, 29, mx + 59, 99), c.R('mirror', '#9AA8B0'), 5, 3, 29, 99)
    c.fill(c.rect(191, 0, 192, 20), gilt, 3)
    c.solid(c.ell(170, 20, 214, 34), gilt, 4, hl=1, sh=1)
    for cx_ in range(174, 212, 8):
        c.fill(c.rect(cx_, 14, cx_ + 1, 20), c.R('candle', '#F0E6C8'), 5)
        c.fill(c.rect(cx_, 12, cx_ + 1, 13), c.R('flame', '#FFF0C0'), 6)
    lamp_glow(c, 192, 40, 160, 0.8)
    # the long table behind them: white cloth, glasses, candelabra
    cloth = c.R('cloth', '#F2ECDE')
    c.solid(c.rect(0, 140, W - 1, 168), cloth, 5, hl=1, sh=1)
    c.fill(c.rect(0, 156, W - 1, 168) & ((c.xx % 12) == 0), cloth, 4)
    for gx in range(12, W, 26):
        c.solid(c.rect(gx, 130, gx + 3, 140), c.R('glass', '#C8D8DC'), 5, hl=1)
    for cx_ in (60, 324):
        c.fill(c.rect(cx_, 112, cx_ + 2, 140), gilt, 4)
        c.fill(c.rect(cx_ - 8, 112, cx_ + 10, 114), gilt, 4)
        for fx in (cx_ - 8, cx_, cx_ + 9):
            c.fill(c.rect(fx, 106, fx + 1, 111), c.R('candle', '#F0E6C8'), 5)
    return stage(c, [(luna(g), 120, 210, False), (rizal_suit(g, holding='sheet'), 176, 212, False),
                     (hidalgo(g), 232, 210, False)])


# ---------------------------------------------------------------- the vicarage, Wilhelmsfeld, 1886
def vicarage_1886():
    g = grade_fn('#F4E8D0', 0.05, contrast=1.04)
    c = Canvas(W, H, grade=g)
    wall = c.R('plaster', '#E2D8C2')
    floor = c.R('boards', '#8A6646')
    room(c, wall, floor, 170)
    oak = c.R('oak', '#5A3E28')
    # the timber frame of an Odenwald house, inside
    for bx in (0, 112, 250, 376):
        c.solid(c.rect(bx, 0, bx + 8, 170), oak, 3, hl=1, sh=1)
    c.solid(c.rect(0, 0, W - 1, 8), oak, 2, hl=1, sh=1)
    c.fill(c.line([(120, 130), (170, 170)], w=3) | c.line([(250, 130), (200, 170)], w=3), oak, 3)
    # the window on spring hills and woods
    def outside(m):
        c.gradient(m, c.R('spring', '#9AC0E0'), 5, 4, 34, 110)
        c.fill(m & (c.yy > 80 + ((c.xx - 140) * 0.12).astype(int)), c.R('woods', '#5E8A4A'), 3)
        c.fill(m & (c.yy > 96), c.R('meadow', '#8AB45A'), 4)
    window_view(c, 140, 34, 90, 76, c.R('frame', '#F0EBE0'), outside)
    bookshelf(c, 20, 40, 100, 168, oak, seed=3)
    # the writing table: the manuscript, an inkwell, an oil lamp
    table(c, 150, 144, 270, oak, h=26)
    paper = c.R('paper', '#EEE6D2')
    ink = c.R('ink', '#2A2430')
    paper_stack(c, 162, 143, 30, paper, ink, n=6)
    paper_stack(c, 200, 143, 22, paper, ink, n=2)
    c.solid(c.ell(230, 139, 237, 145), ink, 3, hl=1)
    c.solid(c.rect(246, 128, 252, 143), c.R('lampglass', '#E8E0B8'), 5, hl=1, sh=1)
    return stage(c, [(rizal_shirt(g), 282, 206, False)])


# ---------------------------------------------------------------- fencing at Juan Luna's, 1889
def luna_fencing_1889():
    g = grade_fn('#F0E4D0', 0.05, contrast=1.04)
    c = Canvas(W, H, grade=g)
    wall = c.R('wall', '#C8B89A')
    floor = c.R('floor', '#8A6646')
    room(c, wall, floor, 168)
    frame = c.R('frame', '#8A6A3A')
    # paintings on the walls (shown as dark canvases in their frames), tall windows
    for px, py, w_, h_ in ((20, 40, 60, 44), (100, 30, 40, 56), (300, 36, 66, 48)):
        c.solid(c.rect(px, py, px + w_, py + h_), frame, 4, hl=1, sh=1)
        c.fill(c.rect(px + 4, py + 4, px + w_ - 4, py + h_ - 4), c.R(f'paint{px}', '#5A4A3A'), 3)
        c.fill(c.rect(px + 4, py + h_ // 2, px + w_ - 4, py + h_ - 4), c.R(f'paint{px}', '#5A4A3A'), 2)
    for wx in (160, 228):
        c.gradient(c.rect(wx, 24, wx + 40, 120), c.R('paris', '#B8C8D4'), 5, 3, 24, 120)
        c.fill(c.rect(wx, 24, wx + 40, 120) & ((c.xx == wx + 20) | ((c.yy - 24) % 24 == 0)), c.R('mull', '#EEE8DC'), 5)
    # a rack of foils and masks
    steel = c.R('steel', '#A8AEB8')
    for k in range(4):
        c.fill(c.line([(332 + k * 6, 130), (336 + k * 6, 166)]), steel, 5)
    c.solid(c.rect(326, 126, 362, 130), frame, 3, hl=1)
    img = stage(c, [(rizal_suit(g), 128, 206, False), (nellie(g), 214, 206, True), (luna(g), 290, 206, False)])
    # the two foils, crossed between them
    foil(img, 158, 160, 200, 150)
    foil(img, 218, 160, 176, 150)
    return img


# ---------------------------------------------------------------- Calamba after the evictions
def calamba_1891():
    g = grade_fn('#C8C8C0', 0.12, contrast=1.0)
    c = Canvas(W, H, grade=g)
    sky(c, '#8A98A8', '#DCDCD4', 110)
    gc = c.R('greycloud', colors=[hx(h) for h in GREY_CLOUD])
    cloud(c, 0, 10, 180, 30, gc, seed=3)
    cloud(c, 200, 20, 200, 26, gc, seed=7)
    ridge(c, c.R('makiling', '#6E7E80'), 108, 44, 0.012, seed=3, tone=4, peaks=((250, 24, 46), (300, 18, 30)), y_max=124)
    fields = c.R('cane', '#8A9A5A')
    c.fill(c.rect(0, 116, W - 1, 150), fields, 3)
    c.fill(c.rect(0, 116, W - 1, 150) & ((c.xx * 3 + c.yy * 5) % 7 == 0), fields, 4)
    ground = c.R('earth', '#9A8A6A')
    gm = c.rect(0, 150, W - 1, H - 1)
    c.fill(gm, ground, 3)
    c.tex(gm, tex_noise(c, 0.08, 0.05, seed=4))
    # what is left of the houses: bare posts, broken stone walls, fallen thatch and tiles
    post = c.R('post', '#5A4A38')
    for x0 in (40, 250):
        for px in (x0, x0 + 30, x0 + 60):
            c.solid(c.rect(px, 112 + (px % 7), px + 4, 176), post, 2, hl=1, sh=1)
        c.fill(c.line([(x0, 130), (x0 + 30, 140)], w=2), post, 2)
    stone = c.R('stone', '#A8A090')
    wallm = c.poly([(130, 176), (130, 140), (146, 132), (162, 146), (178, 128), (200, 142), (214, 136), (222, 176)])
    c.solid(wallm, stone, 4, hl=1, sh=1)
    c.tex(wallm, tex_blocks(c, 12, 6, y0=128, seed=8))
    c.fill(c.rect(160, 152, 176, 176), c.R('gap', '#3A3430'), 2)  # an empty doorway
    thatch = c.R('thatch', '#8A7048')
    for x0, w_ in ((30, 90), (240, 100)):
        heap = c.poly([(x0, 186), (x0 + w_ // 3, 172), (x0 + w_, 178), (x0 + w_ + 6, 190)])
        c.fill(heap, thatch, 3)
        c.tex(heap, tex_thatch(c, x0=x0, y0=170, seed=x0))
    tiles = c.R('tiles', '#9A5A40')
    rng = np.random.default_rng(5)
    for k in range(40):
        x_, y_ = int(rng.integers(120, 240)), int(rng.integers(180, 206))
        c.fill(c.rect(x_, y_, x_ + 3, y_ + 1), tiles, 3 + int(rng.integers(0, 2)))
    return c.render()


# ---------------------------------------------------------------- the Villa Eliada, March 1891
def eliada_1891():
    g = grade_fn('#F4ECDC', 0.04, contrast=1.04)
    c = Canvas(W, H, grade=g)
    wall = c.R('wall', '#E8E0D0')
    floor = c.R('floor', '#8A6A4A')
    room(c, wall, floor, 170)
    c.fill(c.rect(0, 120, W - 1, 170), c.R('wainscot', '#B8A88A'), 3)
    c.fill(c.rect(0, 119, W - 1, 120), c.R('wainscot', '#B8A88A'), 5)
    # the tall window on the Atlantic: grey-blue sea, white breakers, a pale winter sky
    def outside(m):
        c.gradient(m, c.R('wintersky', '#A8BCD0'), 5, 4, 20, 80)
        sea = m & (c.yy >= 80)
        c.gradient(sea, c.R('atlantic', '#3E6A8A'), 3, 2, 80, 140)
        c.fill(sea & ((c.yy - 80) % 9 == 0) & ((c.xx * 7 + c.yy) % 5 < 3), c.R('foam', '#F0F2F2'), 5)
    window_view(c, 220, 20, 120, 120, c.R('frame', '#F4F0E8'), outside)
    # the writing desk: the finished manuscript, an inkwell, a lamp
    wood = c.R('desk', '#5A3E2A')
    table(c, 60, 143, 190, wood, h=28)
    paper = c.R('paper', '#EEE6D2')
    ink = c.R('ink', '#2A2430')
    paper_stack(c, 74, 141, 34, paper, ink, n=7)
    c.solid(c.ell(118, 137, 125, 143), ink, 3, hl=1)
    c.solid(c.rect(160, 120, 168, 141), c.R('lampglass', '#E8E0B8'), 5, hl=1, sh=1)
    c.solid(c.rect(158, 141, 170, 143), c.R('brass', '#B8923E'), 4, hl=1)
    chair(c, 40, 170, wood, facing=1)
    return stage(c, [(rizal_suit(g, holding='sheet'), 196, 206, False)])


SCENES = {
    'ateneo_class_1872': ateneo_class_1872,
    'madrid_banquet_1884': madrid_banquet_1884,
    'vicarage_1886': vicarage_1886,
    'luna_fencing_1889': luna_fencing_1889,
    'calamba_1891': calamba_1891,
    'eliada_1891': eliada_1891,
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
        contact(paths[i:i + 4], f'out/sheet_more_{i // 4}.png')
