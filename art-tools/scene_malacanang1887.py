"""Malacañang Palace, Manila, 1887 — the Governor-General's residence on the north bank of the
Pasig River, where Governor-General Emilio Terrero summoned Rizal about the Noli.
A long two-storey house in the bahay-na-bato manner: stone arcade below, wooden upper floor
with capiz windows, a clay-tile roof with the Spanish flag (red-yellow-red, the national flag
since 1843), palms and acacias around it, a stone river landing with steps to the water.
Hard tropical late-morning light. No people: a place card for the story's narration."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_blocks, tex_planks_h, hx
from common import W, H, grade_fn, sky, cloud, canopy, trunk, palm, shadow
from kit2 import water, reflect
from scene_manila import facade_bahay
from places_cast import stage, rizal_suit


def build():
    g = grade_fn('#FFF0D0', 0.05, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#2F7CC4', '#D2E8F0', 120)
    cl = c.R('cloud', colors=[hx(h) for h in ['#8FA8C0', '#AFC3D4', '#CCDAE4', '#E2EAEF', '#F1F4F5', '#FAFBFA', '#FFFFFF']])
    cloud(c, 24, 14, 80, 22, cl, seed=4)
    cloud(c, 262, 26, 70, 16, cl, seed=9)

    # acacia trees behind the palace
    leaf = c.R('acacia', '#4E7A3E')
    canopy(c, 0, 66, 90, 58, leaf, seed=3, base=3)
    canopy(c, 300, 62, 84, 62, leaf, seed=5, base=3)
    canopy(c, 120, 74, 150, 30, c.R('acacia2', '#5A8446'), seed=8, base=2)
    # the garden around the palace: lawn and low shrubs (the far bank's trees beyond)
    lawn = c.R('lawn', '#6E9A48')
    c.fill(c.rect(0, 112, W - 1, 154), lawn, 3)
    c.dither_adjust(c.rect(0, 112, W - 1, 154), 0.18)
    shrub = c.R('shrub', '#4A7A3A')
    for sx, sw, seed in ((-6, 70, 11), (330, 60, 12)):
        canopy(c, sx, 112, sw, 40, shrub, seed=seed, base=3)

    stone = c.R('stone', '#E6DCC4')
    wood = c.R('wood', '#6E4A30')
    dk = c.R('dk', '#3E2A1E')
    capiz = c.R('capiz', '#EDE6D2')
    inter = c.R('inter', '#2E2420')
    tile = c.R('tile', '#A35A3E')
    iron = c.R('iron', '#4A4A52')

    # the palace: a long front on the river, eight windows above
    x0, x1, base, lower_top, upper_top = 62, 322, 150, 114, 76
    facade_bahay(c, x0, x1, base, lower_top, upper_top, stone, wood, dk, capiz, inter, tile, iron, 8,
                 open_idx=(2, 5))
    house = c.rect(x0 - 10, upper_top - 20, x1 + 10, base)
    # ground floor: a stone arcade
    span = (x1 - x0 - 12) / 9
    for i in range(9):
        ax = int(x0 + 8 + i * span)
        aw = int(span) - 8
        arch = c.ell(ax, lower_top + 8, ax + aw, lower_top + 8 + aw) | c.rect(ax, lower_top + 8 + aw // 2, ax + aw, base - 2)
        c.fill(arch, inter, 1)
        c.adjust(c.rect(ax, base - 8, ax + aw, base - 2) & arch, 1)
        c.fill(c.rect(ax - 1, lower_top + 6, ax + aw + 1, lower_top + 7), stone, 5)
    # a little gable over the middle bay, with the flag above it
    mid = (x0 + x1) // 2
    gab = c.poly([(mid - 26, upper_top + 1), (mid + 26, upper_top + 1), (mid, upper_top - 16)])
    c.solid(gab, stone, 4, hl=1, sh=1)
    c.fill(c.ell(mid - 4, upper_top - 8, mid + 4, upper_top), dk, 2)
    pole = c.rect(mid, upper_top - 46, mid, upper_top - 16)
    c.fill(pole, iron, 2)
    red, gold = c.R('flagred', '#B8302A'), c.R('flaggold', '#E8C040')
    fx, fy = mid + 1, upper_top - 46
    c.fill(c.rect(fx, fy, fx + 17, fy + 2), red, 3)
    c.fill(c.rect(fx, fy + 3, fx + 17, fy + 7), gold, 4)
    c.fill(c.rect(fx, fy + 8, fx + 17, fy + 10), red, 3)
    c.adjust(c.rect(fx + 12, fy, fx + 17, fy + 10) & (c.yy % 2 == 0), -1)  # the cloth ripples

    # palms in front, either side
    frond, ptrunk = c.R('frond', '#3E6E36'), c.R('ptrunk', '#8A7A5A')
    palm(c, 30, 156, 86, 10, frond, ptrunk, seed=2)
    palm(c, 352, 156, 80, -12, frond, ptrunk, seed=6)

    # garden strip and the stone embankment
    grass = c.R('grass', '#6E9A48')
    c.fill(c.rect(0, 150, W - 1, 154), grass, 3)
    c.dither_adjust(c.rect(0, 150, W - 1, 154), 0.25)
    quay = c.rect(0, 155, W - 1, 168)
    c.solid(quay, stone, 3, hl=1, sh=0)
    c.tex(quay, tex_blocks(c, 14, 5, y0=155, seed=4))
    c.fill(c.rect(0, 155, W - 1, 155), stone, 5)
    # steps down to a landing in the middle
    for k in range(6):
        c.fill(c.rect(mid - 22 + k * 2, 156 + k * 2, mid + 22 - k * 2, 157 + k * 2), stone, 5 - (k % 2))
    # iron railing along the quay, open at the steps
    rail = (c.rect(0, 146, W - 1, 146) | (c.rect(0, 146, W - 1, 154) & (c.xx % 6 == 0))) & ~c.rect(mid - 24, 140, mid + 24, 156)
    c.fill(rail, iron, 2)

    # the Pasig River, with the palace mirrored in it
    river = c.R('river', '#4A7C8C')
    wm = water(c, 169, H - 1, river, seed=5, base=3, top_tone=4)
    # the reflection fades with depth: only the band nearest the quay
    reflect(c, house, 168, wm & (c.yy < 196), d=-1)
    c.dither_adjust(wm & (c.yy >= 186) & (c.yy < 196), 0.5)
    # a banca moored at the landing
    banca = c.R('banca', '#7A5234')
    hull = c.poly([(mid + 30, 176), (mid + 74, 176), (mid + 68, 181), (mid + 36, 181)])
    c.solid(hull, banca, 3, hl=1, sh=1)
    c.fill(c.rect(mid + 34, 175, mid + 70, 175), banca, 5)
    c.fill(c.line([(mid + 30, 172), (mid + 22, 168)]), c.R('rope', '#C8B08A'), 3)

    shadow(c, x0, base - 2, x1, base + 4, -1)
    c.dither_adjust(c.rect(x0, lower_top + 1, x1, lower_top + 10), -0.4)  # eaves shade the arcade
    return stage(c, [(rizal_suit(g, hat='bowler'), 98, 168, False)]), {}


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_malacanang1887.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_malacanang1887.png')
    print('ok')
