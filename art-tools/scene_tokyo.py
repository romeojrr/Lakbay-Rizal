"""Tokyo, March–April 1888 — spring along a canal near the Spanish Legation in Azabu.
Cherry trees in bloom, a low wall and tile-roofed gate, wooden houses with paper
shoji and dark tiled roofs, a stone lantern, a small arched bridge. Rizal walks with
Usui Seiko (O-Sei-san), who showed him the city and its language."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_tiles
from common import W, H, grade_fn, sky, cloud, ridge, canopy, trunk, shadow
from kit2 import place, water, petals
import chars


def jroof(c, x0, x1, y, h, rid):
    m = c.poly([(x0 - 8, y + h), (x0 + 6, y), (x1 - 6, y), (x1 + 8, y + h)])
    c.solid(m, rid, 2, hl=1, sh=1)
    c.adjust(m & (((c.xx - x0) % 4) == 0), -1)
    c.fill(c.rect(x0 + 4, y - 2, x1 - 4, y), rid, 1)
    c.fill(c.poly([(x0 - 10, y + h + 1), (x0 - 8, y + h - 2), (x0 - 4, y + h)]), rid, 1)
    c.fill(c.poly([(x1 + 10, y + h + 1), (x1 + 8, y + h - 2), (x1 + 4, y + h)]), rid, 1)
    return m


def build():
    g = grade_fn('#F8E6E0', 0.07, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#7AA6D6', '#EEEAF0', 80)
    cloud(c, 200, 10, 90, 12, c.R('cloud', '#F8F6F4'), seed=3)
    tile = c.R('kawara', '#4A4E5A')
    wood = c.R('hinoki', '#7A5A3E')
    shoji = c.R('shoji', '#EEE6D2')
    plaster = c.R('plaster', '#E4DAC6')
    blossom = c.R('sakura', '#EAB2C2')
    bark = c.R('bark', '#4A3A3A')
    stone = c.R('stone', '#A8A498')
    canal = c.R('canal', '#5E8A9A')

    ridge(c, c.R('farhills', '#8AA0B0'), 82, 14, 0.02, seed=6)
    # row of houses with shoji screens and tiled roofs
    for x0, x1, y in ((-4, 110, 74), (120, 230, 70), (244, 390, 76)):
        m = c.rect(x0, y + 12, x1, 132)
        c.solid(m, wood, 3, hl=0, sh=1)
        for sx in range(x0 + 4, x1 - 10, 14):
            sm = c.rect(sx, y + 18, sx + 11, 124)
            c.fill(sm, shoji, 5)
            c.fill(sm & (((c.xx - sx) % 4 == 3) | ((c.yy - y) % 5 == 0)), wood, 3)
        jroof(c, x0, x1, y, 14, tile)
    # long white wall with tiled coping and a gate
    wm = c.rect(0, 116, W - 1, 150)
    c.solid(wm, plaster, 5, hl=0, sh=1)
    c.tex(wm, tex_noise(c, 0.04, 0.0, seed=4))
    c.fill(c.rect(0, 140, W - 1, 150), stone, 3)
    c.tex(c.rect(0, 140, W - 1, 150), tex_tiles(c, 10, 5, y0=140))
    c.solid(c.rect(0, 110, W - 1, 116), tile, 2, hl=1, sh=1)
    c.adjust(c.rect(0, 110, W - 1, 116) & ((c.xx % 4) == 0), -1)
    gx = 150
    c.fill(c.rect(gx, 98, gx + 44, 150), wood, 1)
    c.solid(c.rect(gx - 4, 100, gx, 150) | c.rect(gx + 44, 100, gx + 48, 150), wood, 3, hl=1)
    jroof(c, gx - 6, gx + 54, 90, 10, tile)
    c.fill(c.rect(gx, 104, gx + 44, 106), wood, 4)

    # canal with stone banks and an arched bridge
    wtr = water(c, 156, 176, canal, seed=5)
    c.solid(c.rect(0, 150, W - 1, 156), stone, 3, hl=1, sh=1)
    c.tex(c.rect(0, 150, W - 1, 156), tex_tiles(c, 8, 3, y0=150))
    br = c.ell(250, 140, 350, 200) & ~c.ell(262, 152, 338, 210) & (c.yy < 176)
    c.solid(br, c.R('bridge', '#8A3A2E'), 3, hl=1, sh=1)
    c.fill(c.ell(248, 136, 352, 196) & ~c.ell(250, 138, 350, 198) & (c.yy < 160), c.R('bridge', '#8A3A2E'), 4)
    for px in range(258, 346, 10):
        c.fill(c.rect(px, 138 + int(abs(px - 300) * 0.25), px + 1, 146 + int(abs(px - 300) * 0.25)), c.R('bridge', '#8A3A2E'), 2)

    # near path, stone lantern
    pth = c.rect(0, 176, W - 1, H - 1)
    c.fill(pth, c.R('path', '#C8B8A0'), 4)
    c.tex(pth, tex_noise(c, 0.06, 0.05, seed=8))
    c.fill(c.rect(0, 176, W - 1, 177), stone, 2)
    lx = 50
    c.solid(c.rect(lx - 10, 196, lx + 10, 202), stone, 3, hl=1)
    c.solid(c.rect(lx - 3, 172, lx + 3, 196), stone, 3, hl=1)
    c.solid(c.rect(lx - 8, 160, lx + 8, 172), stone, 4, hl=1, sh=1)
    c.fill(c.rect(lx - 3, 163, lx + 3, 169), c.R('void', '#2E2A30'), 1)
    c.solid(c.poly([(lx - 13, 160), (lx, 150), (lx + 13, 160)]), stone, 3, hl=1, sh=1)
    c.solid(c.ell(lx - 3, 145, lx + 3, 151), stone, 4)

    # cherry trees in bloom
    for tx, seed, cx, cw in ((96, 1, 20, 150), (330, 2, 250, 140)):
        trunk(c, tx, 40, 184, 5, bark)
        c.fill(c.line([(tx + 2, 70), (tx + 30, 40)], 2) | c.line([(tx + 2, 84), (tx - 30, 52)], 2), bark, 2)
        cm = canopy(c, cx, -10, cw, 78, blossom, seed=seed, base=3, clumps=16)
        shadow(c, tx - 30, 184, tx + 34, 192, -1)
    petals(c, c.rect(0, 60, W - 1, H - 1), blossom, seed=4, density=0.004, tone=5)

    for x0, x1 in ((156, 188), (192, 224)):
        shadow(c, x0, 203, x1, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(coat_col='#2E3346', hat='bowler', grade=g)
    sei = chars.woman(skin='pale', dress='kimono', bodice='#4A5A8A', hair='#18141C', grade=g)
    anchors = {'rizal': place(img, rz, 156, flip=True), 'seiko': place(img, sei, 194)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_tokyo.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_tokyo.png')
    print(a)
