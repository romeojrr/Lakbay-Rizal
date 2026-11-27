"""The people in the v2.4 story pictures: Rizal at each age and the people the narration puts
with him. Same specs as the shipped sprites (export_sprites.py, the stop scenes), drawn with
each picture's colour grade so they sit in its light.

Only people the paragraph itself puts in that place are drawn. Where the narration does not say
he was there (the Dapitan steamer: Carnicero's run to the beach) or he was a prisoner out of sight
(Montjuïc), the picture has no people."""
import numpy as np
from PIL import Image
import chars
from common import shadow
from kit2 import place

# ---- Rizal ----
def jose_boy(g, books=False, barefoot=False):           # 7-11 (Calamba trip, Biñan, Ateneo)
    return chars.child(scale='boy', barefoot=barefoot, shirt='#F0EADC', shorts='#2E3446',
                       holding='books' if books else None, grade=g)

def rizal_young(g, holding=None):                       # 1882: twenty, no moustache yet (rizal_young)
    return chars.man(mustache=False, coat='sack', coat_col='#2A2E3C', vest_col='#3A3E4E', holding=holding, grade=g)

def rizal_suit(g, hat=None, holding=None):              # Europe and America (rizal_adult_suit)
    return chars.man(coat_col='#2E3346', hat=hat, holding=holding, grade=g)

def rizal_overcoat(g, hat='bowler'):                    # cold weather (rizal_adult_overcoat)
    return chars.man(coat='over', coat_col='#2A2C36', hat=hat, grade=g)

def rizal_shirt(g, holding='sheet'):                    # writing at home (rizal_shirtsleeves)
    return chars.man(coat='shirt', shirt='#EAE2D0', vest_col='#3A3440', trousers='#2E2E38', holding=holding, grade=g)

def rizal_light(g):                                     # the tropics: light suit, straw hat (Hong Kong)
    return chars.man(coat='sack', coat_col='#E8E2D2', vest_col='#D8D0BC', trousers='#C8BEA8', hat='straw', hat_col='#D8C08A', grade=g)

def rizal_hike(g):                                      # Makiling, 1887: shirtsleeves, straw hat
    return chars.man(coat='shirt', shirt='#EEE8DA', vest_col='#4A3E3A', trousers='#3E3A44', hat='straw', hat_col='#D8B878', grade=g)

def rizal_dapitan(g):                                   # Dapitan (rizal_dapitan)
    return chars.man(coat='shirt', shirt='#EEE8DA', trousers='#CFC4AE', hat='straw', hat_col='#D8B878', grade=g)

def rizal_black(g):                                     # December 1896 (rizal_black_suit)
    return chars.man(coat_col='#1C1C22', vest_col='#ECE6D8', trousers='#1C1C22', grade=g)

# ---- the people with him ----
def francisco(g):   # his father, Francisco Mercado, 1868: a farmer's camisa and a hat
    return chars.man(skin='tan', hair='#4A4448', coat='shirt', shirt='#E8E0CC', trousers='#3A3A44',
                     mustache=False, hat='salakot', hat_col='#C9A86A', grade=g)

def cousin(g):      # a cousin in Biñan, a little older
    return chars.child(scale='boy', skin='brown', shirt='#E8DCC2', shorts='#5A4A3A', grade=g)

def camps(g):       # Arturo Camps, a Frenchman, a friend of his father
    return chars.man(skin='fair', hair='#5A4030', coat='frock', coat_col='#3A3430', trousers='#5A5048',
                     hat='straw', hat_col='#D8C08A', grade=g)

def taviel(g):      # Lt. José Taviel de Andrade: a plain white tropical uniform and a cap
    return chars.man(skin='fair', hair='#3A2A22', coat='sack', coat_col='#E6E0D0', vest_col='#E6E0D0',
                     trousers='#E6E0D0', tie='none', hat='cap', hat_col='#E6E0D0', grade=g)

def luna(g):        # Juan Luna, indoors (no hat, no cane)
    return chars.man(skin='morena2', hair='#1C1820', coat_col='#4A3A30', vest_col='#6A5A44', trousers='#3E3A3A', beard=True, grade=g)

def hidalgo(g):     # Félix Resurrección Hidalgo
    return chars.man(skin='morena2', hair='#241C1A', coat_col='#22222A', vest_col='#3A3A44', trousers='#2A2A32', grade=g)

def blumentritt(g):
    return chars.man(skin='pale', hair='#6A4E36', coat='frock', coat_col='#3A3430', vest_col='#5A4E44', trousers='#4A4440', beard=True, glasses=True, grade=g)

def viola(g):
    return chars.man(skin='viola', hair='#241C1A', coat_col='#5E4632', vest_col='#8A6A44', trousers='#4A3A30', tie='red', grade=g)

def jesuit(g, hat=False):  # a Jesuit in his black cassock (Father Bech; Father Sánchez)
    return chars.man(skin='fair', hair='#2A2420', cassock=True, coat_col='#1C1A22', mustache=False,
                     hat='clergy' if hat else None, hat_col='#18161C', hair_style='cropped', grade=g)

def sanchez(g):     # Father Francisco de Paula Sánchez, older, in Dapitan
    return chars.man(skin='fair', hair='#9A9490', cassock=True, coat_col='#1C1A22', mustache=False, hair_style='cropped', grade=g)

def nellie(g):
    return chars.woman(skin='fair', dress='euro', bodice='#5A6A8A', hair='#3A2A22', hat_col='#E8E0D0', grade=g)

def alejandrino(g):  # José Alejandrino, a young engineering student
    return chars.man(skin='tan', hair='#1E1A22', mustache=False, coat_col='#3A3A44', vest_col='#4A4A54', trousers='#3A3A44', grade=g)


def stage(c, cast):
    """Render the canvas with its people standing in it: cast = [(sprite, x, feet, flip)].
    A soft shadow goes under each pair of feet first."""
    for sprite, x, feet, flip in cast:
        shadow(c, int(x) + 4, feet - 2, int(x) + sprite.width - 4, feet + 3, -1)
    img = c.render().convert('RGBA')
    for sprite, x, feet, flip in cast:
        place(img, sprite, x, feet=feet, flip=flip)
    return img.convert('RGB')


def foil(img, x0, y0, x1, y1, col=(200, 206, 214)):
    """A fencing foil drawn on the rendered picture (a thin blade, a small guard)."""
    from PIL import ImageDraw
    d = ImageDraw.Draw(img)
    d.line([(x0, y0), (x1, y1)], fill=col, width=1)
    d.rectangle([x0 - 1, y0 - 1, x0 + 1, y0 + 1], fill=(150, 150, 160))
