"""Berlin, March 1887 — inside the print works where Noli Me Tangere is printed.
A steam-age flatbed cylinder press driven by belts from an overhead line shaft,
brick walls, tall iron-framed windows onto snowy rooftops, gas lamps, type cases,
printed sheets drying. Rizal checks a sheet with Maximo Viola; a pressman works."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_planks_v, tex_planks_h, tex_bricks, hx
from common import W, H, grade_fn, lamp_glow, shadow
import chars


def ring(c, cx, cy, r0, r1):
    d = np.sqrt((c.xx - cx) ** 2 + (c.yy - cy) ** 2)
    return (d >= r0) & (d <= r1)


def build():
    g = grade_fn('#CBD8EE', 0.05, contrast=1.04)
    c = Canvas(W, H, grade=g)
    brick = c.R('brick', '#8C523E')
    lime = c.R('lime', '#D6CFBF')
    iron = c.R('iron', '#3A3F46')
    green = c.R('pressgreen', '#33403A')
    brass = c.R('brass', '#B8923E')
    leather = c.R('leather', '#6E4A2E')
    wood = c.R('wood', '#7E5A3C')
    paper = c.R('paper', '#ECE6D6')
    glass = c.R('winter', '#B9C6D4')
    snow = c.R('snow', '#E6ECF2')
    roofs = c.R('roofs', '#5C5E6A')

    wall = c.rect(0, 0, W - 1, 176)
    c.fill(wall, brick, 3)
    c.tex(wall, tex_bricks(c, 8, 4, seed=3))
    lw = c.rect(0, 136, W - 1, 176)
    c.fill(lw, lime, 4)
    c.tex(lw, tex_noise(c, 0.06, 0.0, seed=4))
    c.fill(c.rect(0, 134, W, 136), wood, 2)
    c.gradient(c.rect(0, 0, W - 1, 24), brick, 1, 3, 0, 24)
    c.tex(c.rect(0, 0, W - 1, 24), tex_bricks(c, 8, 4, seed=3))

    # tall iron-framed arched windows with a snowy Berlin roofscape
    for wx in (20, 186, 318):
        ww = 48
        win = c.ell(wx, 26, wx + ww, 50) | c.rect(wx, 38, wx + ww, 120)
        c.fill(c.ell(wx - 4, 22, wx + ww + 4, 54) | c.rect(wx - 4, 38, wx + ww + 4, 124), brick, 5)
        c.gradient(win, glass, 2, 4.6, 26, 96)
        rf = win & (c.yy > 92 + ((c.xx * 7) % 23) // 6)
        c.fill(rf, roofs, 2)
        c.fill(rf & (c.yy < 97 + ((c.xx * 7) % 23) // 6), snow, 5)
        for chx in (wx + 10, wx + 33):
            c.fill(c.rect(chx, 84, chx + 4, 96) & win, roofs, 1)
            c.fill(c.rect(chx, 83, chx + 4, 84) & win, snow, 5)
            c.fill(c.ell(chx - 2, 70, chx + 8, 80) & win, glass, 6)
        grid = win & ((((c.xx - wx) % 8) == 0) | (((c.yy - 26) % 9) == 0))
        c.fill(grid, iron, 2)
        c.fill(c.rect(wx - 5, 120, wx + ww + 5, 124), lime, 5)
        c.fill(c.rect(wx - 5, 119, wx + ww + 5, 119), snow, 6)
        # cool daylight falling on the floor
        beam = c.poly([(wx + 4, 176), (wx + ww - 4, 176), (wx + ww + 44, H), (wx + 30, H)])
        c.dither_adjust(beam, 0.55)

    # iron girder + line shaft + pulleys + belts
    c.solid(c.rect(0, 6, W - 1, 13), iron, 3, hl=1, sh=1)
    c.fill(c.rect(0, 9, W - 1, 9) & ((c.xx % 6) == 0), iron, 5)
    c.solid(c.rect(0, 25, W - 1, 27), iron, 4, hl=1, sh=1)
    for hx_ in (60, 150, 300):
        c.fill(c.rect(hx_, 13, hx_ + 2, 25), iron, 2)
    for px, pr in ((208, 9), (120, 6)):
        c.solid(c.ell(px - pr, 26 - pr, px + pr, 26 + pr), iron, 3, hl=1, sh=1)
        c.fill(c.ell(px - 2, 24, px + 2, 28), brass, 4)
    c.fill(c.line([(200, 28), (252, 106)], 2), leather, 2)
    c.fill(c.line([(216, 27), (292, 112)], 2), leather, 3)

    # drying line with printed sheets
    c.fill(c.line([(78, 62), (176, 66)]), c.R('string', '#8A7A60'), 3)
    for sx in range(82, 172, 14):
        sy = 62 + (sx - 78) // 25
        sm = c.rect(sx, sy, sx + 10, sy + 14)
        c.solid(sm, paper, 5, hl=0, sh=1)
        for ly in range(sy + 3, sy + 13, 2):
            c.fill(c.rect(sx + 2, ly, sx + 8 - (ly % 3), ly), c.R('print', '#3A3A44'), 2)

    # gas wall lamps
    for lx in (110, 300):
        c.fill(c.rect(lx - 6, 96, lx, 97) | c.rect(lx - 6, 92, lx - 6, 97), iron, 3)
        c.solid(c.ell(lx - 4, 84, lx + 4, 94), c.R('globe', '#F6DCA0'), 5, hl=1)
        c.fill(c.rect(lx - 1, 88, lx + 1, 91), c.R('gflame', '#FFF4D0'), 6)
        lamp_glow(c, lx, 90, 46, 0.7, mask=~c.ell(lx - 5, 83, lx + 5, 95))

    # type-case cabinet (left)
    cab = c.rect(14, 112, 88, 176)
    c.solid(cab, wood, 3, hl=1, sh=1)
    case = c.poly([(10, 112), (92, 112), (88, 102), (14, 102)])
    c.solid(case, wood, 4, hl=1, sh=1)
    comp = case & ((((c.xx - 14) % 5) == 0) | (((c.yy - 102) % 3) == 0))
    c.fill(comp, wood, 1)
    c.dither_adjust(case & ~comp, -0.3)
    for dy in range(118, 172, 9):
        c.fill(c.rect(18, dy, 84, dy), wood, 1)
        for dx in (30, 50, 70):
            c.fill(c.rect(dx, dy + 4, dx + 2, dy + 5), brass, 4)

    # flatbed cylinder press
    body = c.poly([(132, 146), (300, 146), (304, 176), (128, 176)])
    c.solid(body, green, 3, hl=1, sh=1, sh2=1)
    for ax in (150, 186, 222, 258):
        c.fill(c.ell(ax, 150, ax + 22, 168) | c.rect(ax, 160, ax + 22, 172), iron, 1)
    c.fill(c.rect(132, 146, 300, 147), green, 5)
    side = c.poly([(176, 104), (244, 104), (252, 146), (168, 146)])
    c.solid(side, green, 3, hl=1, sh=1)
    c.solid(c.ell(186, 108, 230, 150), green, 2, hl=1, sh=1)
    gear = ring(c, 208, 128, 17, 20) & ((np.round(np.degrees(np.arctan2(c.yy - 128, c.xx - 208)) / 12) % 2) == 0)
    c.fill(gear, brass, 4)
    c.solid(c.ell(193, 113, 223, 143), iron, 3, hl=1, sh=1)
    c.fill(c.ell(204, 124, 212, 132), brass, 5)
    c.fill(c.ell(182, 150, 196, 156), brass, 5)  # maker's plate
    for k, (rx, ry) in enumerate(((240, 110), (250, 104), (248, 118))):
        c.solid(c.ell(rx - 4, ry - 4, rx + 4, ry + 4), c.R('roller', '#1E1E24'), 3, hl=2, sh=1)
    # flywheel
    fw = ring(c, 276, 122, 22, 26)
    c.solid(fw, iron, 3, hl=1, sh=1)
    for a in range(0, 180, 30):
        t = np.radians(a)
        c.fill(c.line([(276 - 22 * np.cos(t), 122 - 22 * np.sin(t)), (276 + 22 * np.cos(t), 122 + 22 * np.sin(t))], 2), iron, 2)
    c.solid(c.ell(271, 117, 281, 127), iron, 4, hl=1)
    c.fill(c.ell(274, 120, 278, 124), brass, 5)
    # feed board with a paper stack, delivery table with printed sheets
    fb = c.poly([(150, 100), (196, 104), (196, 108), (150, 106)])
    c.solid(fb, wood, 4, hl=1)
    st = c.poly([(154, 94), (190, 97), (190, 103), (154, 100)])
    c.solid(st, paper, 5, hl=1, sh=1)
    c.adjust(st & ((c.yy % 2) == 0), -1)
    c.solid(c.rect(132, 130, 168, 134), wood, 4, hl=1)
    c.solid(c.rect(136, 126, 164, 130), paper, 5, hl=1, sh=1)
    c.fill(c.rect(140, 127, 160, 127) | c.rect(140, 129, 156, 129), c.R('print', '#3A3A44'), 2)
    c.fill(c.rect(134, 134, 136, 146) | c.rect(164, 134, 166, 146), iron, 2)

    # bundles of printed books, wrapped and tied
    wrap = c.R('wrap', '#B08A5E')
    for bx, by, bw, bh in ((316, 156, 30, 20), (348, 158, 28, 18), (322, 138, 26, 18), (350, 142, 22, 16)):
        m = c.rect(bx, by, bx + bw, by + bh)
        c.solid(m, wrap, 4, hl=1, sh=1)
        c.fill(c.rect(bx + bw // 2, by, bx + bw // 2, by + bh) | c.rect(bx, by + bh // 2, bx + bw, by + bh // 2), c.R('twine', '#E6D6B0'), 4)

    # floor
    fl = c.rect(0, 176, W - 1, H - 1)
    c.fill(fl, wood, 3)
    c.tex(fl, tex_planks_h(c, ph=5, y0=176, seam=46, grain=0.1))
    c.fill(c.rect(0, 176, W, 177), wood, 1)
    for ox, oy in ((214, 186), (250, 196), (60, 200)):
        c.adjust(c.ell(ox, oy, ox + 16, oy + 4), -1)
    c.dither_adjust(c.rect(128, 176, 304, 184), -0.6)  # press shadow

    shadow(c, 88, 204, 120, 209, -1)
    shadow(c, 124, 204, 156, 209, -1)
    shadow(c, 226, 198, 254, 203, -1)
    img = c.render().convert('RGBA')
    rz = chars.man(holding='sheet', grade=g)
    vi = chars.man(skin='viola', hair='#241C1A', coat_col='#5E4632', vest_col='#8A6A44', trousers='#4A3A30', hat='bowler', hat_col='#2E2420', tie='red', holding='envelope', grade=g).transpose(Image.FLIP_LEFT_RIGHT)
    pm = chars.man(skin='pale', hair='#5A4030', coat='shirt', shirt='#E4DCCB', trousers='#3E3A40', apron='#C9BC9C', hat='cap', hat_col='#3A3A44', grade=g)
    img.alpha_composite(pm, (224, 201 - 75))
    img.alpha_composite(rz, (86, 207 - 75))
    img.alpha_composite(vi, (124, 207 - 75))
    return img.convert('RGB')


if __name__ == '__main__':
    im = build()
    im.save('out/scene_berlin.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_berlin.png')
    print('ok')
