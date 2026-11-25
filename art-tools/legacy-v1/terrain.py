import numpy as np
from PIL import Image
from global_land_mask import globe


def hx(h):
    h = h.lstrip('#'); return [int(h[i:i+2], 16) for i in (0, 2, 4)]


def render(lat0, lat1, lon0, lon1, W, H, seed=7, mountains=(), towns=(), tree_kind='palm', despeck=True, wave_rate=0.0045, lakes=()):
    rng = np.random.default_rng(seed)
    xs = lon0 + (np.arange(W) + 0.5) / W * (lon1 - lon0)
    ys = lat1 - (np.arange(H) + 0.5) / H * (lat1 - lat0)
    LON, LAT = np.meshgrid(xs, ys)
    land = globe.is_land(LAT, LON)
    if lakes:
        from PIL import ImageDraw
        m = Image.new('L', (W, H), 0); dm = ImageDraw.Draw(m)
        for poly in lakes:
            dm.polygon([((lo - lon0) / (lon1 - lon0) * W, (lat1 - la) / (lat1 - lat0) * H) for la, lo in poly], fill=1)
        land = land & (np.array(m) == 0)

    def shift(a, dy, dx, fill=False):
        out = np.full_like(a, fill)
        y0, y1 = max(dy, 0), H + min(dy, 0)
        x0, x1 = max(dx, 0), W + min(dx, 0)
        out[y0:y1, x0:x1] = a[y0 - dy:y1 - dy, x0 - dx:x1 - dx]
        return out

    if despeck:
        nb = sum(shift(land, dy, dx).astype(int) for dy, dx in [(-1,0),(1,0),(0,-1),(0,1)])
        land = np.where(land & (nb == 0), False, land)
        land = np.where(~land & (nb == 4), True, land)

    dist = np.full((H, W), 99); cur = land.copy(); dist[land] = 0
    for d in range(1, 13):
        g = cur | shift(cur,1,0) | shift(cur,-1,0) | shift(cur,0,1) | shift(cur,0,-1)
        dist[g & ~cur] = d; cur = g
    ldist = np.full((H, W), 99); cur = ~land; ldist[~land] = 0
    for d in range(1, 8):
        g = cur | shift(cur,1,0) | shift(cur,-1,0) | shift(cur,0,1) | shift(cur,0,-1)
        ldist[g & ~cur] = d; cur = g

    def noise(scale, s):
        r = np.random.default_rng(s)
        g = r.random((H // scale + 2, W // scale + 2))
        yy = np.arange(H) / scale; xx = np.arange(W) / scale
        y0 = yy.astype(int); x0 = xx.astype(int)
        fy = (yy - y0)[:, None]; fx = (xx - x0)[None, :]
        fy = fy * fy * (3 - 2 * fy); fx = fx * fx * (3 - 2 * fx)
        a = g[y0][:, x0]; b = g[y0][:, x0 + 1]; c = g[y0 + 1][:, x0]; d = g[y0 + 1][:, x0 + 1]
        return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy

    n1 = noise(24, seed + 1) * 0.6 + noise(8, seed + 2) * 0.3 + noise(3, seed + 3) * 0.1
    n2 = noise(14, seed + 4) * 0.7 + noise(5, seed + 5) * 0.3
    n3 = noise(6, seed + 6)
    chk = ((np.arange(H)[:, None] + np.arange(W)[None, :]) % 2 == 0)

    img = np.zeros((H, W, 3), np.uint8)
    img[:] = hx('#3D8FC6')
    img[dist <= 7] = hx('#56AEDB'); img[dist <= 3] = hx('#7FCCE6'); img[dist == 1] = hx('#D8F3F8')
    img[(dist == 8) & chk] = hx('#56AEDB'); img[(dist == 4) & chk] = hx('#7FCCE6')
    # inland water (lakes) get a calmer tone: water cells far from the frame edge but enclosed
    wav = (rng.random((H, W)) < wave_rate) & (dist >= 6)
    for y, x in zip(*np.nonzero(wav)):
        for dx, c in ((0, '#9EDCF0'), (1, '#C4ECF7'), (2, '#9EDCF0')):
            if x + dx < W and dist[y, x + dx] >= 4: img[y, x + dx] = hx(c)
        if y > 0 and x + 1 < W and dist[y - 1, x + 1] >= 4: img[y - 1, x + 1] = hx('#C4ECF7')

    L = land
    if tree_kind == 'palm':
        g1, g2, g3 = hx('#5FAE45'), hx('#6FBF4E'), hx('#82CC5C')
    else:
        g1, g2, g3 = hx('#7DBA4A'), hx('#8CC756'), hx('#9DD263')
    img[L] = g2; img[L & (n1 < 0.42)] = g1; img[L & (n1 > 0.58)] = g3
    img[L & (n1 < 0.42) & chk & (n1 > 0.39)] = g2; img[L & (n1 > 0.58) & chk & (n1 < 0.61)] = g2
    # rice paddies / farmland
    farm = L & (n2 > 0.6) & (ldist >= 2)
    blk = ((np.arange(H)[:, None] // 4) * 7 + (np.arange(W)[None, :] // 5) * 3) % 4
    if tree_kind == 'palm':
        img[farm & (blk == 0)] = hx('#A8D86A'); img[farm & (blk == 1)] = hx('#93CD5C'); img[farm & (blk == 2)] = hx('#B7DF78')
        rows = (np.arange(H)[:, None] % 4 == 0) & np.ones((1, W), bool)
        img[farm & rows & (blk == 2)] = hx('#8FD0C8')
    else:
        img[farm & (blk == 0)] = hx('#C9D97A'); img[farm & (blk == 1)] = hx('#A6CF61'); img[farm & (blk == 2)] = hx('#B9D46D')
    img[L & (ldist == 1)] = hx('#EBD9A2'); img[L & (ldist == 1) & (n3 > 0.7)] = hx('#DCC68A')

    out = Image.fromarray(img); px = out.load()

    def put(x, y, c):
        if 0 <= x < W and 0 <= y < H: px[x, y] = tuple(hx(c))

    def palm(x, y):
        if not (0 <= x < W and 0 <= y < H) or not land[y, x]: return
        for dx, dy, c in [(-2,0,'#3F8A2E'),(-1,0,'#5BAA3C'),(1,0,'#5BAA3C'),(2,0,'#3F8A2E'),(-1,-1,'#6DC048'),(0,-1,'#6DC048'),(1,-1,'#4E9A34'),
                          (0,0,'#4E9A34'),(-2,1,'#3F8A2E'),(2,1,'#3F8A2E'),(0,1,'#A2844F'),(0,2,'#8E7244'),(1,3,'#A2844F')]:
            put(x + dx, y + dy, c)

    def tree(x, y):
        if not (0 <= x < W and 0 <= y < H) or not land[y, x]: return
        for dx, dy, c in [(0,0,'#4F9338'),(1,0,'#6DB044'),(-1,1,'#3F7A2E'),(0,1,'#4F9338'),(1,1,'#6DB044'),(2,1,'#4F9338'),
                          (-1,2,'#3F7A2E'),(0,2,'#3F7A2E'),(1,2,'#4F9338'),(2,2,'#4F9338'),(0,3,'#3F7A2E'),(1,3,'#3F7A2E'),(0,4,'#6B4A2B'),(1,4,'#6B4A2B')]:
            put(x + dx, y + dy, c)

    plant = palm if tree_kind == 'palm' else tree
    forest = L & (n2 < 0.36) & (n3 > 0.3)
    pts = np.argwhere(forest); rng.shuffle(pts)
    taken = np.zeros((H, W), bool)
    for y, x in pts:
        if ldist[y, x] < 2: continue
        if taken[max(0, y-3):y+4, max(0, x-3):x+4].any(): continue
        taken[y, x] = True; plant(x, y)
    # coastal palms
    if tree_kind == 'palm':
        cpts = np.argwhere(L & (ldist == 2)); rng.shuffle(cpts)
        for y, x in cpts[: len(cpts) // 12]:
            if taken[max(0, y-3):y+4, max(0, x-3):x+4].any(): continue
            taken[y, x] = True; palm(x, y)

    def to_px(lat, lon):
        return int((lon - lon0) / (lon1 - lon0) * W), int((lat1 - lat) / (lat1 - lat0) * H)

    def mountain(x, y, snow=False, volcano=False):
        for row in range(9):
            for dx in range(-row, row + 1):
                c = '#B9B1A2' if dx < -row // 3 else '#7A7266' if dx > 0 else '#9C9384'
                if dx == 0: c = '#8A8274'
                if volcano and row <= 1: c = '#6E5A50'
                if snow and row <= 2: c = '#F4F6F8' if dx <= 0 else '#D5DDE5'
                put(x + dx, y + row, c)
            put(x - row - 1, y + row, '#5E574D'); put(x + row + 1, y + row, '#5E574D')
        if volcano:
            for dy, dx in [(-2, 0), (-3, 1), (-4, 0), (-5, 1)]: put(x + dx, y + dy, '#E8ECEF')
        for dx in range(-9, 10): put(x + dx, y + 9, '#4F9338')

    for (la0, la1), (lo0, lo1), cnt, snow, volc in mountains:
        for _ in range(cnt * 14):
            lat = rng.uniform(la0, la1); lon = rng.uniform(lo0, lo1)
            x, y = to_px(lat, lon)
            if not (0 <= y < H - 9 and 0 <= x < W): continue
            if not volc and (not land[y + 9, x] or not land[y + 4, x]): continue
            if not volc and taken[max(0, y-6):y+10, max(0, x-9):x+10].any(): continue
            taken[max(0, y-1):y+10, max(0, x-8):x+9] = True
            mountain(x, y, snow, volc); cnt -= 1
            if cnt <= 0: break

    def town(x, y):
        for hx0, hy0, w_ in [(-4, 0, 4), (1, -1, 4)]:
            for dx in range(w_):
                c = '#A6402C' if dx == w_ - 1 else '#C8553D'
                put(x + hx0 + dx, y + hy0, c); put(x + hx0 + dx, y + hy0 + 1, c)
            for dy in (2, 3, 4):
                for dx in range(w_): put(x + hx0 + dx, y + hy0 + dy, '#D8C7A6' if dx == w_ - 1 else '#F3E6CC')
            put(x + hx0 + 1, y + hy0 + 3, '#4A3A30')

    pos = {}
    for k, (lat, lon) in towns:
        x, y = to_px(lat, lon); town(x, y - 3)
        pos[k] = (round(x / W * 100, 2), round(y / H * 100, 2))
    return out, pos
