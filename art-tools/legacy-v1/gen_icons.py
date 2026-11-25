from PIL import Image, ImageDraw
import numpy as np
OUT = 'out/'

def outline(im, col=(26, 22, 32, 255)):
    a = np.array(im); al = a[:, :, 3] > 0
    p = np.pad(al, 1)
    nb = p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:]
    a[nb & ~al] = col
    return Image.fromarray(a)

def new():
    im = Image.new('RGBA', (26, 26), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)
def R(d, a, b, c, e, col): d.rectangle([a, b, c, e], fill=col)

icons = {}
# Calamba: bahay na bato house
im, d = new()
R(d, 4, 14, 21, 22, (232, 222, 200)); R(d, 4, 14, 21, 15, (170, 120, 80))
R(d, 3, 8, 22, 13, (150, 96, 60)); R(d, 3, 13, 22, 13, (110, 70, 44))
for x in (6, 11, 16): R(d, x, 9, x + 3, 12, (240, 230, 190)); R(d, x + 1, 9, x + 1, 12, (150, 96, 60))
d.polygon([(1, 8), (12, 2), (24, 8)], fill=(176, 72, 52)); R(d, 1, 7, 24, 8, (140, 52, 38))
R(d, 11, 17, 14, 22, (110, 70, 44)); R(d, 6, 17, 8, 19, (90, 120, 150)); R(d, 17, 17, 19, 19, (90, 120, 150))
icons['calamba'] = outline(im)
# Biñan: small school with bell
im, d = new()
R(d, 4, 11, 21, 22, (236, 226, 204)); R(d, 18, 11, 21, 22, (210, 198, 172))
d.polygon([(2, 11), (12, 4), (23, 11)], fill=(70, 110, 160)); R(d, 2, 10, 23, 11, (50, 84, 128))
R(d, 10, 1, 14, 5, (236, 226, 204)); R(d, 11, 2, 13, 4, (214, 170, 60))
R(d, 10, 16, 14, 22, (120, 80, 50)); R(d, 6, 14, 8, 17, (90, 120, 150)); R(d, 16, 14, 18, 17, (90, 120, 150))
icons['binan'] = outline(im)
# Manila: church facade with tower
im, d = new()
R(d, 3, 10, 22, 23, (214, 196, 160)); R(d, 18, 10, 22, 23, (186, 166, 128))
R(d, 9, 3, 16, 10, (214, 196, 160)); R(d, 11, 0, 14, 3, (214, 196, 160)); R(d, 12, -1, 13, 0, (90, 70, 50))
R(d, 11, 5, 14, 8, (60, 50, 44)); d.polygon([(3, 10), (12, 6), (22, 10)], fill=(176, 150, 110))
d.pieslice([9, 15, 16, 22], 180, 360, fill=(90, 60, 40)); R(d, 9, 18, 16, 23, (90, 60, 40))
R(d, 5, 13, 7, 17, (60, 80, 110)); R(d, 18, 13, 20, 17, (60, 80, 110))
icons['manila'] = outline(im)
# Madrid: university with columns
im, d = new()
d.polygon([(1, 9), (12, 3), (24, 9)], fill=(222, 206, 170)); R(d, 1, 9, 24, 10, (190, 170, 130))
for x in (3, 7, 11, 15, 19): R(d, x, 11, x + 2, 20, (240, 232, 210)); R(d, x + 2, 11, x + 2, 20, (200, 188, 160))
R(d, 1, 21, 24, 23, (190, 170, 130)); R(d, 10, 5, 14, 7, (214, 170, 60))
icons['madrid'] = outline(im)
# Paris: eye (ophthalmology)
im, d = new()
d.ellipse([2, 7, 23, 19], fill=(248, 246, 240)); d.ellipse([8, 7, 17, 18], fill=(70, 130, 190))
d.ellipse([10, 9, 15, 15], fill=(26, 22, 32)); R(d, 10, 9, 11, 10, (255, 255, 255))
d.arc([2, 3, 23, 19], 200, 340, fill=(26, 22, 32))
icons['paris'] = outline(im)
# Heidelberg: castle
im, d = new()
R(d, 2, 8, 7, 23, (190, 96, 80)); R(d, 18, 8, 23, 23, (170, 84, 70)); R(d, 7, 12, 18, 23, (200, 108, 90))
for x in (2, 5, 18, 21): R(d, x, 6, x + 1, 8, (190, 96, 80))
for x in (7, 10, 13, 16): R(d, x, 10, x + 1, 12, (200, 108, 90))
R(d, 10, 17, 14, 23, (70, 50, 40)); R(d, 4, 12, 5, 15, (60, 50, 44)); R(d, 20, 12, 21, 15, (60, 50, 44))
R(d, 0, 23, 25, 24, (90, 150, 70))
icons['heidelberg'] = outline(im)
# Berlin: Noli book
im, d = new()
R(d, 5, 3, 21, 22, (122, 46, 46)); R(d, 5, 3, 7, 22, (90, 32, 32)); R(d, 20, 4, 22, 22, (244, 236, 214))
R(d, 10, 7, 18, 8, (230, 200, 120)); R(d, 10, 10, 17, 10, (230, 200, 120)); R(d, 11, 14, 16, 18, (230, 200, 120))
R(d, 12, 15, 15, 17, (122, 46, 46))
icons['berlin'] = outline(im)

if __name__ == "__main__":
    for k, im in icons.items():
        im.save(OUT + f'icon_{k}.png')
    sheet = Image.new('RGBA', (26 * 7 * 4, 26 * 4), (240, 236, 226, 255))
    for i, im in enumerate(icons.values()):
        sheet.alpha_composite(im.resize((104, 104), Image.NEAREST), (i * 104, 0))
    sheet.save(OUT + 'icons_preview.png')
    print('ok')
