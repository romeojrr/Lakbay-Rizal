"""Madrid, autumn 1882 — dusk on Calle de San Bernardo. Rizal, now a student at the
Universidad Central, passes its classical stone portal. Gas lamps are being lit, plane
trees are turning, neighbouring apartment blocks have iron balconies and shutters."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_planks_v, tex_blocks, tex_cobbles, tex_bricks, text_mask, text_width, hx
from common import W, H, grade_fn, sky, cloud, canopy, trunk, shadow, lamp_glow
import chars


def balcony_window(c, x, y, w, h, frame, glass, rail, shutter=None, lit=False, glow=None):
    c.solid(c.rect(x - 2, y - 3, x + w + 2, y + h), frame, 5, hl=1, sh=1)  # stone surround
    c.fill(c.rect(x - 3, y - 4, x + w + 3, y - 3), frame, 6)
    win = c.rect(x, y, x + w, y + h - 1)
    c.fill(win, glow if lit else glass, 4 if lit else 1)
    if lit:
        c.gradient(win, glow, 5, 3, y, y + h)
    c.fill(c.rect(x + w // 2, y, x + w // 2, y + h - 1) | c.rect(x, y + h // 3, x + w, y + h // 3), frame, 1)
    if shutter:
        c.solid(c.rect(x - 6, y, x - 2, y + h - 1), shutter, 3, hl=1, sh=1)
        c.solid(c.rect(x + w + 2, y, x + w + 6, y + h - 1), shutter, 2, hl=0, sh=1)
        c.adjust(c.rect(x - 6, y, x + w + 6, y + h) & ((c.yy % 2) == 0) & ~win, -1)
    # wrought-iron balcony
    c.solid(c.rect(x - 5, y + h, x + w + 5, y + h + 2), frame, 4, hl=1, sh=1)
    rm = c.rect(x - 4, y + h - 8, x + w + 4, y + h - 1)
    c.fill(c.rect(x - 4, y + h - 8, x + w + 4, y + h - 8), rail, 1)
    c.fill(rm & (((c.xx - x) % 3) == 0), rail, 1)
    c.fill(rm & (c.yy == y + h - 4) & (((c.xx - x) % 3) != 0) & ((c.xx % 2) == 0), rail, 2)


def build():
    g = grade_fn('#C8B0E0', 0.07, contrast=1.03)
    c = Canvas(W, H, grade=g)
    sky_cols = ['#26305E', '#3C4478', '#5E5A8C', '#8E6E92', '#C98A84', '#EBA87A', '#F6CE96']
    c.gradient(c.rect(0, 0, W - 1, 130), c.R('sky', colors=[hx(h) for h in sky_cols]), 0, 6.5, 0, 130)
    cl = c.R('dcloud', colors=[hx(h) for h in ['#3E3E6A', '#5A507A', '#7E6284', '#A87486', '#D08A82', '#E8A486', '#F4C29A']])
    cloud(c, 60, 40, 80, 8, cl, seed=4, base=4)
    cloud(c, 250, 26, 70, 7, cl, seed=9, base=4)
    for sx, sy in ((30, 10), (120, 6), (200, 16), (330, 8), (360, 22)):
        c.fill(c.rect(sx, sy, sx, sy), c.R('star', '#F4F0FF'), 5)

    stone = c.R('lime', '#D6C9AE')
    ochre = c.R('ochre', '#C98E56')
    red = c.R('redplaster', '#A9604A')
    frame = c.R('frame', '#CDBFA3')
    glass = c.R('glass', '#2C3248')
    glow = c.R('glow', '#F0B860')
    rail = c.R('rail', '#24242C')
    green = c.R('shutter', '#3E6A52')
    dk = c.R('door', '#3A2618')

    # left apartment block (ochre plaster, green shutters)
    lb = c.rect(0, 30, 92, 176)
    c.solid(lb, ochre, 3, hl=0, sh=1)
    c.tex(lb, tex_noise(c, 0.06, 0.03, seed=3))
    c.fill(c.rect(0, 26, 96, 30), frame, 5); c.fill(c.rect(0, 30, 96, 31), frame, 2)
    for row, wy in enumerate((44, 82, 120)):
        for wx in (14, 56):
            balcony_window(c, wx, wy, 18, 26, frame, glass, rail, shutter=green, lit=(row + wx) % 3 == 0, glow=glow)
    shop = c.rect(10, 152, 82, 176)
    c.fill(shop, dk, 2)
    c.fill(c.rect(16, 156, 40, 172), glow, 4)
    c.gradient(c.rect(16, 156, 40, 172), glow, 5, 3, 156, 172)
    c.fill(c.rect(28, 156, 28, 172), dk, 1)

    # Universidad Central: rusticated base, classical portal with columns and pediment
    ux0, ux1 = 96, 296
    uni = c.rect(ux0, 36, ux1, 176)
    c.solid(uni, stone, 3, hl=1, sh=1)
    c.tex(uni & (c.yy > 128), tex_blocks(c, 16, 6, x0=ux0, y0=128, seed=5))
    c.tex(uni & (c.yy <= 128), tex_noise(c, 0.05, 0.0, seed=6))
    c.fill(c.rect(ux0 - 3, 30, ux1 + 3, 35), stone, 6)  # cornice
    c.fill(c.rect(ux0 - 3, 35, ux1 + 3, 36), stone, 2)
    for k in range(ux0, ux1, 6):
        c.fill(c.rect(k, 36, k + 2, 38), stone, 5)  # dentils
    c.fill(c.rect(ux0, 126, ux1, 128), stone, 6)  # string course
    for row, wy in enumerate((48, 88)):
        for wx in (108, 140, 236, 268):
            balcony_window(c, wx, wy, 16, 28, frame, glass, rail, lit=(wx + row * 3) % 4 == 0, glow=glow)
    # portal
    px0, px1 = 164, 228
    ped = c.poly([(px0 - 6, 100), (px1 + 6, 100), ((px0 + px1) // 2, 84)])
    c.solid(ped, stone, 5, hl=1, sh=1)
    c.fill(c.poly([(px0, 98), (px1, 98), ((px0 + px1) // 2, 88)]), stone, 3)
    c.fill(c.rect(px0 - 6, 100, px1 + 6, 112), stone, 5)
    c.fill(c.rect(px0 - 6, 111, px1 + 6, 112), stone, 2)
    label = 'UNIVERSIDAD CENTRAL'
    c.fill(text_mask(c, label, (px0 + px1) // 2 - text_width(label) // 2, 104), c.R('carve', '#6E6252'), 2)
    for cx_ in (px0 - 2, px0 + 6, px1 - 12, px1 - 4):
        col = c.rect(cx_, 113, cx_ + 6, 172)
        c.solid(col, stone, 5, hl=1, sh=1, sh2=1)
        c.adjust(col & (((c.xx - cx_) % 3) == 2), -1)  # fluting
        c.fill(c.rect(cx_ - 1, 113, cx_ + 7, 115), stone, 6)
        c.fill(c.rect(cx_ - 1, 170, cx_ + 7, 172), stone, 6)
    door = c.ell(px0 + 14, 118, px1 - 14, 140) | c.rect(px0 + 14, 128, px1 - 14, 176)
    c.fill(door, dk, 2)
    c.tex(door, tex_planks_v(c, pw=6, x0=px0 + 14))
    c.fill(c.rect((px0 + px1) // 2, 122, (px0 + px1) // 2, 176), dk, 0)
    # warm light spilling from the half-open door
    c.fill(c.rect((px0 + px1) // 2 + 1, 132, (px0 + px1) // 2 + 6, 176), glow, 4)
    c.fill(c.rect(px0 - 8, 172, px1 + 8, 178), stone, 3)  # steps
    c.fill(c.rect(px0 - 8, 172, px1 + 8, 172), stone, 6)

    # right building (red plaster)
    rb = c.rect(296, 40, W - 1, 176)
    c.solid(rb, red, 3, hl=0, sh=1)
    c.tex(rb, tex_noise(c, 0.06, 0.03, seed=8))
    c.fill(c.rect(292, 36, W, 40), frame, 5)
    for row, wy in enumerate((54, 94)):
        for wx in (312, 352):
            balcony_window(c, wx, wy, 16, 26, frame, glass, rail, shutter=green, lit=(row == 1 and wx == 312), glow=glow)
    c.fill(c.rect(318, 142, 346, 176), dk, 2)

    # pavement + cobbled street
    walk = c.rect(0, 176, W - 1, 186)
    c.fill(walk, c.R('flag', '#8E8A90'), 4)
    c.tex(walk, tex_blocks(c, 16, 5, y0=176, seed=10))
    c.fill(c.rect(0, 186, W, 188), c.R('kerb', '#6E6A74'), 3)
    road = c.rect(0, 189, W - 1, H - 1)
    c.fill(road, c.R('granite', '#7A7680'), 3)
    c.tex(road, tex_cobbles(c, y0=189, seed=3))
    # dusk: everything below the roofline a tone cooler/darker toward the street
    c.dither_adjust(c.rect(0, 140, W, H), -0.35)
    c.dither_adjust(c.rect(0, 26, W, 139) & (c.R('glow', '#F0B860') != c.rid), -0.3)

    # plane tree turning orange (right) + fallen leaves
    bark = c.R('bark', '#7E7464')
    trunk(c, 352, 96, 186, 6, bark)
    c.adjust(c.rect(350, 110, 360, 186) & (((c.xx * 3 + c.yy) % 11) < 3), 1)  # mottled plane bark
    leaves = c.R('autumn', '#D2842E')
    canopy(c, 300, 40, 96, 70, leaves, seed=31, base=3, clumps=16)
    lf = c.R('leaf2', '#C26A2A')
    r = np.random.default_rng(4)
    for _ in range(70):
        lx, ly = r.integers(250, W), r.integers(178, H)
        c.fill(c.rect(lx, ly, lx + 1, ly), lf, int(r.integers(2, 5)))

    # gas lamps with glow
    lp = c.R('lampiron', '#22242A')
    for lx in (70, 300):
        c.solid(c.rect(lx, 128, lx + 2, 186), lp, 2, hl=1)
        c.solid(c.rect(lx - 3, 184, lx + 5, 187), lp, 2)
        c.fill(c.rect(lx - 4, 112, lx + 6, 113) | c.poly([(lx - 3, 112), (lx + 5, 112), (lx + 1, 106)]), lp, 2)
        c.fill(c.poly([(lx - 4, 114), (lx + 6, 114), (lx + 4, 128), (lx - 2, 128)]), c.R('gasglass', '#F6D488'), 5)
        c.fill(c.rect(lx, 118, lx + 2, 124), c.R('gasflame', '#FFF2C8'), 6)
        lamp_glow(c, lx + 1, 120, 52, 0.75, mask=~c.rect(lx - 5, 105, lx + 7, 129))
        lamp_glow(c, lx + 1, 190, 40, 0.5)
    lamp_glow(c, 197, 160, 26, 0.5)  # door spill

    shadow(c, 188, 204, 220, 209, -1)
    shadow(c, 112, 204, 140, 209, -1)
    shadow(c, 248, 204, 276, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(coat='over', coat_col='#2A2C36', holding='book', grade=g)
    gent = chars.man(skin='fair', hair='#6A5040', coat='frock', coat_col='#22222A', hat='top', hat_col='#18181E', holding='cane', beard=True, grade=g)
    lady = chars.woman(skin='fair', dress='euro', bodice='#4A2E3E', holding='bag', grade=g)
    img.alpha_composite(gent, (108, 207 - 75))
    img.alpha_composite(rz, (186, 207 - 75))
    img.alpha_composite(lady, (244, 207 - 75))
    return img.convert('RGB')


if __name__ == '__main__':
    im = build()
    im.save('out/scene_madrid.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_madrid.png')
    print('ok')
