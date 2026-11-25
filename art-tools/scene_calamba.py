"""Calamba, Laguna, c. 1864 — morning. Teodora Alonso teaches little José in front of
the family bahay na bato (stone ground floor, hardwood upper floor with capiz windows,
clay-tile roof, shop opening for Doña Teodora's store). Mt. Makiling behind."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_planks_v, tex_planks_h, tex_tiles, tex_thatch, tex_blocks, hx
from common import W, H, grade_fn, sky, cloud, ridge, canopy, trunk, capiz_window, shadow
import chars


def build():
    g = grade_fn('#FFE6B8', 0.06, contrast=1.02)
    c = Canvas(W, H, grade=g)
    sky(c, '#5FA3D6', '#F3EBD8', 150)
    cl = c.R('cloud', colors=[hx(h) for h in ['#9FB6C8', '#B9CAD6', '#D2DDE4', '#E4EBEE', '#F1F4F2', '#FBFBF6', '#FFFFFF']])
    cloud(c, 20, 18, 70, 16, cl, seed=3)
    cloud(c, 150, 30, 50, 10, cl, seed=8)
    cloud(c, 300, 12, 60, 14, cl, seed=5)
    # Mt. Makiling (hazy) + nearer hills
    far = c.R('far', '#93B2BC')
    ridge(c, far, 150, 26, 0.02, 4, peaks=[(270, 34, 36), (318, 26, 22), (352, 14, 26)], tone=4)
    mid = c.R('mid', '#7BA184')
    ridge(c, mid, 156, 12, 0.035, 9, tone=3)
    haze = c.R('treehaze', '#6E9A72')
    for i, x in enumerate(range(-10, 400, 34)):
        canopy(c, x, 132 + (i % 3) * 3, 40, 22, haze, seed=40 + i, base=3, clumps=4)
    # ground
    grass = c.R('grass', '#7EAD4C')
    gm = c.rect(0, 150, W - 1, H - 1)
    c.fill(gm, grass, 3)
    c.tex(gm, tex_noise(c, 0.10, 0.06, seed=11))
    c.adjust(c.rect(0, 150, W, 156), -1)

    # ---------------- bahay na bato ----------------
    hx0, hx1, base = 74, 266, 176
    stone = c.R('stone', '#E4DAC4')
    adobe = c.R('adobe', '#B79F78')
    wood = c.R('wood', '#7A4A2E')
    dkwood = c.R('dkwood', '#4E2E1E')
    tile = c.R('tile', '#A9583A')
    capiz = c.R('capiz', '#E9E2CC')
    inter = c.R('interior', '#3A2A24')
    iron = c.R('iron', '#4A4A54')
    # lower floor: lime-plastered stone with patches of exposed adobe
    lower = c.rect(hx0, 128, hx1, base)
    c.solid(lower, stone, 4, hl=0, sh=1)
    c.tex(lower, tex_noise(c, 0.07, 0.03, seed=2))
    patch = (c.ell(80, 150, 98, 166) | c.ell(204, 132, 222, 142) | c.ell(244, 160, 262, 174)) & lower
    c.fill(patch, adobe, 3)
    c.tex(patch, tex_blocks(c, 8, 4, seed=3))
    c.fill(c.rect(hx0, base - 4, hx1, base), stone, 2)  # plinth
    c.fill(c.rect(hx0, base - 5, hx1, base - 5), stone, 5)
    # zaguan (arched carriage door)
    arch = c.ell(96, 134, 124, 152) | c.rect(96, 143, 124, base - 1)
    c.fill(c.ell(93, 131, 127, 155) | c.rect(93, 143, 127, base - 1), stone, 5)
    c.fill(arch, dkwood, 2)
    c.tex(arch, tex_planks_v(c, pw=4, x0=96, grain=0.1))
    c.fill(c.rect(110, 136, 110, base - 1), dkwood, 0)
    for yy in range(146, 172, 7):
        for xx in (100, 106, 114, 120):
            c.fill(c.rect(xx, yy, xx, yy), c.R('brass', '#C9A24A'), 4)
    # tienda (shop opening) with counter and goods
    shop = c.rect(150, 146, 206, 172)
    c.fill(c.rect(147, 143, 209, 172), stone, 5)
    c.fill(shop, inter, 1)
    c.gradient(shop, inter, 0, 2.5, 146, 172)
    counter = c.rect(150, 162, 206, 172)
    c.solid(counter, wood, 3, hl=1, sh=1)
    c.tex(counter, tex_planks_h(c, ph=3, y0=162, seam=19))
    clay = c.R('clay', '#9E5634')
    for i, xx in enumerate((154, 163, 172, 186, 196)):
        h_ = 6 + (i % 2) * 2
        c.solid(c.ell(xx, 162 - h_, xx + 7, 162) | c.rect(xx + 2, 162 - h_ - 2, xx + 5, 162 - h_ + 1), clay, 3, hl=1, sh=1)
    sack = c.R('sack', '#C7B188')
    c.solid(c.ell(176, 152, 186, 162), sack, 4, hl=1, sh=1)
    awn = c.poly([(144, 139), (212, 139), (216, 145), (140, 145)])
    c.solid(awn, wood, 3, hl=1, sh=1)
    c.tex(awn, tex_planks_v(c, pw=4, x0=140))
    # grilled windows
    for wx in (80, 222):
        wm = c.rect(wx, 140, wx + 20, 158)
        c.fill(c.rect(wx - 2, 138, wx + 22, 160), stone, 5)
        c.fill(wm, inter, 1)
        c.fill(wm & (((c.xx - wx) % 4) == 2), iron, 3)
        c.fill(wm & (c.yy == 149), iron, 3)
    # eave shadow on stone from overhang
    c.adjust(c.rect(hx0, 128, hx1, 133), -1)
    c.dither_adjust(c.rect(hx0, 134, hx1, 137), -0.5)

    # upper floor (volada overhang, hardwood planks)
    ux0, ux1 = 66, 274
    upper = c.rect(ux0, 92, ux1, 126)
    c.solid(upper, wood, 3, hl=1, sh=1)
    c.tex(upper, tex_planks_v(c, pw=4, x0=ux0, grain=0.08))
    beam = c.rect(ux0 - 2, 126, ux1 + 2, 130)
    c.solid(beam, dkwood, 3, hl=1, sh=1)
    for bx in range(ux0 + 6, ux1, 24):
        c.solid(c.poly([(bx, 130), (bx + 5, 130), (bx + 5, 137)]), dkwood, 3, hl=1, sh=1)
    # capiz windows + ventanillas with balusters
    for i, wx in enumerate(range(72, 262, 24)):
        capiz_window(c, wx, 97, 21, 17, dkwood, capiz, open_frac=0.55 if i in (2, 5) else 0, interior_rid=inter)
        vm = c.rect(wx, 116, wx + 21, 124)
        c.fill(vm, dkwood, 1)
        c.fill(vm & (((c.xx - wx) % 3) == 1), wood, 5)
        c.fill(c.rect(wx, 116, wx + 21, 116), dkwood, 3)
    c.adjust(c.rect(ux0, 92, ux1, 94), -2)
    # hipped clay-tile roof with eaves
    roof = c.poly([(54, 93), (286, 93), (252, 60), (88, 60)])
    c.fill(roof, tile, 3)
    c.tex(roof, tex_tiles(c, tw=4, th=3, x0=54, y0=60))
    c.adjust(roof & c.poly([(54, 93), (88, 60), (110, 60), (84, 93)]), 1)
    c.adjust(roof & c.poly([(286, 93), (252, 60), (232, 60), (258, 93)]), -1)
    c.fill(c.rect(88, 59, 252, 61), tile, 5)
    c.fill(c.rect(52, 92, 288, 94), tile, 1)
    c.dither_adjust(c.rect(54, 87, 286, 91), -0.4)

    # big mango tree (left) and its shade
    bark = c.R('bark', '#5E4636')
    leaf = c.R('leaf', '#4C8A38')
    trunk(c, 26, 104, 182, 7, bark)
    c.fill(c.line([(30, 120), (46, 104)], 3), bark, 3)
    canopy(c, -14, 54, 92, 70, leaf, seed=21, base=3)
    shadow(c, -10, 176, 80, 190, -1)

    # nipa hut on bamboo stilts (José's hideaway)
    bam = c.R('bamboo', '#C6AE66')
    saw = c.R('sawali', '#C8A86C')
    nipa = c.R('nipa', '#9C8656')
    for px in (300, 314, 330, 344):
        c.solid(c.rect(px, 156, px + 2, 180), bam, 3, hl=1, sh=1)
        c.adjust(c.rect(px, 163, px + 2, 163) | c.rect(px, 172, px + 2, 172), -1)
    c.solid(c.rect(296, 154, 350, 158), bam, 4, hl=1, sh=1)
    walls = c.rect(298, 130, 348, 154)
    c.fill(walls, saw, 3)
    weave = walls & ((((c.xx // 2) + (c.yy // 2)) % 2) == 0)
    c.adjust(weave, 1)
    c.adjust(walls & (c.yy % 6 == 0), -1)
    win = c.rect(318, 136, 332, 148)
    c.fill(win, inter, 1)
    c.solid(c.poly([(316, 136), (334, 136), (338, 128), (312, 128)]), saw, 4, hl=1)
    c.fill(c.line([(320, 128), (320, 137)]), bam, 2)
    roofn = c.poly([(290, 134), (356, 134), (323, 100)])
    c.fill(roofn, nipa, 3)
    c.tex(roofn, tex_thatch(c, x0=290, y0=100))
    c.adjust(roofn & c.poly([(290, 134), (323, 100), (318, 134)]), 1)
    c.fill(c.line([(290, 135), (356, 135)]), nipa, 1)
    # ladder
    lad = c.line([(292, 180), (300, 156)], 1) | c.line([(297, 180), (305, 156)], 1)
    c.fill(lad, bam, 2)
    for k in range(4):
        yy = 176 - k * 6
        c.fill(c.line([(292 + (180 - yy) / 3, yy), (297 + (180 - yy) / 3, yy)]), bam, 4)
    shadow(c, 292, 176, 356, 184, -1)
    # banana plants
    ban = c.R('banana', '#6CAA3C')
    for bx, by in ((360, 150), (372, 158), (282, 160)):
        c.solid(c.rect(bx, by, bx + 2, by + 26), c.R('banstem', '#8AA048'), 3)
        for k, (dx, dy) in enumerate(((-14, -6), (12, -8), (-10, -14), (10, -16), (0, -20))):
            lm = c.poly([(bx + 1, by + 2), (bx + 1 + dx, by + dy), (bx + 1 + dx * 0.8, by + dy + 4)])
            c.solid(lm, ban, 3 + (k % 2), hl=1, sh=1)
    # bamboo fence along the street with a gate gap at the zaguan
    rail = c.rect(0, 180, 95, 181) | c.rect(126, 180, W, 181) | c.rect(0, 186, 95, 187) | c.rect(126, 186, W, 187)
    c.solid(rail, bam, 4, hl=1, sh=1)
    for px in list(range(2, 96, 10)) + list(range(128, W, 10)):
        c.solid(c.rect(px, 176, px + 1, 191), bam, 3, hl=1, sh=1)
    # street
    road = c.R('road', '#C9A77A')
    rm = c.rect(0, 192, W - 1, H - 1)
    c.fill(rm, road, 4)
    c.tex(rm, tex_noise(c, 0.10, 0.05, seed=13))
    c.adjust(c.rect(0, 192, W, 193), -1)
    for ry in (200, 209):
        c.dither_adjust(c.rect(0, ry, W, ry + 1), -0.6)
    for sx, sy in ((40, 204), (150, 212), (330, 198), (360, 210), (90, 197)):
        c.solid(c.ell(sx, sy, sx + 3, sy + 2), c.R('pebble', '#9C8A70'), 3, hl=1)
    # foreground grass tufts at the edges for depth
    fg = c.R('fg', '#3E6E30')
    for fx in range(0, 40, 4):
        c.fill(c.line([(fx, H), (fx + 2, H - 10 - (fx * 7) % 9)]), fg, 2 + (fx % 3 == 0))
    for fx in range(352, W, 4):
        c.fill(c.line([(fx, H), (fx - 2, H - 9 - (fx * 5) % 8)]), fg, 2 + (fx % 3 == 0))
    # chickens
    for cx_, cy_, col in ((340, 186, '#F2EDE2'), (356, 190, '#B0643A')):
        cr = c.R('hen' + col, col)
        c.solid(c.ell(cx_, cy_, cx_ + 7, cy_ + 5), cr, 3, hl=1, sh=1)
        c.solid(c.ell(cx_ - 2, cy_ - 2, cx_ + 2, cy_ + 2), cr, 3, hl=1)
        c.fill(c.rect(cx_ - 1, cy_ - 3, cx_, cy_ - 3), c.R('comb', '#C23A2E'), 3)
        c.fill(c.rect(cx_ - 3, cy_, cx_ - 3, cy_), c.R('beak', '#E0A640'), 4)
        c.fill(c.rect(cx_ + 3, cy_ + 6, cx_ + 3, cy_ + 7), c.R('beak', '#E0A640'), 3)
    # character shadows (cast to the right by morning sun)
    shadow(c, 222, 202, 256, 208, -1)
    shadow(c, 262, 203, 284, 208, -1)
    img = c.render().convert('RGBA')
    t = chars.woman(holding='open_book', grade=g)
    j = chars.child(scale='small', grade=g, holding='book')
    img.alpha_composite(t, (218, 206 - 75))
    img.alpha_composite(j, (256, 206 - 45))
    return img.convert('RGB')


if __name__ == '__main__':
    im = build()
    im.save('out/scene_calamba.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_calamba.png')
    print('ok')
