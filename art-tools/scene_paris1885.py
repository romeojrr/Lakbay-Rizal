"""Paris, winter 1885–86 — Dr. Louis de Wecker's eye clinic.
A tall Haussmann-era room: pale panelled walls, a high window on grey rooftops,
a glass instrument cabinet, a patient's chair, an ophthalmoscope lamp on a stand,
a gas chandelier. Rizal, his assistant, listens to the doctor."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_planks_h
from common import W, H, grade_fn, lamp_glow, shadow
from kit2 import place, euro_window, table, chair, oil_lamp
import chars


def build():
    g = grade_fn('#D8DEE8', 0.07, contrast=1.03)
    c = Canvas(W, H, grade=g)
    wallc = c.R('wall', '#D9D2C2')
    panel = c.R('panel', '#C9C0AC')
    wood = c.R('oak', '#7A5A3A')
    glass = c.R('sky', '#AEB8C4')
    roofs = c.R('zinc', '#6E7480')
    brass = c.R('brass', '#B8923E')
    steel = c.R('steel', '#9AA2AC')
    velvet = c.R('velvet', '#6A2A32')
    tile = c.R('parquet', '#8A6440')

    wall = c.rect(0, 0, W - 1, 172)
    c.fill(wall, wallc, 4)
    c.tex(wall, tex_noise(c, 0.04, 0.02, seed=1))
    # cornice and dado panels
    c.solid(c.rect(0, 0, W - 1, 8), wallc, 5, hl=1, sh=1)
    c.fill(c.rect(0, 9, W - 1, 10), wallc, 2)
    c.fill(c.rect(0, 120, W - 1, 122), panel, 2)
    for px in range(6, W, 52):
        pm = c.rect(px, 128, px + 44, 166)
        c.fill(pm, panel, 4)
        c.fill(pm & ~c.rect(px + 2, 130, px + 42, 164), panel, 2)
        c.fill(c.rect(px + 2, 130, px + 42, 130) | c.rect(px + 2, 130, px + 2, 164), panel, 5)
    for px in range(10, W, 120):
        pm = c.rect(px, 22, px + 70, 110)
        c.fill(pm & ~c.rect(px + 2, 24, px + 68, 108), panel, 3)

    # tall window onto Paris rooftops (grey winter sky)
    win = euro_window(c, 34, 18, 60, 104, wood, glass, mullion=False)
    rf = win & (c.yy > 84 + ((c.xx * 5) % 17) // 5)
    c.fill(rf, roofs, 3)
    c.fill(rf & (c.yy < 88 + ((c.xx * 5) % 17) // 5), roofs, 5)
    for chx in (44, 76):
        c.fill(c.rect(chx, 72, chx + 5, 88) & win, c.R('chimney', '#9A6A54'), 2)
        c.fill(c.rect(chx + 1, 70, chx + 1, 72) | c.rect(chx + 3, 70, chx + 3, 72), c.R('pot', '#B07A5A'), 3)
    c.fill(win & ((c.xx == 64) | (c.yy == 52) | (c.yy == 86)), wood, 2)
    c.solid(c.rect(28, 124, 100, 127), wood, 4, hl=1)
    # curtains
    for cx0, cx1 in ((22, 34), (94, 106)):
        cm = c.rect(cx0, 12, cx1, 140)
        c.solid(cm, velvet, 3, hl=1, sh=1)
        c.adjust(cm & ((c.xx % 4) == 0), -1)
    c.solid(c.rect(16, 10, 112, 13), brass, 4, hl=1)
    beam = c.poly([(38, 172), (96, 172), (160, H), (90, H)])

    # framed eye chart on the wall
    ch = c.rect(132, 30, 168, 90)
    c.solid(c.rect(129, 27, 171, 93), wood, 2, hl=1)
    c.fill(ch, c.R('card', '#F2EEE2'), 5)
    sizes = [7, 5, 4, 3, 2, 2, 1]
    yy = 34
    ink = c.R('ink', '#24242C')
    for i, s in enumerate(sizes):
        n = 1 + i
        tw = n * (s + 2)
        x = 150 - tw // 2
        for k in range(n):
            c.fill(c.rect(x + k * (s + 2), yy, x + k * (s + 2) + s - 1, yy + s), ink, 1)
            c.fill(c.rect(x + k * (s + 2) + 1, yy + 1, x + k * (s + 2) + s - 2, yy + s - 1) & ((c.xx + c.yy + k) % 2 == 0), c.R('card', '#F2EEE2'), 5)
        yy += s + 3

    # glass-fronted instrument cabinet
    cab = c.rect(290, 30, 360, 170)
    c.solid(cab, wood, 3, hl=1, sh=1)
    gl = c.rect(296, 38, 354, 120)
    c.fill(gl, c.R('cabglass', '#5E6A74'), 2)
    for sy in (58, 80, 102):
        c.fill(c.rect(296, sy, 354, sy + 1), c.R('shelfglass', '#B8C4CC'), 4)
    rng = np.random.default_rng(4)
    for sy in (52, 74, 96, 116):
        for k in range(8):
            x = 300 + k * 7
            if rng.random() < 0.25:
                continue
            h = int(rng.integers(3, 9))
            if rng.random() < 0.5:
                c.solid(c.rect(x, sy - h, x + 3, sy), c.R('bottle', '#6A8AA2'), 4, hl=1)
            else:
                c.fill(c.rect(x + 1, sy - h, x + 1, sy), steel, 5)
    c.fill(gl & ((c.xx == 325)), wood, 3)
    c.fill(gl & (((c.xx + c.yy) % 23) == 0), c.R('cabglass', '#5E6A74'), 6)
    for dy in (128, 148):
        c.fill(c.rect(294, dy, 356, dy), wood, 1)
        c.fill(c.rect(323, dy + 8, 327, dy + 9), brass, 5)

    # patient chair with headrest
    ch_ = c.R('leather', '#4A2E2A')
    c.solid(c.rect(240, 136, 274, 152), ch_, 3, hl=1, sh=1)
    c.solid(c.poly([(266, 96), (276, 96), (278, 152), (268, 152)]), ch_, 2, hl=1, sh=1)
    c.solid(c.ell(262, 86, 280, 98), ch_, 3, hl=1)
    c.fill(c.rect(244, 152, 246, 176) | c.rect(268, 152, 270, 176), steel, 3)
    c.fill(c.rect(240, 176, 274, 178), steel, 2)

    # ophthalmoscope lamp on a brass stand beside the chair
    c.fill(c.rect(226, 70, 227, 176), brass, 3)
    c.fill(c.rect(218, 176, 236, 178), brass, 2)
    c.fill(c.rect(226, 76, 246, 77), brass, 4)
    c.solid(c.ell(240, 70, 252, 84), c.R('shade', '#2E3A30'), 3, hl=1)
    c.fill(c.rect(244, 82, 248, 84), c.R('gflame', '#FFF0C0'), 6)
    lamp_glow(c, 246, 86, 50, 0.6, mask=~c.ell(239, 69, 253, 85))

    # small table with instruments tray
    table(c, 186, 148, 222, wood, h=24)
    c.solid(c.rect(190, 144, 214, 147), steel, 4, hl=1)
    for k in range(4):
        c.fill(c.rect(193 + k * 5, 145, 196 + k * 5, 145), steel, 6)
    # gas chandelier
    c.fill(c.rect(190, 0, 190, 22), brass, 3)
    c.fill(c.line([(176, 30), (190, 22), (204, 30)]), brass, 4)
    for gx in (176, 204):
        c.solid(c.ell(gx - 3, 28, gx + 3, 36), c.R('globe', '#F4E0B0'), 5, hl=1)
        lamp_glow(c, gx, 32, 36, 0.45, mask=~c.ell(gx - 4, 27, gx + 4, 37))

    # parquet floor
    fl = c.rect(0, 172, W - 1, H - 1)
    c.fill(fl, tile, 3)
    herr = ((c.xx // 6 + c.yy // 3) % 2 == 0)
    c.adjust(fl & herr & ((c.xx + c.yy) % 6 == 0), -1)
    c.adjust(fl & ~herr & ((c.xx - c.yy) % 6 == 0), 1)
    c.fill(c.rect(0, 172, W - 1, 173), wood, 1)
    c.dither_adjust(beam, 0.5)

    shadow(c, 128, 203, 160, 209, -1)
    shadow(c, 160, 203, 192, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(coat_col='#2A2E3C', grade=g)
    dw = chars.man(skin='fair', hair='#9A9490', hair_style='cropped', coat='frock', coat_col='#1E1E26', trousers='#3A3A44', beard=True, glasses=True, grade=g)
    anchors = {'rizal': place(img, rz, 126, flip=True), 'de-wecker': place(img, dw, 162)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_paris1885.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_paris1885.png')
    print(a)
