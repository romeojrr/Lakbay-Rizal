"""Calamba, late 1887 — the clinic on the ground floor of the family house.
Thick adobe walls, wooden beams, a big window on cane fields and Mount Makiling,
a table of instruments and bottles; patients wait by the open door. Rizal (back
from Europe) with his mother, Doña Teodora, whose eyes he treats."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_blocks, tex_planks_h, tex_tiles
from common import W, H, grade_fn, sky, cloud, ridge, palm, canopy, shadow
from kit2 import place, table, chair
import chars


def build():
    g = grade_fn('#F4D8A8', 0.08, contrast=1.04)
    c = Canvas(W, H, grade=g)
    adobe = c.R('adobe', '#C8B08A')
    lime = c.R('lime', '#E2D8C2')
    wood = c.R('narra', '#6A4228')
    cane = c.R('cane', '#8AA84A')
    mak = c.R('makiling', '#4E7A5A')
    steel = c.R('steel', '#9AA2AC')
    glassb = c.R('bottle', '#5E8A7A')
    paper = c.R('paper', '#ECE4CE')
    tile = c.R('baldosa', '#A85A3E')

    # view through the big window and the door (drawn first)
    wx0, wy0, wx1, wy1 = 36, 40, 160, 128
    dx0, dy0, dx1 = 296, 52, 350
    view = c.rect(wx0, wy0, wx1, wy1) | c.rect(dx0, dy0, dx1, 176)
    sky(c, '#6EA2D4', '#E6EEE6', 110)
    cloud(c, 40, 46, 60, 12, c.R('cloud', '#F8F6F0'), seed=2)
    ridge(c, mak, 96, 40, 0.02, seed=3, peaks=((96, 30, 40),), y_max=130)
    fm = c.rect(0, 100, W - 1, 176)
    c.fill(fm, cane, 3)
    for k in range(0, W, 3):
        c.fill(c.line([(k, 100 + (k * 7) % 5), (k + 2, 92 + (k * 5) % 7)]), cane, 4 + (k % 2))
    palm(c, 330, 150, 80, 14, c.R('frond', '#4E7A3A'), c.R('ptrunk', '#8A7A5A'), seed=2)
    c.fill(c.rect(dx0, 160, dx1, 176), c.R('road', '#C8B08A'), 4)

    wall = c.rect(0, 0, W - 1, 176) & ~view
    c.fill(wall, lime, 4)
    c.tex(wall, tex_noise(c, 0.06, 0.03, seed=1))
    c.fill(c.rect(0, 120, W - 1, 176) & wall, adobe, 3)
    c.tex(c.rect(0, 120, W - 1, 176) & wall, tex_blocks(c, 14, 7, y0=120, seed=2))
    c.fill(c.rect(0, 119, W - 1, 120) & wall, adobe, 5)
    # ceiling beams
    c.fill(c.rect(0, 0, W - 1, 14), wood, 1)
    for bx in range(0, W, 30):
        c.solid(c.rect(bx, 0, bx + 10, 16), wood, 3, hl=1, sh=1)
    c.solid(c.rect(0, 14, W - 1, 18), wood, 2, hl=1, sh=1)
    # window frame with ventanilla grille below and capiz panes slid open
    c.solid(c.rect(wx0 - 5, wy0 - 5, wx1 + 5, wy0 - 1) | c.rect(wx0 - 5, wy0, wx0 - 1, wy1 + 5) | c.rect(wx1 + 1, wy0, wx1 + 5, wy1 + 5), wood, 3, hl=1, sh=1)
    c.solid(c.rect(wx0 - 8, wy1 + 1, wx1 + 8, wy1 + 5), wood, 4, hl=1)
    c.fill(c.rect(wx0, wy0, wx1, wy1) & ((c.xx - wx0) % 10 == 0) & (c.yy > wy1 - 26), c.R('iron', '#2E2E34'), 3)
    cap = c.rect(wx1 - 30, wy0, wx1, wy1 - 26)
    c.fill(cap, c.R('capiz', '#E8E0C8'), 4)
    c.fill(cap & (((c.xx - wx1) % 4 == 0) | ((c.yy - wy0) % 4 == 0)), wood, 2)
    # door frame
    c.solid(c.rect(dx0 - 6, dy0 - 6, dx1 + 6, dy0 - 1) | c.rect(dx0 - 6, dy0, dx0 - 1, 176) | c.rect(dx1 + 1, dy0, dx1 + 6, 176), wood, 3, hl=1, sh=1)
    # bright daylight patch from the door
    c.dither_adjust(c.poly([(dx0, 176), (dx1, 176), (dx1 - 20, H), (dx0 - 60, H)]), 0.5)

    # diploma frame and a shelf of bottles
    c.solid(c.rect(186, 40, 222, 66), wood, 2, hl=1)
    c.fill(c.rect(189, 43, 219, 63), paper, 5)
    c.fill(c.rect(193, 47, 215, 47) | c.rect(195, 51, 213, 51) | c.rect(197, 55, 211, 55), c.R('ink', '#3A3440'), 2)
    c.fill(c.ell(200, 57, 206, 62), c.R('seal', '#A83A2A'), 3)
    c.solid(c.rect(234, 62, 284, 65), wood, 4, hl=1)
    for k, bx in enumerate(range(238, 282, 7)):
        h = 8 + (k * 5) % 6
        c.solid(c.rect(bx, 62 - h, bx + 4, 61), glassb if k % 2 else c.R('amber', '#A8743A'), 3, hl=1)

    # instrument table
    table(c, 186, 148, 270, wood, h=24, cloth=c.R('cloth', '#E6E0D0'))
    c.solid(c.rect(196, 142, 226, 146), steel, 4, hl=1)
    for k in range(5):
        c.fill(c.rect(199 + k * 5, 143, 202 + k * 5, 143), steel, 6)
    c.solid(c.ell(234, 138, 244, 147), c.R('basin', '#E8E4DA'), 4, hl=1)
    c.solid(c.rect(252, 136, 262, 146), c.R('case', '#4A2E2A'), 3, hl=1)
    chair(c, 106, 158, wood, facing=1)

    fl = c.rect(0, 176, W - 1, H - 1)
    c.fill(fl, tile, 3)
    c.tex(fl, tex_tiles(c, 12, 6, y0=176))
    c.dither_adjust(c.rect(0, 176, W - 1, 180), -0.5)

    for x0, x1 in ((118, 150), (152, 184), (296, 320)):
        shadow(c, x0, 203, x1, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(coat='shirt', shirt='#F0EADC', vest_col='#3A3E4E', trousers='#2E3240', grade=g)
    td = chars.woman(skin='teodora', hair='#4A4448', saya='#3A2A34', tapis='#1E1C2A', camisa='#EEE8DA', grade=g)
    pt = chars.man(skin='brown', coat='shirt', shirt='#E8DCC2', trousers='#5A4A3A', hat='salakot', hat_col='#C9A86A', mustache=False, grade=g)
    place(img, pt, 296, feet=204)
    anchors = {'teodora': place(img, td, 118, flip=True), 'rizal': place(img, rz, 152)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_calamba1887.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_calamba1887.png')
    print(a)
