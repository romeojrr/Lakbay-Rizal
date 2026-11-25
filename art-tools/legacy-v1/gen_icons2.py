"""Stamp icons for the remaining stops and 26x26 item icons (v2.1)."""
import math
from PIL import Image, ImageDraw
from gen_icons import outline

OUT = 'out/icons2/'
import os
os.makedirs(OUT, exist_ok=True)


def new():
    im = Image.new('RGBA', (26, 26), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def R(d, a, b, c, e, col):
    d.rectangle([a, b, c, e], fill=col)


def book(d, col, dark, page=(244, 236, 214), deco=(230, 200, 120)):
    R(d, 5, 3, 21, 22, col); R(d, 5, 3, 7, 22, dark); R(d, 20, 4, 22, 22, page)
    R(d, 10, 7, 18, 8, deco); R(d, 10, 10, 17, 10, deco)


def paper(d, x0=6, y0=3, x1=20, y1=23, lines=5, col=(244, 238, 222), ink=(70, 64, 76)):
    R(d, x0, y0, x1, y1, col); R(d, x1 - 2, y0, x1, y0 + 2, (210, 200, 180))
    for k in range(lines):
        y = y0 + 4 + k * 3
        if y < y1 - 1:
            R(d, x0 + 2, y, x1 - 3 - (k % 2) * 3, y, ink)


S, I = {}, {}
# ---------------- stamps ----------------
im, d = new()  # UST: silver quill pen with gold ribbon
d.polygon([(19, 2), (22, 4), (9, 20), (6, 21), (7, 18)], fill=(214, 220, 228)); d.line([(20, 3), (7, 20)], fill=(150, 160, 172))
d.polygon([(6, 21), (3, 24), (7, 22)], fill=(120, 120, 130)); R(d, 12, 12, 16, 14, (214, 170, 60)); R(d, 15, 14, 17, 18, (214, 170, 60))
S['ust'] = im
im, d = new()  # Barcelona: steamship
d.polygon([(2, 16), (24, 16), (21, 21), (5, 21)], fill=(40, 44, 60)); R(d, 5, 12, 19, 15, (236, 228, 210)); R(d, 8, 6, 11, 12, (178, 60, 50)); R(d, 8, 6, 11, 7, (30, 30, 36))
R(d, 14, 8, 15, 12, (90, 70, 50)); R(d, 0, 22, 25, 23, (80, 150, 200)); R(d, 7, 13, 8, 14, (90, 120, 150)); R(d, 12, 13, 13, 14, (90, 120, 150))
S['barcelona'] = im
im, d = new()  # Wilhelmsfeld: half-timbered house
R(d, 4, 11, 21, 22, (240, 232, 214)); d.polygon([(2, 12), (12, 3), (23, 12)], fill=(170, 74, 54))
for x in (4, 12, 20): R(d, x, 11, x + 1, 22, (80, 52, 38))
R(d, 4, 16, 21, 16, (80, 52, 38)); d.line([(4, 22), (12, 16)], fill=(80, 52, 38)); d.line([(13, 16), (21, 22)], fill=(80, 52, 38))
R(d, 7, 12, 9, 14, (90, 120, 150)); R(d, 15, 12, 17, 14, (90, 120, 150)); R(d, 0, 23, 25, 24, (90, 150, 70))
S['wilhelmsfeld'] = im
im, d = new()  # Leipzig: apple pierced by an arrow (Wilhelm Tell)
d.ellipse([6, 8, 20, 22], fill=(196, 50, 44)); d.ellipse([8, 10, 12, 14], fill=(240, 120, 100)); R(d, 13, 5, 13, 8, (90, 60, 40)); d.polygon([(14, 6), (19, 4), (16, 8)], fill=(90, 150, 70))
d.line([(1, 15), (25, 15)], fill=(120, 90, 60), width=1); d.polygon([(24, 13), (25, 15), (24, 17)], fill=(150, 150, 160)); R(d, 1, 13, 2, 17, (230, 230, 230))
S['leipzig'] = im
im, d = new()  # Leitmeritz: the chalice turret
d.polygon([(5, 4), (21, 4), (18, 12), (8, 12)], fill=(94, 150, 130)); R(d, 5, 4, 21, 5, (130, 190, 170)); R(d, 11, 12, 15, 17, (80, 130, 112))
d.ellipse([6, 16, 20, 21], fill=(94, 150, 130)); R(d, 3, 21, 22, 24, (226, 210, 176)); R(d, 6, 6, 7, 9, (150, 210, 190))
S['leitmeritz'] = im
im, d = new()  # Calamba 1887: doctor's bag
R(d, 3, 9, 22, 22, (92, 54, 40)); d.arc([8, 3, 17, 13], 180, 360, fill=(60, 36, 28), width=2); R(d, 3, 9, 22, 11, (120, 72, 52))
R(d, 10, 13, 15, 18, (240, 236, 226)); R(d, 12, 13, 13, 18, (196, 50, 44)); R(d, 10, 15, 15, 16, (196, 50, 44)); R(d, 11, 9, 14, 10, (214, 170, 60))
S['calamba1887'] = im
im, d = new()  # Japan: cherry blossom
for k in range(5):
    a = math.radians(-90 + k * 72); cx, cy = 13 + 6 * math.cos(a), 13 + 6 * math.sin(a)
    d.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=(244, 190, 206))
    d.point((int(cx + 3 * math.cos(a)), int(cy + 3 * math.sin(a))), fill=(220, 140, 166))
d.ellipse([10, 10, 16, 16], fill=(250, 220, 230)); R(d, 12, 12, 13, 13, (214, 120, 60))
S['japan'] = im
im, d = new()  # USA: locomotive
R(d, 4, 10, 16, 18, (46, 58, 52)); R(d, 15, 6, 22, 18, (110, 50, 36)); R(d, 16, 8, 21, 11, (60, 70, 80)); d.polygon([(4, 10), (9, 10), (10, 3), (3, 3)], fill=(40, 40, 46))
R(d, 2, 2, 11, 3, (40, 40, 46)); d.polygon([(0, 22), (5, 17), (5, 22)], fill=(170, 50, 40)); d.ellipse([6, 16, 12, 22], fill=(170, 50, 40)); d.ellipse([14, 15, 22, 23], fill=(170, 50, 40))
R(d, 11, 9, 13, 10, (214, 170, 60))
S['usa'] = im
im, d = new()  # London: the Reading Room dome
d.pieslice([3, 4, 23, 24], 180, 360, fill=(142, 158, 174)); R(d, 11, 1, 15, 4, (142, 158, 174)); R(d, 12, 0, 14, 1, (214, 170, 60))
for x in (6, 10, 14, 18): d.line([(13, 4), (x, 14)], fill=(201, 162, 74))
R(d, 2, 14, 24, 23, (220, 210, 190)); [R(d, x, 16, x + 2, 23, (110, 74, 50)) for x in (5, 11, 17)]
R(d, 2, 14, 24, 14, (201, 162, 74))
S['london'] = im
im, d = new()  # Paris 1889: Eiffel Tower
t = (138, 74, 54)
d.polygon([(12, 1), (14, 1), (15, 9), (11, 9)], fill=t); d.polygon([(10, 10), (16, 10), (19, 17), (7, 17)], fill=t)
d.polygon([(6, 18), (20, 18), (24, 25), (17, 25), (13, 20), (9, 25), (2, 25)], fill=t)
R(d, 9, 9, 17, 10, (100, 52, 38)); R(d, 6, 17, 20, 18, (100, 52, 38)); R(d, 13, 12, 13, 15, (230, 220, 200)); R(d, 14, 0, 17, 1, (46, 74, 154))
S['paris1889'] = im
im, d = new()  # Brussels: inkwell and quill on a page
paper(d, 3, 8, 19, 24, 4); d.ellipse([15, 13, 24, 22], fill=(40, 40, 52)); R(d, 17, 12, 21, 14, (60, 60, 72))
d.polygon([(19, 13), (24, 1), (25, 3), (21, 13)], fill=(236, 228, 210))
S['brussels'] = im
im, d = new()  # Biarritz: dark rock in the sea with foam
R(d, 0, 15, 25, 24, (62, 122, 154)); R(d, 0, 19, 25, 24, (50, 104, 136))
d.polygon([(6, 20), (8, 9), (12, 5), (16, 7), (19, 13), (20, 20)], fill=(78, 74, 74)); R(d, 9, 9, 10, 13, (110, 104, 104))
R(d, 12, 1, 13, 5, (240, 236, 226))
for x0 in (1, 19): d.arc([x0, 13, x0 + 7, 19], 180, 360, fill=(236, 244, 244))
R(d, 5, 19, 21, 20, (236, 244, 244))
S['biarritz'] = im
im, d = new()  # Ghent: El Fili (dark green-blue cover)
book(d, (40, 70, 90), (24, 46, 62)); R(d, 11, 14, 16, 18, (230, 200, 120))
S['ghent'] = im
im, d = new()  # Hong Kong: junk with batten sails
d.polygon([(3, 19), (23, 19), (20, 23), (6, 23)], fill=(74, 50, 38)); d.polygon([(7, 18), (9, 4), (15, 6), (14, 18)], fill=(176, 90, 58)); d.polygon([(15, 18), (17, 8), (22, 10), (21, 18)], fill=(176, 90, 58))
for y in (8, 11, 14, 17): R(d, 8, y, 14, y, (120, 56, 36))
for y in (11, 14, 17): R(d, 16, y, 21, y, (120, 56, 36))
R(d, 0, 24, 25, 25, (78, 138, 160))
S['hongkong'] = im
im, d = new()  # Tondo / La Liga: scroll with seal
R(d, 5, 4, 20, 21, (240, 232, 210)); d.ellipse([3, 2, 8, 7], fill=(214, 200, 170)); d.ellipse([17, 18, 22, 23], fill=(214, 200, 170))
for y in (7, 10, 13): R(d, 8, y, 17, y, (70, 64, 76))
d.ellipse([12, 14, 19, 21], fill=(170, 40, 36)); R(d, 15, 16, 16, 19, (220, 90, 80))
S['tondo'] = im
im, d = new()  # Fort Santiago: the alcohol stove
R(d, 7, 12, 19, 21, (140, 144, 152)); d.ellipse([5, 9, 21, 15], fill=(170, 174, 182)); R(d, 11, 7, 15, 9, (110, 114, 122)); R(d, 7, 21, 19, 22, (90, 94, 102))
R(d, 8, 14, 9, 19, (200, 204, 210)); d.polygon([(12, 4), (13, 1), (14, 4)], fill=(250, 200, 90))
S['fortsantiago'] = im
im, d = new()  # Bagumbayan: a single sampaguita flower, plain
for k in range(5):
    a = math.radians(-90 + k * 72); cx, cy = 13 + 5 * math.cos(a), 12 + 5 * math.sin(a)
    d.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=(246, 244, 236))
d.ellipse([10, 9, 16, 15], fill=(250, 248, 240)); R(d, 12, 11, 13, 12, (230, 210, 140)); R(d, 12, 17, 13, 24, (90, 140, 70)); d.polygon([(13, 21), (19, 18), (14, 23)], fill=(90, 140, 70))
S['bagumbayan'] = im

# ---------------- items ----------------
im, d = new(); d.ellipse([3, 6, 13, 16], fill=(250, 220, 120)); d.ellipse([5, 8, 11, 14], fill=(255, 246, 200)); R(d, 7, 16, 9, 22, (180, 150, 90))
d.polygon([(15, 6), (24, 3), (22, 9), (16, 9)], fill=(160, 150, 130)); d.polygon([(15, 10), (24, 9), (23, 14), (16, 12)], fill=(130, 120, 104)); R(d, 14, 8, 15, 11, (60, 50, 50))
I['moth-story'] = im
im, d = new(); d.polygon([(8, 1), (12, 1), (13, 10), (9, 10)], fill=(40, 70, 150)); d.polygon([(14, 1), (18, 1), (17, 10), (13, 10)], fill=(200, 50, 50)); d.ellipse([6, 9, 20, 23], fill=(214, 170, 60)); d.ellipse([9, 12, 17, 20], fill=(240, 210, 110))
I['ateneo-medal'] = im
im, d = new(); R(d, 3, 6, 22, 20, (244, 238, 222)); d.ellipse([1, 4, 6, 22], fill=(214, 200, 170)); [R(d, 8, y, 19, y, (70, 64, 76)) for y in (9, 12, 15)]
d.ellipse([14, 15, 21, 22], fill=(170, 40, 36)); R(d, 16, 21, 17, 25, (170, 40, 36)); R(d, 18, 21, 19, 24, (170, 40, 36))
I['medicine-diploma'] = im
im, d = new(); book(d, (122, 46, 46), (90, 32, 32)); R(d, 11, 14, 16, 18, (230, 200, 120)); R(d, 12, 15, 15, 17, (122, 46, 46))
I['noli-me-tangere'] = im
im, d = new(); d.polygon([(8, 5), (18, 5), (21, 19), (5, 19)], fill=(196, 160, 70)); d.ellipse([4, 15, 22, 21], fill=(196, 160, 70)); R(d, 11, 2, 15, 5, (150, 120, 50)); d.ellipse([11, 19, 15, 24], fill=(90, 70, 40))
R(d, 8, 7, 9, 16, (240, 210, 120))
I['talisay-school-bell'] = im
im, d = new(); book(d, (190, 160, 110), (150, 120, 80), deco=(90, 60, 40)); R(d, 10, 13, 12, 17, (90, 60, 40)); R(d, 14, 13, 16, 17, (90, 60, 40))
I['cartilla'] = im
im, d = new(); d.polygon([(19, 2), (22, 4), (9, 20), (6, 21), (7, 18)], fill=(214, 220, 228)); d.line([(20, 3), (7, 20)], fill=(150, 160, 172)); d.polygon([(6, 21), (3, 24), (7, 22)], fill=(120, 120, 130))
R(d, 12, 12, 16, 14, (214, 170, 60)); R(d, 15, 14, 17, 18, (214, 170, 60))
I['silver-pen'] = im
im, d = new(); R(d, 3, 3, 22, 23, (232, 226, 208)); R(d, 3, 3, 22, 7, (60, 56, 70)); R(d, 5, 4, 20, 5, (232, 226, 208))
for y in (10, 13, 16, 19): R(d, 5, y, 12, y, (90, 84, 96)); R(d, 14, y, 20, y, (90, 84, 96))
I['amor-patrio'] = im
im, d = new(); d.ellipse([4, 2, 18, 16], fill=(200, 200, 208)); d.ellipse([7, 5, 15, 13], fill=(60, 70, 90)); d.ellipse([9, 7, 13, 11], fill=(20, 20, 26)); R(d, 10, 16, 12, 24, (160, 120, 60)); R(d, 9, 22, 13, 24, (120, 90, 44))
I['ophthalmoscope'] = im
im, d = new()
for cx, cy in ((9, 9), (16, 8), (13, 15), (7, 16), (18, 15)):
    for k in range(5):
        a = math.radians(k * 72); d.ellipse([cx + 2 * math.cos(a) - 1, cy + 2 * math.sin(a) - 1, cx + 2 * math.cos(a) + 1, cy + 2 * math.sin(a) + 1], fill=(120, 166, 232))
    d.point((cx, cy), fill=(242, 212, 74))
R(d, 12, 19, 13, 25, (80, 130, 60)); d.line([(12, 20), (7, 17)], fill=(80, 130, 60)); d.line([(13, 20), (18, 16)], fill=(80, 130, 60))
I['forget-me-not'] = im
im, d = new()
for k in range(3):
    paper(d, 4 + k * 2, 5 - k * 2, 18 + k * 2, 22 - k * 2, 5)
I['noli-chapters'] = im
im, d = new(); d.ellipse([6, 8, 20, 22], fill=(196, 50, 44)); d.ellipse([8, 10, 12, 14], fill=(240, 120, 100)); R(d, 13, 5, 13, 8, (90, 60, 40))
d.line([(1, 15), (25, 15)], fill=(120, 90, 60)); d.polygon([(24, 13), (25, 15), (24, 17)], fill=(150, 150, 160)); R(d, 1, 13, 2, 17, (230, 230, 230))
I['wilhelm-tell'] = im
im, d = new(); R(d, 2, 5, 23, 21, (110, 60, 40)); R(d, 4, 6, 12, 20, (244, 236, 214)); R(d, 13, 6, 21, 20, (244, 236, 214)); R(d, 12, 6, 13, 20, (150, 120, 90))
d.line([(5, 15), (8, 12), (10, 16)], fill=(40, 40, 70)); d.line([(14, 16), (17, 12), (20, 15)], fill=(40, 40, 70)); [R(d, 5, y, 11, y, (120, 110, 120)) for y in (8, 10)]
I['memorial-book'] = im
im, d = new(); R(d, 3, 9, 22, 22, (92, 54, 40)); d.arc([8, 3, 17, 13], 180, 360, fill=(60, 36, 28), width=2); R(d, 3, 9, 22, 11, (120, 72, 52))
R(d, 10, 13, 15, 18, (240, 236, 226)); R(d, 12, 13, 13, 18, (196, 50, 44)); R(d, 10, 15, 15, 16, (196, 50, 44))
I['doctor-bag'] = im
im, d = new(); d.line([(3, 22), (12, 13), (22, 6)], fill=(90, 60, 50), width=2); d.line([(12, 13), (15, 20)], fill=(90, 60, 50))
for cx, cy in ((19, 5), (9, 12), (16, 20), (5, 18)):
    d.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=(244, 190, 206)); R(d, cx, cy, cx, cy, (220, 120, 150))
I['sakura-sprig'] = im
im, d = new(); R(d, 2, 7, 23, 19, (226, 210, 170)); R(d, 2, 7, 23, 9, (150, 50, 40)); [R(d, 4, y, 14, y, (90, 80, 70)) for y in (12, 15)]
d.ellipse([16, 11, 21, 16], fill=(150, 50, 40)); R(d, 17, 17, 22, 17, (90, 80, 70))
for x in range(2, 24, 3): d.point((x, 19), fill=(255, 255, 255, 0))
I['train-ticket'] = im
im, d = new(); R(d, 3, 5, 22, 20, (236, 228, 210)); R(d, 3, 5, 22, 8, (30, 60, 110)); R(d, 5, 11, 12, 11, (70, 64, 76)); R(d, 5, 14, 15, 14, (70, 64, 76)); R(d, 5, 17, 10, 17, (70, 64, 76))
d.ellipse([15, 11, 21, 17], fill=(200, 60, 50))
I['reader-ticket'] = im
im, d = new(); book(d, (150, 120, 80), (110, 86, 56), deco=(60, 40, 30)); R(d, 11, 14, 16, 15, (60, 40, 30)); R(d, 11, 17, 15, 17, (60, 40, 30))
I['annotated-morga'] = im
im, d = new(); R(d, 3, 3, 22, 23, (232, 226, 208)); R(d, 3, 3, 22, 8, (40, 40, 50)); R(d, 5, 5, 20, 6, (232, 226, 208))
for y in range(10, 22, 2): R(d, 5, y, 11, y, (90, 84, 96)); R(d, 14, y, 20, y, (90, 84, 96))
I['la-solidaridad'] = im
im, d = new()
for k in range(3):
    paper(d, 4 + k * 2, 5 - k * 2, 18 + k * 2, 22 - k * 2, 5, ink=(40, 50, 90))
d.polygon([(19, 13), (24, 1), (25, 3), (21, 13)], fill=(236, 228, 210))
I['fili-manuscript'] = im
im, d = new(); book(d, (40, 70, 90), (24, 46, 62)); R(d, 11, 14, 16, 18, (230, 200, 120))
I['el-filibusterismo'] = im
im, d = new(); R(d, 2, 7, 23, 19, (244, 240, 230)); R(d, 2, 7, 23, 7, (180, 170, 150)); [R(d, 6, y, 19, y, (60, 56, 70)) for y in (10, 13)]; R(d, 8, 16, 17, 16, (120, 116, 126))
I['calling-card'] = im
im, d = new(); R(d, 5, 4, 20, 21, (240, 232, 210)); d.ellipse([3, 2, 8, 7], fill=(214, 200, 170)); d.ellipse([17, 18, 22, 23], fill=(214, 200, 170))
for y in (7, 10, 13): R(d, 8, y, 17, y, (70, 64, 76))
d.ellipse([12, 14, 19, 21], fill=(170, 40, 36))
I['liga-constitution'] = im
im, d = new(); R(d, 4, 6, 21, 21, (244, 238, 222)); R(d, 4, 13, 21, 13, (200, 190, 170)); R(d, 12, 6, 12, 21, (220, 210, 190))
for y in (8, 10, 15, 17, 19): R(d, 6, y, 10, y, (70, 64, 76)); R(d, 14, y, 19, y, (70, 64, 76))
I['mi-ultimo-adios'] = im

for k, im in S.items():
    outline(im).save(f'{OUT}stamp_{k}.png')
for k, im in I.items():
    outline(im).save(f'{OUT}item_{k}.png')
allims = [outline(v) for v in list(S.values()) + list(I.values())]
sheet = Image.new('RGBA', (26 * 4 * 12, 26 * 4 * 4), (240, 236, 226, 255))
for i, im in enumerate(allims):
    sheet.alpha_composite(im.resize((104, 104), Image.NEAREST), ((i % 12) * 104, (i // 12) * 104))
sheet.save(OUT + 'preview.png')
print(len(S), 'stamps', len(I), 'items')
