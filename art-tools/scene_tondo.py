"""Tondo, evening of 3 July 1892 — the founding of La Liga Filipina.
The upper hall of Doroteo Ongjunco's house on Ilaya Street: wide narra floorboards,
sliding capiz windows half open to the night, a long table under a hanging oil lamp,
the members gathered as Rizal reads the society's constitution."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_planks_h, tex_planks_v
from common import W, H, grade_fn, capiz_window, lamp_glow, shadow
from kit2 import place, table, chair
import chars


def build():
    g = grade_fn('#E0A868', 0.12, contrast=1.06)
    c = Canvas(W, H, grade=g)
    wood = c.R('narra', '#6A3E26')
    dark = c.R('dark', '#3A2A26')
    capiz = c.R('capiz', '#D8CCA8')
    night = c.R('night', '#1E2440')
    paper = c.R('paper', '#EEE6D2')
    brass = c.R('brass', '#B8923E')

    # wooden wall panels
    wall = c.rect(0, 0, W - 1, 172)
    c.fill(wall, wood, 2)
    c.tex(wall, tex_planks_v(c, pw=6, grain=0.06))
    c.fill(c.rect(0, 0, W - 1, 14), dark, 1)
    for bx in range(0, W, 48):
        c.solid(c.rect(bx, 0, bx + 8, 16), wood, 3, hl=1, sh=1)
    # windows: capiz panes slid half open, night outside with a few lights
    for wx in (20, 268):
        x0, y0, w, h = wx, 36, 96, 78
        c.fill(c.rect(x0, y0, x0 + w, y0 + h), night, 2)
        c.fill(c.rect(x0, y0 + h - 18, x0 + w, y0 + h), c.R('roofs', '#2A2A3A'), 2)
        for lx in range(x0 + 6, x0 + w - 4, 17):
            c.fill(c.rect(lx, y0 + h - 12, lx + 1, y0 + h - 10), c.R('farlight', '#E8B860'), 5)
        capiz_window(c, x0 + w // 2, y0, w // 2, h, wood, capiz, panes=4)
        c.solid(c.rect(x0 - 4, y0 - 4, x0 + w + 4, y0 - 1) | c.rect(x0 - 4, y0 + h + 1, x0 + w + 4, y0 + h + 4), wood, 3, hl=1, sh=1)
        c.fill(c.rect(x0, y0 + h + 6, x0 + w, y0 + h + 26) & ((c.xx - x0) % 8 < 2), dark, 1)  # ventanilla balusters
    # framed prints either side of the lamp
    for px in (140, 222):
        c.solid(c.rect(px, 40, px + 26, 70), dark, 2, hl=1)
        c.fill(c.rect(px + 3, 43, px + 23, 67), c.R('print', '#B8A07A'), 3)
        c.fill(c.ell(px + 8, 47, px + 18, 60), c.R('printd', '#6A5A44'), 2)
    # long table with cloth, papers, the hanging lamp
    c.fill(c.rect(190, 0, 190, 70), dark, 2)
    c.solid(c.ell(178, 70, 202, 82), brass, 3, hl=1)
    c.solid(c.ell(184, 60, 196, 74), c.R('chimney', '#F4E4B8'), 5, hl=1)
    c.fill(c.rect(190, 64, 190, 68), c.R('flame', '#FFF6D8'), 6)
    lamp_glow(c, 190, 74, 130, 0.9, mask=~c.ell(177, 59, 203, 83))
    table(c, 110, 150, 280, wood, h=24, cloth=c.R('cloth', '#E6DCC6'))
    for i, px in enumerate((126, 160, 214, 246)):
        c.solid(c.rect(px, 144 - (i % 2), px + 18, 147 - (i % 2)), paper, 5, hl=1, sh=1)
        c.fill(c.rect(px + 2, 145 - (i % 2), px + 15, 145 - (i % 2)) & (c.xx % 3 != 1), c.R('ink', '#2E2A34'), 2)
    c.solid(c.ell(196, 140, 204, 147), c.R('inkwell', '#2A2A34'), 3, hl=1)
    for chx in (90, 290):
        chair(c, chx, 158, wood, facing=1 if chx < 200 else -1)

    fl = c.rect(0, 172, W - 1, H - 1)
    c.fill(fl, wood, 3)
    c.tex(fl, tex_planks_h(c, ph=7, y0=172, seam=90, grain=0.08))
    c.adjust(fl & (((c.yy - 172) % 7) == 1), 1)
    c.dither_adjust(fl & ~c.ell(40, 150, 340, 240), -0.6)
    c.dither_adjust(wall & ~c.ell(30, 0, 350, 230), -0.4)

    for x0 in (64, 108, 172, 252, 296):
        shadow(c, x0, 203, x0 + 32, 209, -1)
    img = c.render().convert('RGBA')
    m1 = chars.man(skin='morena2', hair='#1E1A22', coat='shirt', shirt='#EAE2CE', trousers='#3A3A44', mustache=True, grade=g)
    m2 = chars.man(skin='brown', hair='#1E1A22', coat_col='#3A3430', vest_col='#4A4038', trousers='#3A3430', mustache=False, grade=g)
    m3 = chars.man(skin='tan', hair='#241C1A', coat='shirt', shirt='#DCD2BC', trousers='#4A4440', mustache=True, grade=g)
    m4 = chars.man(skin='morena2', hair='#1E1A22', coat_col='#2E3346', trousers='#3A3A44', mustache=True, grade=g)
    rz = chars.man(coat_col='#22242E', holding='sheet', grade=g)
    place(img, m1, 64, flip=True)
    place(img, m2, 108, flip=True)
    anchors = {'rizal': place(img, rz, 172)}
    anchors['member'] = place(img, m3, 252)
    place(img, m4, 296)
    return img.convert('RGB'), anchors


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_tondo.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_tondo.png')
    print(a)
