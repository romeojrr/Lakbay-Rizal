"""v2.4 story pictures for the final stop, Bagumbayan (owner, 2026-11-27). Kept sombre (GD-6):
no execution, no soldiers with weapons, no crowd, no celebration.

  walk_1896   ch.1: the early morning walk from Fort Santiago to Bagumbayan, 30 Dec 1896: Rizal in
              his dark suit with his defender, Lt. Luis Taviel de Andrade, and two Jesuit priests,
              along the city walls at first light (the story's own companions)
  paco_1896   ch.3: Paco Cemetery, where his sister Narcisa found the unmarked grave: the round
              walled cemetery with its niches and domed chapel, empty, in a grey morning

(The night before, ch.1 paragraph 3, reuses the Fort Santiago chapel picture.)
Run: python places_bagumbayan.py → out/scene_<name>.png, out/prev_<name>.png, out/sheet_bag.png
"""
import numpy as np
from PIL import Image
import chars
from artkit import Canvas, hx, tex_noise, tex_blocks
from common import W, H, grade_fn, sky, cloud, ridge, canopy, palm
from kit2 import water
from places_kit import contact
from places_cast import stage, rizal_black, jesuit

GREY = ['#7A808A', '#8E949C', '#A2A8AE', '#B6BABE', '#C8CACC', '#D8DADA', '#E8E8E8']


def luis_taviel(g):  # Lt. Luis Taviel de Andrade, his defender: a dark uniform and cap
    return chars.man(skin='fair', hair='#2A2420', coat='sack', coat_col='#2A3042', vest_col='#2A3042',
                     trousers='#2A3042', tie='none', hat='cap', hat_col='#2A3042', grade=g)


def walk_1896():
    g = grade_fn('#C8C8D8', 0.10, contrast=1.02)
    c = Canvas(W, H, grade=g)
    # first light: a pale, quiet sky over the bay
    cols = [hx(h) for h in ['#4A5A7A', '#6A7A94', '#8A96AA', '#A8B0BC', '#C4C6C8', '#DCD4C8', '#EADCC4']]
    c.gradient(c.rect(0, 0, W - 1, 120), c.R('dawn', colors=cols), 0, 6.4, 0, 120)
    ridge(c, c.R('bataan', '#7A8494'), 112, 10, 0.02, seed=4, tone=4, x0=0, x1=180, y_max=120)
    water(c, 112, 140, c.R('bay', '#7A8AA0'), seed=3, base=3, top_tone=5)
    # the old city walls and a bastion on the right, grey stone
    stone = c.R('wall', '#8A8478')
    wall = c.poly([(170, 140), (180, 70), (384, 60), (384, 150)])
    c.solid(wall, stone, 3, hl=1, sh=1)
    c.tex(wall, tex_blocks(c, 14, 6, seed=5))
    c.fill(c.rect(176, 64, 383, 66) & (c.xx % 8 < 4), stone, 4)  # the parapet
    c.fill(wall & (c.yy > 132), c.R('moss', '#5A6A4E'), 2)
    # the road, palms, two lamp posts
    road = c.R('road', '#A8A08A')
    rm = c.rect(0, 140, W - 1, H - 1)
    c.fill(rm, road, 4)
    c.tex(rm, tex_noise(c, 0.06, 0.04, seed=6))
    c.dither_adjust(c.rect(0, 140, W - 1, 150), -0.4)
    frond, ptrunk = c.R('frond', '#4A5E4A'), c.R('ptrunk', '#6A6458')
    palm(c, 40, 142, 70, 6, frond, ptrunk, seed=3)
    palm(c, 130, 140, 60, -4, frond, ptrunk, seed=8)
    iron = c.R('iron', '#2A2A30')
    for lx in (88, 340):
        c.fill(c.rect(lx, 100, lx + 1, 142), iron, 2)
        c.solid(c.poly([(lx - 3, 94), (lx + 4, 94), (lx + 3, 100), (lx - 2, 100)]), c.R('lampglass', '#D8D0B8'), 4, hl=1)
    return stage(c, [(jesuit(g), 120, 206, False), (rizal_black(g), 160, 206, False), (jesuit(g), 200, 206, False),
                     (luis_taviel(g), 244, 206, False)])


def paco_1896():
    g = grade_fn('#C8CCD0', 0.10, contrast=1.0)
    c = Canvas(W, H, grade=g)
    sky(c, '#8A96A6', '#DADCDA', 90)
    gc = c.R('greycloud', colors=[hx(h) for h in GREY])
    cloud(c, 0, 8, 180, 26, gc, seed=2)
    cloud(c, 210, 16, 180, 22, gc, seed=6)
    # trees beyond the walls
    trees = c.R('trees', '#5E6E58')
    c.fill(c.rect(0, 70, W - 1, 150), trees, 2)
    canopy(c, -20, 56, 170, 40, trees, seed=3, base=3)
    canopy(c, 240, 52, 170, 44, trees, seed=5, base=3)
    stone = c.R('stone', '#B8B0A0')
    # the domed chapel in the middle of the round cemetery
    c.solid(c.rect(166, 46, 218, 96), stone, 4, hl=1, sh=1)
    dome = c.ell(168, 24, 216, 68) & c.rect(0, 0, W - 1, 48)
    c.solid(dome, stone, 4, hl=1, sh=1)
    c.fill(c.rect(191, 12, 192, 24) | c.rect(188, 16, 195, 17), c.R('cross', '#4A4440'), 2)
    c.fill(c.ell(184, 62, 200, 78) | c.rect(184, 70, 200, 96), c.R('door', '#3A3430'), 2)
    # the circular wall seen from inside: rows of burial niches, curving away at both sides
    wall = np.zeros((H, W), bool)
    xs = np.arange(W)
    top = 92 + 22 * ((xs - 192) / 192.0) ** 2
    for x in range(W):
        wall[int(top[x]):150, x] = True
    c.solid(wall, stone, 3, hl=1, sh=1)
    for k in range(3):
        y0 = 104 + k * 15
        for x in range(4, W - 6, 12):
            if y0 < top[x] + 4:
                continue
            c.fill(c.rect(x, y0, x + 8, y0 + 10), c.R('niche', '#8A8276'), 2)
            c.fill(c.rect(x + 1, y0 + 1, x + 7, y0 + 9), c.R('slab', '#C8C0B0'), 4)
    c.fill(c.rect(0, 148, W - 1, 150), stone, 2)
    # the grass inside the walls, a path, a few plain crosses
    grass = c.R('grass', '#7A8A62')
    gm = c.rect(0, 150, W - 1, H - 1)
    c.fill(gm, grass, 3)
    c.fill(gm & ((c.xx * 5 + c.yy * 3) % 13 == 0), grass, 4)
    c.fill(c.poly([(170, 216), (214, 216), (198, 150), (186, 150)]), c.R('path', '#A8A08C'), 4)
    wood = c.R('wood', '#5A4E44')
    for cx_, cy_ in ((60, 176), (110, 166), (290, 170), (336, 184)):
        c.fill(c.rect(cx_, cy_ - 14, cx_ + 1, cy_) | c.rect(cx_ - 4, cy_ - 10, cx_ + 5, cy_ - 9), wood, 2)
    return c.render()


SCENES = {'walk_1896': walk_1896, 'paco_1896': paco_1896}

if __name__ == '__main__':
    for name, fn in SCENES.items():
        im = fn()
        im.save(f'out/scene_{name}.png')
        im.resize((W * 3, H * 3), Image.NEAREST).save(f'out/prev_{name}.png')
        print('ok', name)
    contact([f'out/scene_{n}.png' for n in SCENES], 'out/sheet_bag.png')
