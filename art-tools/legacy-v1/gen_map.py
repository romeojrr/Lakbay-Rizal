import numpy as np
from PIL import Image
from global_land_mask import globe

W, H = 384, 288
LAT0, LAT1 = 35.5, 57.0
LON0, LON1 = -13.0, 28.25
rng = np.random.default_rng(7)

xs = LON0 + (np.arange(W) + 0.5) / W * (LON1 - LON0)
ys = LAT1 - (np.arange(H) + 0.5) / H * (LAT1 - LAT0)
LON, LAT = np.meshgrid(xs, ys)
land = globe.is_land(LAT, LON)

def shift(a, dy, dx, fill=False):
    out = np.full_like(a, fill)
    ys0, ys1 = max(dy, 0), H + min(dy, 0)
    xs0, xs1 = max(dx, 0), W + min(dx, 0)
    out[ys0:ys1, xs0:xs1] = a[ys0 - dy:ys1 - dy, xs0 - dx:xs1 - dx]
    return out

# clean single-pixel specks
nb = sum(shift(land, dy, dx).astype(int) for dy, dx in [(-1,0),(1,0),(0,-1),(0,1)])
land = np.where(land & (nb == 0), False, land)
land = np.where(~land & (nb == 4), True, land)

# distance from land for water (in px, up to 12)
dist = np.full((H, W), 99)
cur = land.copy()
dist[land] = 0
for d in range(1, 13):
    grown = cur | shift(cur,1,0) | shift(cur,-1,0) | shift(cur,0,1) | shift(cur,0,-1)
    dist[grown & ~cur] = d
    cur = grown

# distance from water for land
ldist = np.full((H, W), 99)
cur = ~land
ldist[~land] = 0
for d in range(1, 6):
    grown = cur | shift(cur,1,0) | shift(cur,-1,0) | shift(cur,0,1) | shift(cur,0,-1)
    ldist[grown & ~cur] = d
    cur = grown

def noise(scale, seed):
    r = np.random.default_rng(seed)
    gh, gw = H // scale + 2, W // scale + 2
    g = r.random((gh, gw))
    yy = np.arange(H) / scale
    xx = np.arange(W) / scale
    y0 = yy.astype(int); x0 = xx.astype(int)
    fy = (yy - y0)[:, None]; fx = (xx - x0)[None, :]
    fy = fy * fy * (3 - 2 * fy); fx = fx * fx * (3 - 2 * fx)
    a = g[y0][:, x0]; b = g[y0][:, x0 + 1]; c = g[y0 + 1][:, x0]; d = g[y0 + 1][:, x0 + 1]
    return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy

n1 = noise(24, 1) * 0.6 + noise(8, 2) * 0.3 + noise(3, 3) * 0.1
n2 = noise(14, 4) * 0.7 + noise(5, 5) * 0.3
n3 = noise(6, 6)

def hx(h):
    h = h.lstrip('#'); return [int(h[i:i+2], 16) for i in (0, 2, 4)]

img = np.zeros((H, W, 3), np.uint8)
# water
deep, mid, shallow, foam = hx('#3D8FC6'), hx('#56AEDB'), hx('#7FCCE6'), hx('#D8F3F8')
img[:] = deep
img[(dist <= 7)] = mid
img[(dist <= 3)] = shallow
img[(dist == 1)] = foam
# dithered transitions
chk = ((np.arange(H)[:, None] + np.arange(W)[None, :]) % 2 == 0)
img[(dist == 8) & chk] = mid
img[(dist == 4) & chk] = shallow
# waves
wav = (rng.random((H, W)) < 0.0045) & (dist >= 6)
for y, x in zip(*np.nonzero(wav)):
    for dx in (0, 1, 2):
        if x + dx < W and dist[y, x + dx] >= 4:
            img[y, x + dx] = hx('#9EDCF0') if dx != 1 else hx('#C4ECF7')
    if y > 0 and x + 1 < W and dist[y - 1, x + 1] >= 4:
        img[y - 1, x + 1] = hx('#C4ECF7')

# land base
g1, g2, g3, g4 = hx('#7DBA4A'), hx('#8CC756'), hx('#9DD263'), hx('#6CA83F')
L = land
img[L] = g2
img[L & (n1 < 0.42)] = g1
img[L & (n1 > 0.58)] = g3
img[L & (n1 < 0.42) & chk & (n1 > 0.39)] = g2
img[L & (n1 > 0.58) & chk & (n1 < 0.61)] = g2
# dry south (Iberia / Italy) warmer tones
dry = L & (LAT < 41.6 + (n1 - 0.5) * 5)
img[dry] = hx('#B3C76A')
img[dry & (n1 < 0.45)] = hx('#A4BD5E')
img[dry & (n1 > 0.6)] = hx('#C7D27C')
# farmland patchwork
farm = L & ~dry & (n2 > 0.6) & (LAT > 44)
blk = ((np.arange(H)[:, None] // 4) * 7 + (np.arange(W)[None, :] // 5) * 3) % 4
img[farm & (blk == 0)] = hx('#C9D97A')
img[farm & (blk == 1)] = hx('#A6CF61')
img[farm & (blk == 2)] = hx('#B9D46D')
rows = (np.arange(H)[:, None] % 4 == 0) & np.ones((1, W), bool)
img[farm & rows & (blk == 0)] = hx('#B7C766')
# beach
img[L & (ldist == 1)] = hx('#EBD9A2')
img[L & (ldist == 1) & (n3 > 0.7)] = hx('#DCC68A')
# coast shade line on south-facing beach
shade = L & (ldist == 2) & (~shift(land, -2, 0, True))
img[shade] = hx('#6CA83F')

out = Image.fromarray(img)
px = out.load()

def put(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        px[x, y] = tuple(hx(c))

def tree(x, y):
    if not (0 <= x < W and 0 <= y < H) or not land[y, x]: return
    dark, mid_, lite, trunk = '#3F7A2E', '#4F9338', '#6DB044', '#6B4A2B'
    for dx, dy, c in [(0,0,mid_),(1,0,mid_),(-1,1,dark),(0,1,mid_),(1,1,lite),(2,1,mid_),
                      (-1,2,dark),(0,2,dark),(1,2,mid_),(2,2,mid_),(0,3,dark),(1,3,dark),(0,4,trunk),(1,4,trunk),(1,0,lite)]:
        put(x + dx, y + dy, c)

def mountain(x, y, snow=True):
    rock, dark, lite, sn = '#9C9384', '#7A7266', '#B9B1A2', '#F4F6F8'
    for row in range(9):
        for dx in range(-row, row + 1):
            c = lite if dx < -row // 3 else dark if dx > 0 else rock
            if dx == 0: c = '#8A8274'
            if snow and row <= 2: c = sn if dx <= 0 else '#D5DDE5'
            if snow and row == 3 and dx < 0 and dx % 2: c = sn
            put(x + dx, y + row, c)
        put(x - row - 1, y + row, '#5E574D'); put(x + row + 1, y + row, '#5E574D')
    put(x, y - 1, '#5E574D')
    for dx in range(-9, 10):
        put(x + dx, y + 9, '#5E8A3A')

forest = L & ~dry & (n2 < 0.34) & (n3 > 0.35)
pts = np.argwhere(forest)
rng.shuffle(pts)
taken = np.zeros((H, W), bool)
for y, x in pts:
    if ldist[y, x] < 3: continue
    if taken[max(0, y-3):y+4, max(0, x-3):x+4].any(): continue
    taken[y, x] = True
    tree(x, y)

def to_px(lat, lon):
    return int((lon - LON0) / (LON1 - LON0) * W), int((LAT1 - lat) / (LAT1 - LAT0) * H)

ranges = [  # lat range, lon range, count, snow
    ((45.4, 47.4), (6.0, 14.5), 30, True),   # Alps
    ((42.4, 43.0), (-1.5, 2.8), 10, True),   # Pyrenees
    ((47.5, 49.5), (19.0, 26.0), 12, False), # Carpathians
    ((42.0, 44.5), (11.0, 14.0), 6, False),  # Apennines
    ((37.0, 37.3), (-3.8, -2.6), 3, True),   # Sierra Nevada
    ((42.0, 43.0), (19.0, 25.0), 8, False),  # Balkans
]
for (la0, la1), (lo0, lo1), cnt, snow in ranges:
    for _ in range(cnt * 12):
        lat = rng.uniform(la0, la1); lon = rng.uniform(lo0, lo1)
        x, y = to_px(lat, lon)
        if not (0 <= y < H and 0 <= x < W) or not land[min(H-1, y+9), x]: continue
        if taken[max(0, y-6):y+10, max(0, x-9):x+10].any(): continue
        taken[max(0, y-1):y+10, max(0, x-8):x+9] = True
        mountain(x, y, snow)
        cnt -= 1
        if cnt <= 0: break

def town(x, y):
    roof, roof2, wall, wall2, win = '#C8553D', '#A6402C', '#F3E6CC', '#D8C7A6', '#4A3A30'
    for hx0, hy0, w_ in [(-4, 0, 4), (1, -1, 4)]:
        for dx in range(w_):
            put(x + hx0 + dx, y + hy0, roof2 if dx == w_ - 1 else roof)
            put(x + hx0 + dx, y + hy0 + 1, roof2 if dx == w_ - 1 else roof)
        for dy in (2, 3, 4):
            for dx in range(w_):
                put(x + hx0 + dx, y + hy0 + dy, wall2 if dx == w_ - 1 else wall)
        put(x + hx0 + 1, y + hy0 + 3, win)
    for dx in range(-5, 6):
        put(x + dx, y + 5, '#5E8A3A')

cities = {
    'madrid': (40.42, -3.70), 'barcelona': (41.39, 2.17), 'biarritz': (43.48, -1.56),
    'paris': (48.86, 2.35), 'london': (51.51, -0.13), 'ghent': (51.05, 3.72),
    'heidelberg': (49.40, 8.67), 'leipzig': (51.34, 12.37), 'berlin': (52.52, 13.40),
    'leitmeritz': (50.53, 14.13),
}
for k, (lat, lon) in cities.items():
    x, y = to_px(lat, lon)
    town(x, y - 3)
    print(k, round(x / W * 100, 2), round(y / H * 100, 2))

out.save('out/map_europe.png')
out.resize((W * 3, H * 3), Image.NEAREST).save('out/map_europe_preview.png')
print('ok')
