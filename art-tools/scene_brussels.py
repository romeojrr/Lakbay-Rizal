"""Brussels, 1890 — Rizal's room in the Jacoby sisters' boarding house.
A winter evening: a narrow room with flowered wallpaper, a writing desk under the
lamp, letters and manuscript pages of the second novel, a washstand, a small iron
stove; through the window, Brussels' stepped gables under falling snow."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_planks_h
from common import W, H, grade_fn, sky, shadow, lamp_glow
from kit2 import place, table, chair, oil_lamp, petals
import chars


def build():
    g = grade_fn('#E0B880', 0.12, contrast=1.06)
    c = Canvas(W, H, grade=g)
    wallc = c.R('wall', '#7A6A5E')
    flower = c.R('wflower', '#A07A5A')
    wood = c.R('wood', '#5A3A26')
    night = c.R('night', '#2E3A5A')
    gable = c.R('gable', '#4A4A5E')
    lit = c.R('litwin', '#E8B860')
    paper = c.R('paper', '#EEE6D2')
    ink = c.R('ink', '#2E2A34')
    iron = c.R('iron', '#2A2A30')
    snow = c.R('snow', '#D6DCE6')

    wx0, wy0, wx1, wy1 = 200, 34, 290, 130
    win = c.rect(wx0, wy0, wx1, wy1)
    sky(c, '#1E2846', '#3E4A6A', wy1, y0=wy0)
    for gx, gw, gh in ((196, 30, 50), (226, 26, 64), (252, 40, 44)):
        top = wy1 - gh
        for k in range(4):
            c.fill(c.rect(gx + k * gw // 8, top + k * 5, gx + gw - k * gw // 8, wy1) & win, gable, 2)
        for wx in range(gx + 4, gx + gw - 4, 7):
            for wy in range(top + 22, wy1 - 4, 10):
                if (wx * 3 + wy) % 4:
                    c.fill(c.rect(wx, wy, wx + 2, wy + 4) & win, lit, 4)
        c.fill(c.rect(gx, top + 20, gx + gw, top + 21) & win, snow, 4)
    petals(c, win, snow, seed=4, density=0.03, tone=6)

    wall = c.rect(0, 0, W - 1, 172) & ~win
    c.fill(wall, wallc, 3)
    motif = (((c.xx % 12) - 6) ** 2 + ((c.yy % 14) - 7) ** 2 < 5) & (((c.xx // 12 + c.yy // 14) % 2) == 0)
    c.fill(wall & motif, flower, 3)
    c.fill(wall & motif & (((c.xx + c.yy) % 3) == 0), flower, 4)
    c.fill(c.rect(0, 0, W - 1, 6), c.R('ceiling', '#C8B89A'), 3)
    c.fill(c.rect(0, 140, W - 1, 172) & wall, wood, 2)
    c.fill(c.rect(0, 140, W - 1, 141) & wall, wood, 4)
    c.solid(c.rect(wx0 - 5, wy0 - 5, wx1 + 5, wy0 - 1) | c.rect(wx0 - 5, wy0, wx0 - 1, wy1 + 5) | c.rect(wx1 + 1, wy0, wx1 + 5, wy1 + 5), wood, 3, hl=1, sh=1)
    c.fill(win & ((c.xx == 245) | (c.yy == 82)), wood, 2)
    c.solid(c.rect(wx0 - 8, wy1 + 1, wx1 + 8, wy1 + 5), wood, 4, hl=1)
    for cx0 in (wx0 - 16, wx1 + 5):
        cm = c.rect(cx0, wy0 - 8, cx0 + 11, 150)
        c.solid(cm, c.R('curtain', '#6A3A3A'), 3, hl=1, sh=1)
        c.adjust(cm & (c.xx % 3 == 0), -1)

    # framed photographs and a calendar
    for px, py in ((40, 40), (70, 46)):
        c.solid(c.rect(px, py, px + 20, py + 26), wood, 2, hl=1)
        c.fill(c.rect(px + 3, py + 3, px + 17, py + 23), c.R('sepia', '#B8A07A'), 3)
        c.fill(c.ell(px + 6, py + 6, px + 14, py + 16), c.R('sepiad', '#6A5A44'), 2)

    # washstand at left with jug
    c.solid(c.rect(24, 120, 80, 172), wood, 3, hl=1, sh=1)
    c.solid(c.rect(20, 116, 84, 120), c.R('marble', '#D8D2C8'), 4, hl=1)
    c.solid(c.ell(36, 108, 60, 118), c.R('basin', '#EEEAE0'), 4, hl=1)
    c.solid(c.ell(42, 92, 54, 110), c.R('basin', '#EEEAE0'), 4, hl=1)
    # iron stove with pipe
    c.solid(c.rect(330, 120, 360, 168), iron, 2, hl=1, sh=1)
    c.solid(c.rect(342, 40, 348, 120), iron, 2, hl=1)
    c.fill(c.rect(336, 140, 354, 150), c.R('ember', '#E8743A'), 4)
    lamp_glow(c, 345, 145, 34, 0.5, mask=~c.rect(330, 120, 360, 168))

    # desk with lamp, manuscript, letters
    table(c, 196, 146, 300, wood, h=24, cloth=c.R('cloth', '#3E4A3A'))
    oil_lamp(c, 284, 130, radius=60, strength=0.7)
    for i in range(4):
        c.solid(c.rect(210 + i, 141 - i, 232 + i, 145 - i), paper, 5, hl=0, sh=1)
    c.fill(c.rect(214, 136, 230, 136) & (c.xx % 3 != 2), ink, 2)
    c.solid(c.poly([(240, 140), (256, 139), (256, 145), (240, 145)]), paper, 5, hl=1)
    c.fill(c.rect(242, 141, 254, 141) | c.rect(242, 143, 252, 143), ink, 2)
    c.solid(c.ell(262, 140, 268, 146), c.R('inkwell', '#2A2A34'), 3, hl=1)
    c.fill(c.line([(266, 142), (270, 132)]), c.R('quill', '#E8E0CC'), 5)
    chair(c, 172, 152, wood, facing=1)

    fl = c.rect(0, 172, W - 1, H - 1)
    c.fill(fl, wood, 3)
    c.tex(fl, tex_planks_h(c, ph=5, y0=172, seam=48, grain=0.1))
    rug = c.rect(100, 186, 300, 214)
    c.fill(rug, c.R('rug', '#6A2E2E'), 3)
    c.fill(rug & ~c.rect(104, 189, 296, 211), c.R('rugb', '#C8A060'), 3)
    c.adjust(rug & (((c.xx // 4 + c.yy // 4) % 2) == 0) & ~c.rect(104, 189, 296, 211), -1)
    c.dither_adjust(c.rect(0, 172, W - 1, H - 1) & ~c.ell(120, 160, 360, 230), -0.4)

    shadow(c, 138, 203, 170, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(coat='shirt', shirt='#EAE2D0', vest_col='#3A3440', trousers='#2E2E38', holding='sheet', grade=g)
    anchors = {'rizal': place(img, rz, 138, flip=True)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_brussels.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_brussels.png')
    print(a)
