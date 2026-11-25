"""Barcelona, June 1882 — La Rambla on a summer morning.
The tree-lined central promenade between rows of five-storey houses with iron
balconies and green shutters; gas lamps, a kiosk, plane trees in full leaf.
Rizal, just arrived from Manila, walks with a local gentleman."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_blocks, tex_cobbles
from common import W, H, grade_fn, sky, canopy, trunk, shadow
from kit2 import place, euro_window
import chars


def facade(c, x0, x1, y_top, col, frame, glass, shut, iron, floors=5, seed=0):
    rid = c.R(f'fac{seed}', col)
    m = c.rect(x0, y_top, x1, 170)
    c.solid(m, rid, 4, hl=0, sh=1)
    c.tex(m, tex_noise(c, 0.05, 0.03, seed=seed))
    c.solid(c.rect(x0 - 2, y_top - 4, x1 + 2, y_top), rid, 5, hl=1, sh=1)
    fh = (150 - y_top) // floors
    for f in range(floors):
        wy = y_top + 6 + f * fh
        for wx in range(x0 + 6, x1 - 10, 22):
            euro_window(c, wx, wy, 9, fh - 10, frame, glass, shutters=shut, mullion=True)
            if f in (1, 2):
                bal = c.rect(wx - 6, wy + fh - 9, wx + 15, wy + fh - 6)
                c.fill(c.rect(wx - 7, wy + fh - 5, wx + 16, wy + fh - 4), rid, 2)
                c.fill(bal & (((c.xx - wx) % 3) == 0), iron, 2)
                c.fill(c.rect(wx - 6, wy + fh - 9, wx + 15, wy + fh - 9), iron, 3)
        c.fill(c.rect(x0, wy + fh - 3, x1, wy + fh - 3), rid, 2)
    # ground floor shops with awnings
    for sx in range(x0 + 4, x1 - 20, 30):
        c.fill(c.rect(sx, 152, sx + 20, 170), c.R('shop', '#3A2E2A'), 1)
        aw = c.poly([(sx - 2, 146), (sx + 22, 146), (sx + 24, 152), (sx - 4, 152)])
        c.fill(aw, c.R('awn', '#B8443A'), 3)
        c.fill(aw & ((c.xx // 3) % 2 == 0), c.R('awn2', '#EADFC8'), 5)


def build():
    g = grade_fn('#F8E2B6', 0.08, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky(c, '#4E8CD0', '#D6E6F0', 60)
    frame = c.R('frame', '#5A4A3E')
    glass = c.R('glass', '#4E5A66')
    shut = c.R('shutter', '#4E6E52')
    iron = c.R('iron', '#2E2E34')
    leaf = c.R('plane', '#5E8A3E')
    bark = c.R('bark', '#9A9478')
    stone = c.R('paving', '#C4B49A')

    facade(c, -10, 120, 30, '#D8C29A', frame, glass, shut, iron, seed=1)
    facade(c, 122, 230, 22, '#C9A888', frame, glass, shut, iron, seed=2)
    facade(c, 232, 394, 34, '#E0D0B0', frame, glass, shut, iron, seed=3)

    # pavement and central promenade
    road = c.rect(0, 170, W - 1, H - 1)
    c.fill(road, stone, 4)
    c.tex(road, tex_cobbles(c, seed=5))
    prom = c.poly([(0, 182), (W, 182), (W, H), (0, H)])
    c.fill(prom, c.R('sand', '#D8C8A6'), 4)
    c.tex(prom, tex_noise(c, 0.05, 0.05, seed=9))
    c.fill(c.rect(0, 181, W - 1, 182), stone, 2)
    c.dither_adjust(c.rect(0, 170, W - 1, 176), -0.5)

    # plane trees (trunks with mottled bark) forming a canopy
    for tx, seed in ((24, 1), (152, 2), (290, 3), (370, 4)):
        tm = trunk(c, tx, 60, 192, 6, bark)
        c.adjust(tm & (((c.xx * 3 + c.yy * 5) % 11) < 3), 1)
        c.adjust(tm & (((c.xx * 5 + c.yy * 3) % 13) < 2), -1)
        shadow(c, tx - 16, 190, tx + 24, 197, -1)
    canopy(c, -20, 0, 110, 70, leaf, seed=11, base=3, clumps=12)
    canopy(c, 100, -6, 110, 64, leaf, seed=12, base=3, clumps=12)
    canopy(c, 240, -4, 160, 72, leaf, seed=13, base=3, clumps=16)
    # dappled shade on the promenade
    rng = np.random.default_rng(7)
    for _ in range(26):
        x, y = int(rng.integers(0, W)), int(rng.integers(184, H))
        c.adjust(c.ell(x, y, x + int(rng.integers(8, 26)), y + 3), -1)

    # gas lamp and a newspaper kiosk
    lp = c.rect(206, 118, 208, 190)
    c.solid(lp, iron, 3, hl=1)
    c.solid(c.poly([(201, 108), (213, 108), (211, 120), (203, 120)]), c.R('lampglass', '#E6DCB8'), 4, hl=1, sh=1)
    c.fill(c.poly([(200, 108), (207, 102), (214, 108)]), iron, 3)
    k = c.rect(318, 146, 350, 186)
    c.solid(k, c.R('kiosk', '#3E5A44'), 3, hl=1, sh=1)
    c.solid(c.poly([(312, 146), (334, 132), (356, 146)]), c.R('kiosk', '#3E5A44'), 2, hl=1)
    for py in range(152, 178, 8):
        c.solid(c.rect(321, py, 347, py + 5), c.R('papers', '#E8E0CC'), 4, hl=1)
        c.fill(c.rect(323, py + 1, 345, py + 1) & (c.xx % 3 != 0), c.R('ink', '#3A3440'), 2)

    shadow(c, 112, 203, 144, 209, -1)
    shadow(c, 148, 203, 180, 209, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(hat='bowler', hat_col='#2A2228', coat_col='#3A3E4E', vest_col='#4A4A58', trousers='#4A4650', grade=g)
    gent = chars.man(skin='fair', hair='#4A3A30', coat='frock', coat_col='#5A4A3A', trousers='#7A6E5E', hat='straw', hat_col='#D8C08A', holding='cane', grade=g)
    anchors = {'rizal': place(img, rz, 112, flip=True), 'gentleman': place(img, gent, 148)}
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_barcelona.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_barcelona.png')
    print(a)
