"""Hong Kong, early 1892 — D'Aguilar Street, Central.
Colonial arcaded buildings with deep verandahs and green shutters climbing the
hill, Chinese shop signs on wooden boards, a sedan chair and a rickshaw, Victoria
Peak above, the harbour with junk sails glimpsed at the street's foot. Rizal's
doctor's plate by his door; his mother Doña Teodora has come to live with him."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_tiles, tex_blocks
from common import W, H, grade_fn, sky, cloud, ridge, canopy, shadow
from kit2 import place, water, euro_window
import chars


def build():
    g = grade_fn('#F6E0B8', 0.07, contrast=1.05)
    c = Canvas(W, H, grade=g)
    sky(c, '#6A9ACC', '#E6EAE4', 80)
    cloud(c, 120, 8, 90, 14, c.R('cloud', '#F6F4EE'), seed=2)
    peak = c.R('peak', '#4E7A5A')
    m, yv = ridge(c, peak, 70, 46, 0.012, seed=4, peaks=((200, 26, 60),), y_max=120)
    c.adjust(m & (((c.xx * 7 + c.yy * 3) % 13) == 0), 1)
    # houses dotted on the Peak
    for hx_, hy in ((150, 56), (230, 44), (280, 62)):
        c.solid(c.rect(hx_, hy, hx_ + 10, hy + 6), c.R('hillhouse', '#E8DCC4'), 5, hl=1)
        c.fill(c.rect(hx_ - 1, hy - 2, hx_ + 11, hy), c.R('roof', '#8A4A3A'), 3)

    # harbour glimpse at left with junks
    wtr = water(c, 112, 132, c.R('harbour', '#4E8AA0'), seed=3)
    c.fill(c.poly([(0, 108), (60, 104), (120, 110), (120, 114), (0, 114)]), c.R('kowloon', '#7A9A8A'), 3)
    for jx in (24, 78):
        c.fill(c.poly([(jx, 126), (jx + 22, 126), (jx + 18, 130), (jx + 4, 130)]), c.R('hull', '#4A3226'), 2)
        sail = c.poly([(jx + 6, 124), (jx + 10, 100), (jx + 18, 104), (jx + 16, 124)])
        c.solid(sail, c.R('junksail', '#A0583A'), 3, hl=1, sh=1)
        c.fill(sail & (((c.yy - 100) % 4) == 0), c.R('junksail', '#A0583A'), 1)

    # arcaded colonial buildings stepping up the hill (right) and across (left)
    ar = c.R('arcade', '#E6D6B6')
    shut = c.R('shutter', '#3E6A4E')
    glass = c.R('glass', '#3E4650')
    frame = c.R('frame', '#5A4A3E')
    dark = c.R('verandah', '#4A3E3A')
    for bx0, bx1, top in ((130, 230, 60), (230, 320, 50), (320, 392, 40)):
        bm = c.rect(bx0, top, bx1, 176)
        c.solid(bm, ar, 4, hl=0, sh=1)
        c.tex(bm, tex_noise(c, 0.04, 0.02, seed=bx0))
        c.solid(c.rect(bx0 - 3, top - 4, bx1 + 3, top), ar, 5, hl=1, sh=1)
        c.fill(c.rect(bx0, top - 8, bx1, top - 5) & ((c.xx % 4) < 2), ar, 3)  # parapet
        for fy in (top + 6, top + 44):
            vh = 34
            c.fill(c.rect(bx0 + 2, fy, bx1 - 2, fy + vh), dark, 1)
            for ax in range(bx0 + 4, bx1 - 14, 16):
                op = c.ell(ax, fy, ax + 12, fy + 12) | c.rect(ax, fy + 6, ax + 12, fy + vh)
                c.fill(c.rect(ax - 2, fy, ax + 14, fy + vh) & ~op, ar, 4)
                c.fill(op & (c.yy > fy + 14), shut, 2)
                c.fill(op & (c.yy > fy + 14) & ((c.yy % 2) == 0), shut, 3)
            c.fill(c.rect(bx0 + 2, fy + vh - 8, bx1 - 2, fy + vh - 8) | (c.rect(bx0 + 2, fy + vh - 8, bx1 - 2, fy + vh) & ((c.xx % 3) == 0)), c.R('rail', '#2E2E34'), 3)
        # ground-floor shopfront
        c.fill(c.rect(bx0 + 2, 140, bx1 - 2, 176), dark, 1)
        for ax in range(bx0 + 6, bx1 - 10, 22):
            c.fill(c.ell(ax - 2, 136, ax + 16, 152) & ~c.ell(ax, 138, ax + 14, 152) & (c.yy < 146), ar, 5)
    # Chinese shop signboards (vertical boards, blank characters suggested by strokes)
    for sx, sy, col in ((214, 128, '#8A2E26'), (300, 120, '#2E2A26'), (372, 110, '#8A2E26')):
        sb = c.rect(sx, sy, sx + 8, sy + 30)
        c.solid(sb, c.R(f'sign{col}', col), 3, hl=1)
        for k in range(4):
            yb = sy + 2 + k * 7
            strokes = [c.rect(sx + 2, yb, sx + 6, yb) | c.rect(sx + 2, yb + 4, sx + 6, yb + 4) | c.rect(sx + 2, yb + 1, sx + 2, yb + 3),
                       c.rect(sx + 3, yb, sx + 5, yb) | c.rect(sx + 2, yb + 2, sx + 6, yb + 2) | c.rect(sx + 5, yb + 3, sx + 6, yb + 4),
                       c.rect(sx + 2, yb + 1, sx + 3, yb + 1) | c.rect(sx + 5, yb, sx + 5, yb + 4) | c.rect(sx + 2, yb + 4, sx + 4, yb + 4),
                       c.rect(sx + 2, yb, sx + 6, yb) | c.rect(sx + 4, yb + 1, sx + 4, yb + 2) | c.rect(sx + 2, yb + 3, sx + 6, yb + 3)]
            c.fill(strokes[(k + sx) % 4], c.R('signgold', '#D8B04A'), 4)
    # Rizal's brass plate by his door
    c.solid(c.rect(160, 150, 174, 158), c.R('plate', '#C9A24A'), 4, hl=1)
    c.fill(c.rect(162, 152, 172, 152) | c.rect(162, 155, 170, 155), c.R('ink', '#2E2A26'), 2)
    c.fill(c.rect(178, 140, 198, 176), c.R('door', '#3A2A20'), 2)

    # granite street sloping up to the right
    st = c.poly([(0, 176), (W, 168), (W, H), (0, H)])
    c.fill(c.rect(0, 132, 130, 176), c.R('praya', '#A89A88'), 3)
    c.tex(c.rect(0, 132, 130, 176), tex_blocks(c, 14, 6, y0=132, seed=5))
    c.fill(st, c.R('granite', '#B8AC9A'), 4)
    c.tex(st, tex_blocks(c, 16, 8, y0=168, seed=6))
    c.dither_adjust(c.rect(0, 168, W - 1, 180), -0.4)
    # a gas lamp of the 1880s
    c.solid(c.rect(120, 118, 122, 180), c.R('lamp', '#2E3A34'), 3, hl=1)
    c.solid(c.poly([(115, 106), (127, 106), (125, 118), (117, 118)]), c.R('lampglass', '#E8DCB8'), 4, hl=1, sh=1)
    # rickshaw (parked)
    rk = c.R('rickshaw', '#2E2A30')
    c.solid(c.ell(30, 160, 58, 190) & ~c.ell(33, 163, 55, 187), rk, 3)
    c.solid(c.poly([(34, 150), (64, 150), (64, 172), (40, 176)]), c.R('hood', '#1E2A3A'), 3, hl=1, sh=1)
    c.fill(c.line([(60, 172), (100, 186)], 1), rk, 3)
    shadow(c, 26, 186, 100, 194, -1)

    for x0, x1 in ((222, 254), (260, 292)):
        shadow(c, x0, 203, x1, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(coat='sack', coat_col='#E8E2D2', vest_col='#D8D0BC', trousers='#C8BEA8', hat='straw', hat_col='#D8C08A', grade=g)
    td = chars.woman(skin='teodora', hair='#5A5458', saya='#3A2A34', tapis='#1E1C2A', camisa='#EEE8DA', grade=g)
    anchors = {'rizal': place(img, rz, 222, flip=True), 'teodora': place(img, td, 260)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_hongkong.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_hongkong.png')
    print(a)
