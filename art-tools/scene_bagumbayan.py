"""Bagumbayan, early morning of 30 December 1896 — shown without people.
The open field by Manila Bay at dawn: the bay calm and pale, a line of ships at
anchor, the promenade lamps of the Luneta, coconut palms, dew on the grass, a
quiet sky turning from rose to blue. No figures, no event: a place to stop and
remember (SRS GD-6)."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise
from common import W, H, grade_fn, sky, cloud, palm, shadow
from kit2 import water, reflect
import chars


def build():
    g = grade_fn('#F2C8B0', 0.08, contrast=1.02)
    c = Canvas(W, H, grade=g)
    sky(c, '#6E86B8', '#F2C8A8', 120)
    cl = c.R('dawncloud', '#F4D2C0')
    cloud(c, 30, 40, 110, 10, cl, seed=2)
    cloud(c, 230, 28, 120, 12, cl, seed=6)
    bay = c.R('bay', '#8A9EC0')
    wm = water(c, 120, 160, bay, seed=8, base=3, top_tone=5)
    # far Bataan mountains, faint
    c.fill(c.poly([(0, 120), (40, 112), (90, 108), (140, 114), (180, 120)]), c.R('bataan', '#9A9AB8'), 3)
    # ships at anchor (masts only, quiet)
    hull = c.R('hull', '#4A4A5A')
    for sx, sw in ((210, 24), (270, 18), (320, 28)):
        c.fill(c.rect(sx, 124, sx + sw, 127), hull, 2)
        c.fill(c.rect(sx + sw // 3, 104, sx + sw // 3, 124) | c.rect(sx + 2 * sw // 3, 108, sx + 2 * sw // 3, 124), hull, 2)
        shipm = c.rect(sx, 124, sx + sw, 127) | c.rect(sx + sw // 3, 104, sx + sw // 3, 124) | c.rect(sx + 2 * sw // 3, 108, sx + 2 * sw // 3, 124)
        reflect(c, shipm, 128, wm, -1)
    # sea wall and the paseo
    c.solid(c.rect(0, 158, W - 1, 164), c.R('seawall', '#B8AC98'), 4, hl=1, sh=1)
    pas = c.rect(0, 164, W - 1, 178)
    c.fill(pas, c.R('paseo', '#D8C8B0'), 4)
    c.tex(pas, tex_noise(c, 0.05, 0.04, seed=3))
    # lamp posts along the paseo
    for lx in (60, 170, 280):
        c.solid(c.rect(lx, 126, lx + 2, 170), c.R('post', '#3A3A44'), 3, hl=1)
        c.solid(c.poly([(lx - 4, 118), (lx + 6, 118), (lx + 4, 128), (lx - 2, 128)]), c.R('lampglass', '#E8DCC8'), 4, hl=1, sh=1)
    # dewy grass field in the foreground
    fld = c.rect(0, 178, W - 1, H - 1)
    c.fill(fld, c.R('grass', '#6E8A5A'), 3)
    c.tex(fld, tex_noise(c, 0.08, 0.08, seed=5))
    rng = np.random.default_rng(4)
    for _ in range(80):
        x, y = int(rng.integers(0, W)), int(rng.integers(180, H))
        c.fill(c.rect(x, y, x, y), c.R('dew', '#E8ECF0'), 5)
    # coconut palms framing the view
    for px, h, lean, sd in ((24, 104, 12, 1), (356, 96, -10, 2)):
        palm(c, px, 200, h, lean, c.R('frond', '#4E6A4A'), c.R('ptrunk', '#7A6A5A'), seed=sd)
        shadow(c, px - 16, 198, px + 20, 204, -1)
    # soft morning light on the water
    c.dither_adjust(c.ell(140, 120, 260, 150) & wm, 0.4)
    img = c.render().convert('RGB')
    return img, {}


if __name__ == '__main__':
    im, a = build()
    im.save('out/scene_bagumbayan.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_bagumbayan.png')
    print(a)
