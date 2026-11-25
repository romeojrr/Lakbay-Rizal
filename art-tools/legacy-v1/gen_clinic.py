"""Builder sprite: the Casa Redonda clinic at Talisay — an octagonal nipa house on stilts (3/4 view)."""
from PIL import Image, ImageDraw
from gen_icons import outline


def hx(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def R(d, a, b, c, e, col):
    d.rectangle([a, b, c, e], fill=hx(col) if isinstance(col, str) else col)


W, H = 60, 52
im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
cx = 30
# stilts and cross-bracing
for x in (12, 21, 30, 39, 48):
    R(d, x - 1, 34, x, 49, '#6E4A2C'); R(d, x - 1, 34, x - 1, 49, '#8A5E3A')
d.line([(12, 38), (30, 46)], fill=hx('#5E3E24')); d.line([(48, 38), (30, 46)], fill=hx('#5E3E24'))
# bamboo steps to the door
for k in range(5):
    R(d, 26, 36 + k * 3, 34, 36 + k * 3, '#B8955A')
R(d, 25, 35, 25, 50, '#8A6A3C'); R(d, 35, 35, 35, 50, '#8A6A3C')
# floor platform (octagon edge seen from slightly above)
d.polygon([(10, 31), (16, 28), (44, 28), (50, 31), (44, 35), (16, 35)], fill=hx('#7A5230'))
# walls: three visible faces of the octagon (left-angled, front, right-angled)
d.polygon([(10, 20), (17, 22), (17, 33), (10, 31)], fill=hx('#E0CFA0'))      # left face (lit)
d.polygon([(17, 22), (43, 22), (43, 33), (17, 33)], fill=hx('#F0E6CC'))      # front face
d.polygon([(43, 22), (50, 20), (50, 31), (43, 33)], fill=hx('#C9B488'))      # right face (shade)
for x in range(19, 43, 3):
    R(d, x, 23, x, 32, '#D8C8A6')                                                # sawali weave hints
# door and windows (with propped awnings)
R(d, 27, 25, 33, 33, '#5E3E24'); R(d, 28, 26, 32, 33, '#4A2E1C')
for wx in (19, 36):
    R(d, wx, 25, wx + 4, 28, '#3A5A80'); d.line([(wx - 1, 24), (wx + 5, 22)], fill=hx('#A6822F'))
R(d, 12, 24, 14, 27, '#3A5A80')
# octagonal pyramid nipa roof
d.polygon([(4, 21), (12, 16), (cx, 2), (48, 16), (56, 21), (48, 24), (12, 24)], fill=hx('#C9A24E'))
d.polygon([(cx, 2), (48, 16), (56, 21), (48, 24), (cx, 24)], fill=hx('#A6822F'))
d.polygon([(cx, 2), (4, 21), (12, 16)], fill=hx('#D9B45E'))
for y in range(6, 24, 3):
    half = int((y - 2) * 1.25)
    R(d, max(5, cx - half), y, min(55, cx + half), y, '#9A7A30')
d.line([(cx, 2), (12, 24)], fill=hx('#8A6A28')); d.line([(cx, 2), (48, 24)], fill=hx('#8A6A28'))
R(d, cx - 1, 0, cx, 2, '#6E4A2C')
# small painted board with an eye (eye doctor) under the eave — no modern cross symbol
R(d, 25, 17, 34, 21, '#F6F0E1'); R(d, 27, 19, 32, 19, '#3A3A46'); R(d, 28, 18, 31, 20, '#3A3A46'); R(d, 29, 19, 30, 19, '#56AEDB')
im = outline(im)
im.save('out/dap_clinic.png')
im.resize((W * 5, H * 5), Image.NEAREST).save('out/dap_clinic_prev.png')
print('ok', im.size)
