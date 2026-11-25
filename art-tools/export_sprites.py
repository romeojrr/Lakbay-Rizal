"""Write the dialogue sprites (ungraded, native size) for every speaker added in v2.1."""
import os
import chars

OUT = 'out/sprites'
os.makedirs(OUT, exist_ok=True)
SPRITES = {
    'justiniano': chars.man(skin='brown', hair='#4A4448', hair_style='cropped', mustache=False, coat='shirt', shirt='#D9CCA8', trousers='#3E3A3A', holding='cane', shoes='#3A2A22'),
    'rizal_young': chars.man(mustache=False, coat='sack', coat_col='#2A2E3C', vest_col='#3A3E4E', holding='sheet'),
    'dominican': chars.man(skin='fair', hair='#3A3030', hair_style='cropped', cassock=True, coat_col='#ECE6D8', cape='#1E1C22', mustache=False),
    'barcelona_gentleman': chars.man(skin='fair', hair='#4A3A30', coat='frock', coat_col='#5A4A3A', trousers='#7A6E5E', hat='straw', hat_col='#D8C08A', holding='cane'),
    'de_wecker': chars.man(skin='fair', hair='#9A9490', hair_style='cropped', coat='frock', coat_col='#1E1E26', trousers='#3A3A44', beard=True, glasses=True),
    'ullmer': chars.man(skin='fair', hair='#7A6A58', hair_style='cropped', coat='frock', coat_col='#1C1C22', vest_col='#1C1C22', trousers='#24242C', shirt='#F2F0EA', beard=True, holding='book'),
    'blumentritt': chars.man(skin='pale', hair='#6A4E36', coat='frock', coat_col='#3A3430', vest_col='#5A4E44', trousers='#4A4440', beard=True, glasses=True),
    'seiko': chars.woman(skin='pale', dress='kimono', bodice='#4A5A8A', hair='#18141C'),
    'juan_luna': chars.man(skin='morena2', hair='#1C1820', coat_col='#4A3A30', vest_col='#6A5A44', trousers='#3E3A3A', hat='bowler', beard=True, holding='cane'),
    'nellie_boustead': chars.woman(skin='fair', dress='euro', bodice='#5A6A8A', hair='#3A2A22', hat_col='#E8E0D0'),
    'ghent_printer': chars.man(skin='pale', hair='#7A5A3A', coat='shirt', shirt='#E4DCCB', trousers='#3E3A40', apron='#B8AC90'),
    'liga_member': chars.man(skin='tan', hair='#241C1A', coat='shirt', shirt='#DCD2BC', trousers='#4A4440'),
    'teodora_older': chars.woman(skin='teodora', hair='#5A5458', saya='#3A2A34', tapis='#1E1C2A', camisa='#EEE8DA'),
    'rizal_shirtsleeves': chars.man(coat='shirt', shirt='#EAE2D0', vest_col='#3A3440', trousers='#2E2E38', holding='sheet'),
    'rizal_black_suit': chars.man(coat_col='#1C1C22', vest_col='#ECE6D8', trousers='#1C1C22'),
}
for k, im in SPRITES.items():
    im.save(f'{OUT}/{k}.png')
print(len(SPRITES), 'sprites')
