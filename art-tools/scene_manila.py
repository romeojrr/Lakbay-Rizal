"""Intramuros, Manila, 1872 — bright midday on Calle Arzobispo. Eleven-year-old José
arrives at the Ateneo Municipal with a Jesuit teacher. Stone colonial buildings with
capiz upper floors, a baroque bell tower beyond, cobbled street, iron oil lamp."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_planks_v, tex_tiles, tex_blocks, tex_cobbles, text_mask, text_width, hx
from common import W, H, grade_fn, sky, cloud, canopy, capiz_window, shadow
import chars


def facade_bahay(c, x0, x1, base, lower_top, upper_top, stone, wood, dk, capiz, inter, tile, iron, n_win, open_idx=()):
    lower = c.rect(x0, lower_top, x1, base)
    c.solid(lower, stone, 4, hl=0, sh=1)
    c.tex(lower, tex_noise(c, 0.06, 0.03, seed=x0))
    upper = c.rect(x0 - 4, upper_top, x1 + 4, lower_top - 4)
    c.solid(upper, wood, 3, hl=1, sh=1)
    c.tex(upper, tex_planks_v(c, pw=4, x0=x0))
    c.solid(c.rect(x0 - 6, lower_top - 4, x1 + 6, lower_top), dk, 3, hl=1, sh=1)
    span = (x1 - x0 - 8) / n_win
    for i in range(n_win):
        wx = int(x0 + 4 + i * span)
        ww = int(span) - 4
        capiz_window(c, wx, upper_top + 4, ww, lower_top - upper_top - 18, dk, capiz, open_frac=0.5 if i in open_idx else 0, interior_rid=inter)
        vm = c.rect(wx, lower_top - 13, wx + ww, lower_top - 6)
        c.fill(vm, dk, 1)
        c.fill(vm & (((c.xx - wx) % 3) == 1), iron, 4)
    roof = c.poly([(x0 - 10, upper_top + 1), (x1 + 10, upper_top + 1), (x1 - 8, upper_top - 20), (x0 + 8, upper_top - 20)])
    c.fill(roof, tile, 3)
    c.tex(roof, tex_tiles(c, x0=x0, y0=upper_top - 20))
    c.fill(c.rect(x0 - 10, upper_top, x1 + 10, upper_top + 1), tile, 1)
    c.adjust(c.rect(x0 - 4, upper_top + 2, x1 + 4, upper_top + 3), -2)
    c.adjust(c.rect(x0, lower_top + 1, x1, lower_top + 4), -1)


def build():
    g = grade_fn('#FFF0D0', 0.04, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#2F7CC4', '#CFE6F0', 140)
    cl = c.R('cloud', colors=[hx(h) for h in ['#8FA8C0', '#AFC3D4', '#CCDAE4', '#E2EAEF', '#F1F4F5', '#FAFBFA', '#FFFFFF']])
    cloud(c, 210, 10, 90, 30, cl, seed=12)
    cloud(c, 40, 30, 60, 14, cl, seed=2)

    # baroque bell tower beyond the rooftops
    tw = c.R('tower', '#B9AE9C')
    tx0, tx1 = 300, 338
    for k, (a, b, top) in enumerate(((tx0, tx1, 70), (tx0 + 4, tx1 - 4, 44), (tx0 + 9, tx1 - 9, 24))):
        m = c.rect(a, top, b, 130)
        c.solid(m, tw, 4 - k * 0, hl=1, sh=1)
        c.tex(m, tex_blocks(c, 8, 4, seed=7 + k))
        c.fill(c.rect(a - 2, top, b + 2, top + 2), tw, 5)
        c.fill(c.rect(a - 2, top + 3, b + 2, top + 3), tw, 2)
    for ax in (tx0 + 7, tx1 - 13):
        c.fill(c.ell(ax, 50, ax + 6, 58) | c.rect(ax, 54, ax + 6, 66), c.R('dark', '#2E2A30'), 1)
    c.fill(c.ell(tx0 + 12, 26, tx1 - 12, 34) | c.rect(tx0 + 12, 30, tx1 - 12, 40), c.R('dark', '#2E2A30'), 1)
    c.solid(c.ell(tx0 + 10, 12, tx1 - 10, 28), tw, 4, hl=1, sh=1)
    c.fill(c.rect(318, 2, 319, 12) | c.rect(316, 5, 321, 6), c.R('ironx', '#3A3A40'), 2)

    # deep shadowed alleys / far walls between buildings
    alley = c.R('alley', '#8C8070')
    c.gradient(c.rect(0, 116, W - 1, 178), alley, 3.2, 0.6, 116, 178)
    c.tex(c.rect(0, 116, W - 1, 178), tex_blocks(c, 10, 5, seed=21) * (c.yy < 150))
    stone = c.R('stone', '#E3D4AE')
    stone2 = c.R('stone2', '#DCCFC0')
    wood = c.R('wood', '#6E4A30')
    wood2 = c.R('wood2', '#5A6470')
    dk = c.R('dk', '#3E2A1E')
    capiz = c.R('capiz', '#EAE3CF')
    inter = c.R('inter', '#2E2420')
    tile = c.R('tile', '#A35A3E')
    iron = c.R('iron', '#4A4A52')

    # neighbour (right): blue-grey painted upper floor
    facade_bahay(c, 262, 384 + 20, 178, 128, 82, stone2, wood2, dk, capiz, inter, tile, iron, 5, open_idx=(1,))
    door = c.rect(300, 144, 322, 178)
    c.fill(door, dk, 2); c.tex(door, tex_planks_v(c, pw=4, x0=300))
    for wx in (276, 340):
        wm = c.rect(wx, 144, wx + 16, 162)
        c.fill(wm, inter, 1); c.fill(wm & (((c.xx - wx) % 4) == 2), iron, 3)

    # the Ateneo Municipal (left/centre)
    ax0, ax1 = 18, 250
    facade_bahay(c, ax0, ax1, 178, 120, 70, stone, wood, dk, capiz, inter, tile, iron, 7, open_idx=(2, 5))
    # pilasters on the stone ground floor
    for px in (ax0, 76, 190, ax1 - 6):
        pm = c.rect(px, 120, px + 6, 178)
        c.solid(pm, stone, 5, hl=1, sh=1)
        c.tex(pm, tex_blocks(c, 7, 5, x0=px, seed=px))
    # main portal: stone arch, double doors, name board
    portal = c.ell(104, 128, 162, 160) | c.rect(104, 144, 162, 178)
    c.solid(portal, stone, 5, hl=1, sh=1)
    c.tex(portal & ~c.rect(110, 138, 156, 178), tex_blocks(c, 6, 4, seed=4))
    dm = c.ell(110, 134, 156, 156) | c.rect(110, 145, 156, 178)
    c.fill(dm, dk, 2)
    c.tex(dm, tex_planks_v(c, pw=5, x0=110, grain=0.1))
    c.fill(c.rect(133, 136, 133, 178), dk, 0)
    for yy in range(150, 176, 8):
        for xx in (114, 124, 141, 151):
            c.fill(c.rect(xx, yy, xx, yy), c.R('brass', '#C9A24A'), 4)
    c.fill(c.rect(118, 172, 128, 178), inter, 0)  # one leaf ajar
    board = c.rect(97, 121, 169, 129)
    c.solid(board, dk, 2, hl=1, sh=1)
    label = 'ATENEO MUNICIPAL'
    tx = 133 - text_width(label) // 2
    c.fill(text_mask(c, label, tx, 123), c.R('letters', '#E9D9A6'), 5)
    # grilled windows
    for wx in (34, 84, 168, 206):
        wm = c.rect(wx, 138, wx + 18, 162)
        c.fill(c.rect(wx - 2, 136, wx + 20, 164), stone, 5)
        c.fill(wm, inter, 1)
        c.fill(wm & (((c.xx - wx) % 4) == 2), iron, 3)
        c.fill(wm & ((c.yy == 146) | (c.yy == 155)), iron, 3)
        c.fill(c.rect(wx - 3, 164, wx + 21, 166), stone, 5)
    # street level: kerb + cobbles
    walk = c.rect(0, 178, W - 1, 186)
    c.fill(walk, c.R('flag', '#B8AE9C'), 4)
    c.tex(walk, tex_blocks(c, 14, 4, y0=178, seed=9))
    c.fill(c.rect(0, 186, W, 188), c.R('kerb', '#8E8678'), 3)
    road = c.rect(0, 189, W - 1, H - 1)
    c.fill(road, c.R('cobble', '#9C958A'), 3)
    c.tex(road, tex_cobbles(c, y0=189))
    c.adjust(c.rect(0, 189, W, 190), -1)
    # iron oil lamp (farol) on a post
    lp = c.R('lampiron', '#2E3036')
    c.solid(c.rect(266, 120, 268, 186), lp, 2, hl=1)
    c.solid(c.rect(263, 184, 271, 187), lp, 2)
    c.solid(c.poly([(261, 108), (273, 108), (271, 121), (263, 121)]), c.R('glass', '#E6DFC4'), 4, hl=1, sh=1)
    c.fill(c.rect(261, 106, 273, 107) | c.poly([(263, 106), (271, 106), (267, 101)]), lp, 2)
    c.fill(c.rect(266, 112, 268, 117), c.R('flame', '#F2C25A'), 3)
    # midday shadows: short pools under characters, potted plant
    plant = c.R('plant', '#4E8A3A')
    c.solid(c.poly([(222, 168), (232, 168), (230, 178), (224, 178)]), c.R('pot', '#A65A3A'), 3, hl=1, sh=1)
    canopy(c, 216, 150, 22, 20, plant, seed=5, base=3, clumps=5)
    shadow(c, 128, 204, 160, 209, -1)
    shadow(c, 160, 204, 184, 209, -1)
    shadow(c, 260, 186, 276, 189, -1)
    img = c.render().convert('RGBA')
    pr = chars.man(skin='fair', hair='#2A2420', cassock=True, coat_col='#1C1A22', mustache=False, hat='clergy', hat_col='#18161C', hair_style='cropped', grade=g)
    jo = chars.child(scale='boy', barefoot=False, shirt='#F0EADC', shorts='#2E3446', holding='books', grade=g)
    img.alpha_composite(pr, (126, 207 - 75))
    img.alpha_composite(jo, (160, 207 - 60))
    return img.convert('RGB')


if __name__ == '__main__':
    im = build()
    im.save('out/scene_manila.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_manila.png')
    print('ok')
