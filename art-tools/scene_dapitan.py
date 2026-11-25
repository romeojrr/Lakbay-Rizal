"""Talisay, Dapitan, 1893 — golden hour by Dapitan Bay. Rizal (in exile) teaches his
pupils outdoors. Behind: his square house and the octagonal Casa Redonda, both of bamboo,
wood and nipa on stilts; a bamboo aqueduct from the hill; coconut palms; a banca on the
beach; the green hill behind ('a mountain greener than a leaf')."""
import numpy as np
from PIL import Image
from artkit import Canvas, tex_noise, tex_planks_v, tex_thatch, hx
from common import W, H, grade_fn, cloud, ridge, canopy, palm, shadow, lamp_glow
import chars


def stilts(c, x0, x1, y0, y1, rid, step=12):
    for px in range(x0, x1 + 1, step):
        c.solid(c.rect(px, y0, px + 2, y1), rid, 3, hl=1, sh=1)
        c.adjust(c.rect(px, y0 + 5, px + 2, y0 + 5) | c.rect(px, y0 + 12, px + 2, y0 + 12), -1)


def sawali(c, m, rid, base=3):
    c.fill(m, rid, base)
    c.adjust(m & ((((c.xx // 2) + (c.yy // 2)) % 2) == 0), 1)
    c.adjust(m & (c.yy % 6 == 0), -1)


def build():
    g = grade_fn('#FFC890', 0.10, contrast=1.04)
    c = Canvas(W, H, grade=g)
    sky_cols = ['#5A7EBE', '#7E96C8', '#A9AAC4', '#D6B6AE', '#F1C69C', '#FBD8A0', '#FFE9BE']
    c.gradient(c.rect(0, 0, W - 1, 130), c.R('sky', colors=[hx(h) for h in sky_cols]), 0, 6.6, 0, 130)
    cl = c.R('gcloud', colors=[hx(h) for h in ['#8E7E9E', '#B08E9E', '#D0A09C', '#E8B49A', '#F6CCA4', '#FCE0B8', '#FFF0D6']])
    cloud(c, 210, 30, 90, 10, cl, seed=7, base=4)
    cloud(c, 300, 56, 60, 8, cl, seed=3, base=5)
    # low sun on the left, behind the hill's shoulder
    c.fill(c.ell(24, 86, 48, 110), c.R('sun', '#FFF2C8'), 6)
    lamp_glow(c, 36, 98, 70, 0.6, mask=c.rect(0, 0, W, 130))

    # sea + distant island
    sea_cols = ['#2E5E7E', '#3C7494', '#4C8CA8', '#62A2B6', '#86BCC4', '#B6D6CE', '#F0E6C4']
    sea = c.R('sea', colors=[hx(h) for h in sea_cols])
    sm = c.rect(0, 128, W - 1, 186)
    c.gradient(sm, sea, 4.6, 2.2, 128, 186)
    r = np.random.default_rng(5)
    for _ in range(90):
        gx, gy = r.integers(200, W), r.integers(130, 180)
        c.fill(c.rect(gx, gy, gx + r.integers(1, 4), gy), sea, 6)
    isl = c.R('island', '#7C8EA0')
    ridge(c, isl, 131, 7, 0.05, 3, x0=262, x1=350, tone=3, y_max=130)

    # the green hill
    hill = c.R('hill', '#4E8A42')
    hm, yv = ridge(c, hill, 150, 70, 0.012, 2, x0=0, x1=250, peaks=[(70, 22, 50)], tone=3)
    c.dither_adjust(hm & (c.xx > 120), -0.4)
    forest = c.R('forest', '#3E7638')
    for i, fx in enumerate((0, 26, 52, 78, 104, 130, 156, 182, 14, 64, 116)):
        top = int(yv[min(len(yv) - 1, fx + 18)])
        fy = top + (2 if i < 8 else 16)
        canopy(c, fx, fy, 36, 20, forest, seed=60 + i, base=3 - (i >= 8), clumps=5)

    # ground: grass to the beach
    grass = c.R('grass', '#7AA848')
    gm = c.poly([(0, 150), (250, 150), (262, 172), (280, 186), (0, 186)]) | c.rect(0, 186, W - 1, H - 1)
    c.fill(gm, grass, 4)
    c.tex(gm, tex_noise(c, 0.10, 0.06, seed=9))
    sand = c.R('sand', '#E6CC98')
    beach = c.poly([(262, 172), (W, 160), (W, H), (300, H), (280, 186)])
    c.fill(beach, sand, 4)
    c.tex(beach, tex_noise(c, 0.06, 0.04, seed=12))
    c.fill(c.line([(262, 172), (W, 160)]), c.R('foam', '#F6F0E0'), 5)
    c.fill(c.line([(270, 168), (W, 157)]) & (c.xx % 5 < 3), c.R('foam', '#F6F0E0'), 4)

    bam = c.R('bamboo', '#C6AE66')
    saw = c.R('sawali', '#C9A86A')
    nipa = c.R('nipa', '#9A8250')
    wood = c.R('wood', '#7A5636')
    inter = c.R('inter', '#3A2A22')

    # bamboo aqueduct on trestles from the hill
    pipe = c.line([(0, 128), (60, 132), (120, 138)], 3)
    for tx_ in (14, 40, 66, 92):
        ty = 130 + tx_ // 10
        c.fill(c.line([(tx_ - 4, 160), (tx_ + 4, ty)]) | c.line([(tx_ + 4, 160), (tx_ - 4, ty)]), bam, 2)
    c.solid(pipe, bam, 4, hl=1, sh=1)
    c.adjust(pipe & ((c.xx % 9) == 0), -1)

    # Casa Residencia: square house of bamboo, wood and nipa, on stilts
    stilts(c, 34, 106, 150, 168, bam)
    c.solid(c.rect(30, 146, 112, 150), wood, 3, hl=1, sh=1)
    wall = c.rect(34, 116, 108, 146)
    sawali(c, wall, saw)
    c.fill(c.rect(34, 116, 34, 146) | c.rect(108, 116, 108, 146) | c.rect(70, 116, 71, 146), bam, 3)
    for wx in (42, 80):
        c.fill(c.rect(wx, 124, wx + 16, 138), inter, 1)
        c.solid(c.poly([(wx - 2, 124), (wx + 18, 124), (wx + 22, 116), (wx + 2, 116)]), saw, 4, hl=1)
        c.fill(c.line([(wx + 4, 116), (wx + 4, 125)]), bam, 2)
    roof = c.poly([(24, 118), (118, 118), (96, 88), (46, 88)])
    c.fill(roof, nipa, 3)
    c.tex(roof, tex_thatch(c, x0=24, y0=88))
    c.adjust(roof & c.poly([(24, 118), (46, 88), (60, 88), (40, 118)]), 1)
    c.adjust(roof & c.poly([(118, 118), (96, 88), (84, 88), (102, 118)]), -1)
    c.fill(c.rect(44, 86, 98, 88), nipa, 1)
    c.adjust(c.rect(34, 117, 108, 120), -1)
    lad = c.line([(112, 170), (104, 148)]) | c.line([(117, 170), (109, 148)])
    c.fill(lad, bam, 2)

    # Casa Redonda: the octagonal house (clinic / pupils' quarters), on stilts
    ox, ow = 150, 64
    stilts(c, ox + 4, ox + ow - 6, 150, 170, bam, step=14)
    c.solid(c.rect(ox, 146, ox + ow, 150), wood, 3, hl=1, sh=1)
    faces = [(ox + 2, ox + 15, 4), (ox + 15, ox + ow - 15, 3), (ox + ow - 15, ox + ow - 2, 2)]
    for a, b, tone in faces:
        fm = c.rect(a, 118, b, 146)
        sawali(c, fm, saw, base=tone)
        c.fill(c.rect(a, 118, a, 146), bam, tone)
    c.fill(c.rect(ox + 24, 124, ox + 40, 140), inter, 1)
    c.fill(c.rect(ox + 32, 124, ox + 32, 140), bam, 3)
    oroof = c.poly([(ox - 6, 120), (ox + ow + 6, 120), (ox + ow // 2, 78)])
    c.fill(oroof, nipa, 3)
    c.tex(oroof, tex_thatch(c, x0=ox, y0=78))
    for k, (x_a, t_) in enumerate(((ox + 12, 1), (ox + ow - 12, -1))):
        c.fill(c.line([(ox + ow // 2, 79), (x_a, 120)]), nipa, 2)
    c.adjust(oroof & c.poly([(ox - 6, 120), (ox + ow // 2, 78), (ox + 12, 120)]), 1)
    c.adjust(oroof & c.poly([(ox + ow + 6, 120), (ox + ow // 2, 78), (ox + ow - 12, 120)]), -1)
    c.fill(c.rect(ox + ow // 2 - 1, 74, ox + ow // 2 + 1, 79), bam, 3)
    c.adjust(c.rect(ox + 2, 119, ox + ow - 2, 122), -1)

    # palms + fruit tree
    trunkc = c.R('palmtrunk', '#8E7A58')
    frond = c.R('frond', '#5E9A3A')
    palm(c, 236, 176, 92, 14, frond, trunkc, seed=1)
    palm(c, 262, 170, 74, 22, frond, trunkc, seed=2)
    palm(c, 130, 160, 64, -10, frond, trunkc, seed=3)
    palm(c, 360, 190, 100, -18, frond, trunkc, seed=4)
    canopy(c, 0, 132, 30, 30, c.R('fruit', '#4C8A3A'), seed=9, base=3)

    # banca (outrigger canoe) on the beach
    hull = c.poly([(300, 192), (352, 192), (360, 186), (346, 198), (306, 198), (294, 186)])
    c.solid(hull, wood, 3, hl=1, sh=1)
    c.fill(c.rect(304, 190, 346, 191), c.R('paint', '#C9533A'), 3)
    c.fill(c.line([(306, 188), (296, 200)]) | c.line([(346, 188), (356, 200)]), bam, 3)
    c.fill(c.line([(286, 201), (366, 201)], 2), bam, 4)

    # long golden-hour shadows stretching right
    for sx, sy, ln in ((116, 206, 60), (170, 206, 46), (196, 206, 46), (222, 206, 46)):
        c.dither_adjust(c.poly([(sx, sy - 2), (sx + 14, sy - 2), (sx + 14 + ln, sy + 4), (sx + ln, sy + 4)]), -0.75)
    c.dither_adjust(c.rect(30, 168, 114, 176), -0.6)
    c.dither_adjust(c.rect(146, 170, 218, 178), -0.6)

    img = c.render().convert('RGBA')
    rz = chars.man(coat='shirt', shirt='#EEE8DA', trousers='#CFC4AE', hat='straw', hat_col='#D8B878', holding='book', grade=g).transpose(Image.FLIP_LEFT_RIGHT)
    b1 = chars.child(scale='boy', skin='brown', shirt='#E8DCC2', shorts='#6A5A4A', grade=g)
    b2 = chars.child(scale='boy', skin='rizal', shirt='#DCE4E8', shorts='#4A4A5A', grade=g)
    b3 = chars.child(scale='boy', skin='fair', shirt='#E6D2B0', shorts='#5A4A3A', grade=g, holding='books')
    img.alpha_composite(rz, (104, 207 - 75))
    img.alpha_composite(b1, (160, 207 - 60))
    img.alpha_composite(b2, (186, 207 - 60))
    img.alpha_composite(b3, (212, 207 - 60))
    return img.convert('RGB')


if __name__ == '__main__':
    im = build()
    im.save('out/scene_dapitan.png')
    im.resize((W * 3, H * 3), Image.NEAREST).save('out/prev_dapitan.png')
    print('ok')
