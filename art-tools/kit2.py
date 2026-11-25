"""Helpers shared by the v2.1 scenes: placing people, anchors, furniture, water, rain."""
import numpy as np
from PIL import Image
from artkit import tex_noise, tex_planks_v, tex_planks_h, BAYER
from common import W, H, lamp_glow


def place(img, sprite, x, feet=207, flip=False):
    """paste a sprite with its feet on `feet`; return its speaker anchor in % of the scene"""
    if flip:
        sprite = sprite.transpose(Image.FLIP_LEFT_RIGHT)
    top = feet - (sprite.height - 3)
    img.alpha_composite(sprite, (int(x), int(top)))
    return {'x': round((x + sprite.width / 2) / W * 200) / 2, 'y': round((top - 7) / H * 100)}


def bookshelf(c, x0, y0, x1, y1, wood, seed=1, shelf_h=13):
    rng = np.random.default_rng(seed)
    c.solid(c.rect(x0, y0, x1, y1), wood, 2, hl=1, sh=1)
    spines = [c.R('spine_r', '#7A2E2A'), c.R('spine_g', '#2E4A3A'), c.R('spine_b', '#2E3A5A'), c.R('spine_t', '#A08050'), c.R('spine_k', '#3A2E2A')]
    for sy in range(y0 + 3, y1 - shelf_h + 2, shelf_h):
        c.fill(c.rect(x0 + 2, sy, x1 - 2, sy + shelf_h - 3), wood, 0)
        x = x0 + 2
        while x < x1 - 3:
            bw = int(rng.integers(2, 4))
            bh = int(rng.integers(shelf_h - 6, shelf_h - 3))
            if rng.random() < 0.08:
                x += bw
                continue
            rid = spines[int(rng.integers(0, len(spines)))]
            m = c.rect(x, sy + shelf_h - 3 - bh, min(x + bw - 1, x1 - 3), sy + shelf_h - 4)
            c.fill(m, rid, int(rng.integers(2, 4)))
            c.fill(c.rect(x, sy + shelf_h - 3 - bh + 2, x, sy + shelf_h - 5) & m, rid, 4)
            if bh > shelf_h - 5:
                c.fill(c.rect(x, sy + shelf_h - 3 - bh + 3, min(x + bw - 1, x1 - 3), sy + shelf_h - 3 - bh + 3) & m, c.R('gilt', '#C9A24A'), 4)
            x += bw
        c.fill(c.rect(x0 + 1, sy + shelf_h - 3, x1 - 1, sy + shelf_h - 2), wood, 4)


def table(c, x0, y, x1, wood, h=26, cloth=None):
    top = c.rect(x0, y, x1, y + 3)
    c.solid(top, wood, 4, hl=1, sh=1)
    c.fill(c.rect(x0, y + 4, x1, y + 5), wood, 1)
    for lx in (x0 + 2, x1 - 4):
        c.solid(c.rect(lx, y + 4, lx + 2, y + h), wood, 2, hl=1)
    if cloth:
        c.solid(c.rect(x0 - 1, y - 1, x1 + 1, y + 10), cloth, 3, hl=1, sh=1)
        c.fill(c.rect(x0 - 1, y + 10, x1 + 1, y + 10) & (c.xx % 3 == 0), cloth, 1)


def chair(c, x, y, wood, facing=1):
    c.solid(c.rect(x, y, x + 9, y + 2), wood, 3, hl=1)
    bx = x if facing > 0 else x + 8
    c.solid(c.rect(bx, y - 16, bx + 1, y + 16), wood, 2, hl=1)
    c.fill(c.rect(min(bx, bx + 8 * facing), y - 14, max(bx, bx + 8 * facing) - 0, y - 13), wood, 3)
    c.fill(c.rect(x + 8 if facing > 0 else x, y + 3, x + 9 if facing > 0 else x + 1, y + 16), wood, 2)


def oil_lamp(c, x, y, radius=60, strength=0.85, base_rid=None):
    brass = base_rid or c.R('brass', '#B8923E')
    c.solid(c.ell(x - 4, y + 6, x + 4, y + 12), brass, 3, hl=1)
    c.fill(c.rect(x - 1, y + 2, x + 1, y + 6), brass, 4)
    c.solid(c.ell(x - 3, y - 6, x + 3, y + 3), c.R('chimney', '#F4E4B8'), 5, hl=1)
    c.fill(c.rect(x, y - 3, x, y), c.R('flame', '#FFF6D8'), 6)
    lamp_glow(c, x, y - 2, radius, strength, mask=~c.ell(x - 4, y - 7, x + 4, y + 12))


def paper_stack(c, x, y, w, paper, ink, n=3):
    for i in range(n):
        m = c.rect(x + i, y - i * 2, x + w + i, y - i * 2 + 1)
        c.solid(m, paper, 5, hl=0, sh=1)
    for ly in range(y - n * 2 + 3, y, 2):
        pass
    c.fill(c.rect(x + 2, y - 2 * n + 2, x + w - 3, y - 2 * n + 2) & (c.xx % 3 != 0), ink, 2)


def water(c, y0, y1, rid, seed=3, base=3, top_tone=4):
    m = c.rect(0, y0, W - 1, y1)
    c.gradient(m, rid, top_tone, base - 1, y0, y1)
    rng = np.random.default_rng(seed)
    for _ in range(int((y1 - y0) * 3.2)):
        yy = int(rng.integers(y0 + 1, y1))
        L = int(2 + (yy - y0) * 0.18 + rng.integers(0, 6))
        xx = int(rng.integers(0, W - L))
        c.adjust(c.rect(xx, yy, xx + L, yy), 1 if rng.random() < 0.6 else -1)
    return m


def reflect(c, src_mask, y_line, water_mask, d=-1):
    """mirror a mask below y_line inside water, broken into horizontal streaks"""
    ys, xs = np.nonzero(src_mask)
    out = np.zeros_like(src_mask)
    ny = 2 * y_line - ys
    ok = (ny >= 0) & (ny < c.H)
    out[ny[ok], xs[ok]] = True
    out &= water_mask & ((c.yy % 3) != 1)
    c.adjust(out, d)


def rain(c, mask, seed=9, density=0.012, rid=None, tone=5):
    rng = np.random.default_rng(seed)
    pts = np.argwhere(mask & (rng.random(mask.shape) < density))
    for y, x in pts:
        seg = c.line([(x, y), (x - 1, y + 4)])
        if rid is None:
            c.adjust(seg & mask, 1)
        else:
            c.fill(seg & mask, rid, tone)


def petals(c, mask, rid, seed=4, density=0.006, tone=5):
    rng = np.random.default_rng(seed)
    pts = np.argwhere(mask & (rng.random(mask.shape) < density))
    for y, x in pts:
        c.fill(c.rect(x, y, x + (1 if rng.random() < 0.5 else 0), y), rid, tone - int(rng.integers(0, 2)))


def euro_window(c, x, y, w, h, frame, glass, sill=None, arch=False, shutters=None, mullion=True, inner=None):
    if arch:
        c.fill(c.ell(x - 2, y - 2, x + w + 2, y + w // 2 + 2) | c.rect(x - 2, y + w // 4, x + w + 2, y + h + 2), frame, 4)
        win = c.ell(x, y, x + w, y + w // 2) | c.rect(x, y + w // 4, x + w, y + h)
    else:
        c.fill(c.rect(x - 2, y - 2, x + w + 2, y + h + 2), frame, 4)
        win = c.rect(x, y, x + w, y + h)
    c.gradient(win, glass, 4.5, 1.5, y, y + h)
    if inner is not None:
        c.fill(win & (c.yy > y + h * 0.55), inner, 1)
    c.fill(win & ((c.xx + c.yy) % 9 == 0) & (c.yy < y + h * 0.5), glass, 6)
    if mullion:
        c.fill(win & ((c.xx == x + w // 2) | (c.yy == y + h // 2) | (c.yy == y + h // 4) | (c.yy == y + 3 * h // 4)), frame, 2)
    if sill is not None:
        c.solid(c.rect(x - 4, y + h + 2, x + w + 4, y + h + 4), sill, 4, hl=1)
    if shutters is not None:
        sw = w // 2 + 1
        for sx in (x - sw - 3, x + w + 3):
            sm = c.rect(sx, y, sx + sw, y + h)
            c.solid(sm, shutters, 3, hl=1, sh=1)
            c.fill(sm & ((c.yy - y) % 3 == 0), shutters, 2)
    return win
