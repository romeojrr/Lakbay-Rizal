import numpy as np
from PIL import Image, ImageDraw
O = 'out/'
rng = np.random.default_rng(21)
W, H = 320, 180

def hx(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
def R(d, a, b, c, e, col): d.rectangle([a, b, c, e], fill=hx(col) if isinstance(col, str) else col)

def outline(im, col=(26, 22, 32, 255)):
    a = np.array(im); al = a[:, :, 3] > 0
    p = np.pad(al, 1); nb = p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
    a[nb & ~al] = col; return Image.fromarray(a)

# ---------- background ----------
a = np.zeros((H, W, 3), np.uint8)
n = rng.random((H, W))
a[:] = hx('#6FBF4E')
a[n < 0.18] = hx('#62B144'); a[n > 0.9] = hx('#82CC5C')
im = Image.fromarray(a); d = ImageDraw.Draw(im)
# grass tufts
for _ in range(260):
    x, y = rng.integers(0, W), rng.integers(0, H)
    R(d, x, y, x, y + 1, '#4F9A38'); R(d, x + 2, y, x + 2, y + 1, '#4F9A38'); R(d, x + 1, y - 1, x + 1, y + 1, '#5BA840')
# flowers
for _ in range(70):
    x, y = rng.integers(0, W), rng.integers(0, H)
    c = ['#F6F0E1', '#F2C94C', '#E86A8A'][rng.integers(0, 3)]
    R(d, x, y, x, y, c)
# sea bottom-right (diagonal coast) with beach
for y in range(H):
    cx = int(250 - (y - 60) * 1.3) if y > 60 else W + 10
    for x in range(max(cx - 6, 0), W):
        if x >= cx + 6:
            depth = x - cx
            c = '#7FCCE6' if depth < 14 else '#56AEDB' if depth < 34 else '#3D8FC6'
            if depth in (14, 34) and (x + y) % 2: c = '#7FCCE6' if depth == 14 else '#56AEDB'
            if 6 <= depth < 8: c = '#D8F3F8'
            im.putpixel((x, y), hx(c))
        elif x >= cx:
            im.putpixel((x, y), hx('#EBD9A2' if (x * 7 + y * 3) % 11 else '#DCC68A'))
        elif x >= cx - 2:
            im.putpixel((x, y), hx('#C8DB8A'))
for _ in range(40):
    y = rng.integers(70, H); cx = int(250 - (y - 60) * 1.3)
    x = rng.integers(cx + 20, W + 40)
    if x < W - 3:
        R(d, x, y, x + 2, y, '#C4ECF7'); R(d, x + 1, y - 1, x + 1, y - 1, '#C4ECF7')
# river from top to sea
pts = []
x = 92.0
for y in range(0, H):
    x += np.sin(y / 14) * 0.9 + 0.35
    pts.append((int(x), y))
for (rx, ry) in pts:
    cx = int(250 - (ry - 60) * 1.3) if ry > 60 else 999
    if rx > cx: break
    R(d, rx - 6, ry, rx + 6, ry, '#C8DB8A')
    R(d, rx - 5, ry, rx + 5, ry, '#56AEDB'); R(d, rx - 5, ry, rx - 4, ry, '#7FCCE6'); R(d, rx + 4, ry, rx + 5, ry, '#3D8FC6')
    if ry % 9 == 0: R(d, rx - 1, ry, rx + 1, ry, '#C4ECF7')
# dirt paths
path = '#C9A46A'; path_d = '#B08B52'
R(d, 0, 96, 236, 106, path); R(d, 0, 106, 236, 106, path_d)
R(d, 150, 30, 160, 96, path); R(d, 160, 30, 160, 96, path_d)
R(d, 40, 106, 50, 150, path); R(d, 50, 106, 50, 150, path_d)
R(d, 220, 40, 230, 96, path); R(d, 230, 40, 230, 96, path_d)
# wooden bridge across river on main path
br_x = [p for p in pts if p[1] == 100][0][0]
R(d, br_x - 9, 93, br_x + 9, 109, '#9A6A3E')
for xx in range(br_x - 9, br_x + 10, 3): R(d, xx, 93, xx, 109, '#7A5230')
R(d, br_x - 9, 92, br_x + 9, 92, '#5E3E24'); R(d, br_x - 9, 110, br_x + 9, 110, '#5E3E24')
for _ in range(90):
    x, y = rng.integers(0, 236), rng.integers(97, 105)
    if abs(x - br_x) > 10: im.putpixel((int(x), int(y)), hx('#B8925A'))

# plots (tilled soil footprints)
plots = {'school': (14, 40, 74, 92), 'clinic': (172, 24, 232, 76), 'water': (58, 116, 108, 162)}
for k, (x0, y0, x1, y1) in plots.items():
    R(d, x0, y0, x1, y1, '#A9824F'); R(d, x0, y1, x1, y1, '#8E6A3C')
    for yy in range(y0 + 3, y1, 4): R(d, x0 + 2, yy, x1 - 2, yy, '#977140')
# fences
def fence(x0, x1, y):
    R(d, x0, y, x1, y, '#8A5A3B'); R(d, x0, y + 3, x1, y + 3, '#8A5A3B')
    for xx in range(x0, x1 + 1, 6): R(d, xx, y - 2, xx + 1, y + 5, '#A6744E')
fence(4, 84, 116 - 4)
fence(176, 238, 84)
im = im.convert('RGBA')

def palm(x, y, s=1):
    p = Image.new('RGBA', (22, 30), (0, 0, 0, 0)); pd = ImageDraw.Draw(p)
    for i in range(16): R(pd, 10 + (i // 6), 12 + i, 12 + (i // 6), 12 + i, '#A2844F' if i % 3 else '#8E7244')
    for dx, dy, w_, h_ in [(-9, 2, 10, 3), (9, 2, 10, 3), (-7, -2, 8, 3), (7, -2, 8, 3), (-3, -5, 6, 3)]:
        R(pd, 11 + min(dx, 0) if dx < 0 else 11, 10 + dy, 11 + max(dx, 0) if dx > 0 else 11 + 0, 10 + dy + 2, '#4E9A34')
    R(pd, 3, 11, 19, 13, '#4E9A34'); R(pd, 5, 9, 17, 10, '#6DC048'); R(pd, 8, 7, 14, 8, '#6DC048'); R(pd, 1, 13, 3, 15, '#3F8A2E'); R(pd, 19, 13, 21, 15, '#3F8A2E')
    R(pd, 9, 12, 10, 13, '#8A5A2B'); R(pd, 12, 12, 13, 13, '#8A5A2B')
    p = outline(p)
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse([x + 4, y + 26, x + 18, y + 30], fill=(30, 60, 20, 70))
    im.alpha_composite(sh); im.alpha_composite(p, (x, y))

def bush(x, y):
    b = Image.new('RGBA', (12, 9), (0, 0, 0, 0)); bd = ImageDraw.Draw(b)
    bd.ellipse([0, 1, 11, 8], fill=hx('#3F8A2E')); bd.ellipse([1, 0, 8, 6], fill=hx('#5BAA3C')); R(bd, 3, 2, 4, 2, '#82CC5C')
    im.alpha_composite(outline(b), (x, y))

for x, y in [(6, 4), (120, 2), (128, 132), (196, 104), (262, 4), (286, 26), (100, 50), (2, 150), (240, 60)]:
    palm(x, y)
for x, y in [(80, 30), (112, 80), (168, 110), (16, 128), (134, 150), (205, 8), (250, 30), (120, 116)]:
    bush(x, y)

# ---------- buildings (transparent sprites) ----------
def nipa(w, h, wall='#D9B77A', wall_d='#B8955A', roof='#C9A24E', roof_d='#A6822F'):
    b = Image.new('RGBA', (w, h), (0, 0, 0, 0)); bd = ImageDraw.Draw(b)
    ry = h // 2
    bd.polygon([(2, ry), (w // 2, 2), (w - 3, ry)], fill=hx(roof))
    bd.polygon([(w // 2, 2), (w - 3, ry), (w // 2, ry)], fill=hx(roof_d))
    for yy in range(6, ry, 3): R(bd, w // 2 - (yy - 2), yy, w // 2 + (yy - 2), yy, roof_d)
    R(bd, 4, ry, w - 5, h - 6, wall); R(bd, w - 10, ry, w - 5, h - 6, wall_d)
    for xx in range(6, w - 5, 3): R(bd, xx, ry + 1, xx, h - 6, wall_d)
    R(bd, 4, h - 6, w - 5, h - 3, '#7A5230')
    for xx in range(6, w - 5, 8): R(bd, xx, h - 3, xx + 1, h - 1, '#5E3E24')
    return b, bd, ry

school, sd, ry = nipa(60, 48)
R(sd, 26, ry + 6, 34, 42, '#5E3E24'); R(sd, 10, ry + 6, 18, ry + 12, '#3A5A80'); R(sd, 42, ry + 6, 50, ry + 12, '#3A5A80')
R(sd, 18, ry - 6, 42, ry - 1, '#F6F0E1'); R(sd, 21, ry - 4, 39, ry - 3, '#3A3A46')
school = outline(school)

clinic, cd, ry = nipa(60, 48, wall='#F3EEE2', wall_d='#D6CDBA', roof='#B85B44', roof_d='#94432F')
R(cd, 26, ry + 6, 34, 42, '#5E3E24'); R(cd, 10, ry + 6, 18, ry + 12, '#3A5A80'); R(cd, 42, ry + 6, 50, ry + 12, '#3A5A80')
R(cd, 26, ry - 9, 34, ry - 1, '#F6F0E1'); R(cd, 29, ry - 8, 31, ry - 2, '#2F9E5B'); R(cd, 27, ry - 6, 33, ry - 4, '#2F9E5B')
clinic = outline(clinic)

water = Image.new('RGBA', (52, 48), (0, 0, 0, 0)); wd = ImageDraw.Draw(water)
for xx in (8, 20, 32, 44): R(wd, xx - 1, 18, xx, 44, '#7A5230')
R(wd, 4, 26, 48, 27, '#8A5A3B')
R(wd, 6, 4, 46, 20, '#9AA3AE'); R(wd, 6, 4, 46, 6, '#C5CCD4'); R(wd, 38, 4, 46, 20, '#7D8792')
R(wd, 8, 7, 36, 9, '#56AEDB'); R(wd, 10, 8, 14, 8, '#C4ECF7')
R(wd, 0, 36, 52, 39, '#A2844F'); R(wd, 0, 36, 52, 36, '#C2A46A')
for xx in range(2, 50, 6): R(wd, xx, 36, xx, 39, '#8E7244')
R(wd, 44, 39, 46, 47, '#A2844F'); R(wd, 43, 44, 47, 45, '#56AEDB')
water = outline(water)

sign = Image.new('RGBA', (16, 18), (0, 0, 0, 0)); sgd = ImageDraw.Draw(sign)
R(sgd, 7, 8, 8, 17, '#7A5230'); R(sgd, 1, 1, 14, 10, '#C9A46A'); R(sgd, 1, 1, 14, 2, '#E0C08A'); R(sgd, 1, 10, 14, 10, '#8E6A3C')
R(sgd, 7, 3, 8, 6, '#3A3A46'); R(sgd, 7, 8, 8, 8, '#3A3A46')
sign = outline(sign)

im.convert('RGB').save(O + 'dapitan_bg.png')
for k, s in [('school', school), ('clinic', clinic), ('water', water), ('sign', sign)]:
    s.save(O + f'dap_{k}.png')
# preview with all built
pv = im.copy()
pv.alpha_composite(school, (14, 40)); pv.alpha_composite(clinic, (172, 26)); pv.alpha_composite(water, (57, 114))
rz = Image.open(O + 'sprite_rizal.png'); pv.alpha_composite(rz, (130, 74))
pv.convert('RGB').resize((1280, 720), Image.NEAREST).save(O + 'dapitan_preview.png')
for k, (x0, y0, x1, y1) in plots.items():
    print(k, 'left', round(x0 / W * 100, 2), 'top', round(y0 / H * 100, 2), 'w', round((x1 - x0) / W * 100, 2), 'h', round((y1 - y0) / H * 100, 2))
print('ok')
