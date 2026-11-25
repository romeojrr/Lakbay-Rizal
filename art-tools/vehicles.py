"""Travel sprites for the map (SRS v2.3 §5.6 travel animation): a steamship for sea legs and
a steam train for land legs. Hand-placed pixels, ramps from artkit (light from the upper
left), selective outline like the character sprites.

    python3 vehicles.py      # writes out/travel_ship.png and out/travel_train.png (+ 4x previews)

Copy both to ../assets/sprites/.
"""
import os

from PIL import Image

from artkit import ramp, selout

os.makedirs('out', exist_ok=True)

HULL = ramp('#2b2430')      # dark hull
WOOD = ramp('#8a6440')      # deck and cars (the game's wood colour)
PAPER = ramp('#f6f0e1')     # sails, smoke
RED = ramp('#b23a2b')       # funnel band, buffer beam
IRON = ramp('#4e4658')      # boiler, wheels
BRASS = ramp('#d9a441')     # dome, lamp

KEY = {
    'H': HULL[3], 'h': HULL[5],
    'W': WOOD[3], 'w': WOOD[5], 'd': WOOD[1],
    'P': PAPER[3], 'p': PAPER[5], 's': PAPER[1],
    'R': RED[3], 'r': RED[5],
    'I': IRON[3], 'i': IRON[5], 'k': IRON[1],
    'B': BRASS[4],
}

# 24 x 16 steamship with a funnel and sails (faces right).
SHIP = """
........s...............
.......sPs..............
......sPPs..............
........P.......p.......
........R......pPp......
.......pRr.....pPPp.....
.......IIi....pPPPPp....
.......IIi...pPPPPPPp...
.......IIi..pPPPPPPPP...
...........d.....d......
..wWWWWWWWWWWWWWWWWWWw..
..hHHHHHHHHHHHHHHHHHHHh.
...hHHHHHHHHHHHHHHHHHh..
....hHHHHHHHHHHHHHHHh...
......kkkkkkkkkkkkkk....
........................
"""

# 24 x 14 steam locomotive with a tender (faces right).
TRAIN = """
................ss......
...............sPPs.....
................PP......
..........B.....kk......
..wWWWWw.iIIIIIIIIIi.B..
..WdddW..iIIIIIIIIIIiB..
..WdddW..IIIIIIIIIIIII..
..WWWWWWWIIIIIIIIIIIIIR.
..wWWWWWWIIIIIIIIIIIIIR.
...kk.kk..kIk..kIk..kk..
..kIik.kIk.kIik.kIik....
...kk..kk...kk...kk.....
........................
........................
"""


def draw(art):
    rows = [r for r in art.strip('\n').split('\n')]
    img = Image.new('RGBA', (len(rows[0]), len(rows)), (0, 0, 0, 0))
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch in KEY:
                img.putpixel((x, y), (*KEY[ch], 255))
    return selout(img)


for name, art in (('travel_ship', SHIP), ('travel_train', TRAIN)):
    img = draw(art)
    img.save(f'out/{name}.png')
    img.resize((img.width * 4, img.height * 4), Image.NEAREST).save(f'out/prev_{name}.png')
    print(name, img.size)
