"""Character sprites for Lakbay Rizal (v2).

Templates: adult man, adult woman, boy, small child. Clothing, hair and hats are
options, so the same body reads as Rizal in Berlin, a Jesuit in Manila, or a
student in Dapitan. Light comes from the upper left in every scene.
"""
import numpy as np
from artkit import Canvas, N, selout, hx

SKIN_RAMPS = {
    'morena': ['#3A2428', '#5C3A34', '#82543F', '#A06C4E', '#BB8660', '#D3A27A', '#E6BF98'],
    'morena2': ['#36222A', '#563632', '#7A4E3C', '#97664A', '#B27E5A', '#CA9A72', '#DEB690'],
    'brown': ['#2C1C20', '#462C2A', '#664034', '#835740', '#9E6F50', '#B88A66', '#CFA684'],
    'fair': ['#4A2E34', '#764C48', '#A07062', '#C08E78', '#D9AB92', '#EBC6AC', '#F7DEC8'],
    'pale': ['#4E3438', '#7E5654', '#A87C70', '#C79C88', '#DFB8A2', '#EFD0BC', '#FAE6D6'],
}
SKIN = {'rizal': 'morena', 'teodora': 'morena2', 'viola': 'morena2', 'tan': 'morena', 'brown': 'brown', 'fair': 'fair', 'pale': 'pale'}


def skin_ramp(c, skin):
    key = SKIN.get(skin, skin)
    return c.R('skin', colors=[hx(h) for h in SKIN_RAMPS[key]])


def _face(c, sk, hr, x, y, mustache=False, female=False, beard=False):
    """features for a 3/4 face looking toward viewer-left. (x,y) = left eye position"""
    eye = c.R('eye', colors=[(24, 18, 30)] * 3 + [(60, 46, 50)] * 4)
    # brows
    c.fill(c.rect(x - 1, y - 2, x + 1, y - 2), hr, 1 if not female else 2)
    c.fill(c.rect(x + 4, y - 2, x + 6, y - 2), hr, 1 if not female else 2)
    # eyes (2px tall, glint on near eye)
    c.fill(c.rect(x, y, x, y + 1), eye, 0)
    c.fill(c.rect(x + 5, y, x + 5, y + 1), eye, 0)
    c.fill(c.rect(x - 1, y, x - 1, y), sk, 5)
    # nose: lit bridge, shadow on the far side, small tip
    c.fill(c.rect(x + 2, y + 1, x + 2, y + 2), sk, 4)
    c.fill(c.rect(x + 3, y + 2, x + 3, y + 3), sk, 1)
    c.fill(c.rect(x + 2, y + 3, x + 2, y + 3), sk, 3)
    # mouth
    if mustache:
        c.fill(c.rect(x, y + 5, x + 1, y + 5) | c.rect(x + 3, y + 5, x + 5, y + 5), hr, 2)
        c.fill(c.rect(x + 2, y + 5, x + 2, y + 5), hr, 1)
        c.fill(c.rect(x + 1, y + 6, x + 4, y + 6), sk, 2)
    else:
        lip = c.R('lip', '#A8564E') if female else sk
        c.fill(c.rect(x + 1, y + 5, x + 4, y + 5), lip, 2 if female else 1)
    if beard:
        c.fill(c.rect(x - 1, y + 6, x + 5, y + 8), hr, 2)
    # cheekbone catch-light on the lit side
    c.fill(c.rect(x - 1, y + 2, x - 1, y + 3), sk, 4)


def man(skin='rizal', hair='#1E1A22', hair_style='side', mustache=True, coat='sack', coat_col='#2E3346',
        vest_col='#3B3E50', trousers='#3A3A44', shirt='#ECE6D8', tie='bow', hat=None, hat_col='#2A2228',
        apron=None, holding=None, shoes='#241C1C', beard=False, grade=None, cassock=False, cape=None, glasses=False):
    W, H, oy = 34, 78, 8
    c = Canvas(W, H, grade=grade)
    y = lambda v: v + oy
    sk = skin_ramp(c, skin)
    hr = c.R('hair', hair)
    sh = c.R('shirt', shirt)
    tr = c.R('trousers', trousers)
    sho = c.R('shoes', shoes)
    co = c.R('coat', coat_col)
    ve = c.R('vest', vest_col)

    # legs + shoes
    if not cassock:
        L = c.poly([(10, y(44)), (16, y(44)), (15.5, y(64)), (10.5, y(64))])
        Rr = c.poly([(16, y(44)), (22, y(44)), (21.5, y(64)), (16.5, y(64))])
        c.solid(L, tr, 3, sh=1)
        c.solid(Rr, tr, 2, sh=1)
        c.fill(c.rect(16, y(46), 16, y(63)), tr, 1)  # inseam
        c.fill(c.rect(12, y(52), 12, y(62)), tr, 4)  # crease light
        c.solid(c.poly([(7, y(64)), (15.5, y(64)), (15.5, y(67)), (7, y(67))]) | c.ell(6, y(64), 10, y(67)), sho, 2, hl=2)
        c.solid(c.poly([(16.5, y(64)), (23, y(64)), (24, y(67)), (16.5, y(67))]), sho, 1, hl=1)
        c.fill(c.rect(8, y(65), 9, y(65)), sho, 5)
    # torso / coat
    if cassock:
        body = c.poly([(7, y(22)), (12, y(20)), (20, y(20)), (25, y(22)), (26, y(30)), (27, y(67)), (5, y(67)), (6, y(30))])
        c.solid(body, co, 2, hl=1, sh=1)
        for k, xx in enumerate(range(9, 25, 4)):
            c.fill(c.line([(xx, y(40)), (xx - 1 + k % 2, y(66))]), co, 1)
        c.fill(c.rect(16, y(22), 16, y(66)), co, 1)
        for yy in range(24, 64, 4):
            c.fill(c.rect(16, y(yy), 16, y(yy)), co, 4)
        c.fill(c.rect(14, y(19), 18, y(20)), sh, 6)
        if cape:
            cp = c.R('cape', cape)
            cm = c.poly([(6, y(21)), (12, y(19)), (20, y(19)), (26, y(21)), (27, y(46)), (5, y(46))]) & ~c.poly([(13, y(20)), (19, y(20)), (17, y(46)), (15, y(46))])
            c.solid(cm, cp, 2, hl=1, sh=1)
            c.solid(c.ell(12, y(17), 20, y(23)), cp, 2, hl=1)
    else:
        long_ = {'sack': 44, 'over': 56, 'shirt': 41, 'frock': 52}[coat]
        if coat == 'shirt':
            body = c.poly([(8, y(22)), (12, y(20)), (20, y(20)), (24, y(22)), (24, y(30)), (23, y(long_)), (9, y(long_)), (8, y(30))])
            c.solid(body, sh, 4, hl=1, sh=2)
            c.fill(c.line([(16, y(21)), (16, y(long_))]), sh, 3)
            for yy in (25, 30, 35):
                c.fill(c.rect(17, y(yy), 17, y(yy)), sh, 2)
            # folds
            c.fill(c.line([(11, y(30)), (12, y(40))]), sh, 3)
            c.fill(c.line([(21, y(28)), (20, y(40))]), sh, 2)
            # belt line
            c.fill(c.rect(9, y(41), 23, y(41)), tr, 1)
        else:
            body = c.poly([(7, y(22)), (12, y(20)), (20, y(20)), (25, y(22)), (26, y(28)), (24 + (2 if long_ > 50 else 0), y(long_)),
                           (8 - (2 if long_ > 50 else 0), y(long_)), (6, y(28))])
            c.solid(body, co, 3, hl=1, sh=1, sh2=1)
            # V opening: shirt + waistcoat
            v = c.poly([(13, y(21)), (19, y(21)), (17.5, y(32)), (14.5, y(32))])
            c.fill(v, ve, 3)
            c.fill(v & c.rect(0, y(21), 40, y(23)), sh, 5)
            c.fill(c.rect(16, y(25), 16, y(31)), ve, 2)
            for yy in (26, 29):
                c.fill(c.rect(16, y(yy), 16, y(yy)), ve, 5)
            # lapels
            c.fill(c.line([(12, y(21)), (14.5, y(31))]), co, 5)
            c.fill(c.line([(13, y(21)), (15, y(31))]), co, 4)
            c.fill(c.line([(20, y(21)), (17.5, y(31))]), co, 1)
            # coat front edge + buttons
            c.fill(c.line([(16, y(32)), (16, y(long_))]), co, 1)
            c.fill(c.rect(15, y(34), 15, y(34)), co, 5)
            c.fill(c.rect(15, y(38), 15, y(38)), co, 5)
            # pocket flap
            c.fill(c.rect(9, y(38), 12, y(38)), co, 1)
            if long_ > 50:
                c.fill(c.line([(10, y(46)), (9, y(long_ - 1))]), co, 2)
                c.fill(c.line([(22, y(46)), (23, y(long_ - 1))]), co, 1)
        # collar + tie
        c.fill(c.rect(14, y(19), 18, y(20)), sh, 6)
        if tie == 'bow':
            bt = c.R('tie', '#16131A')
            c.fill(c.rect(14, y(21), 18, y(21)) | c.rect(15, y(22), 17, y(22)), bt, 1)
            c.fill(c.rect(16, y(21), 16, y(22)), bt, 3)
        elif tie == 'red':
            bt = c.R('tie', '#9A2E2E')
            c.fill(c.rect(14, y(21), 18, y(21)) | c.rect(15, y(22), 17, y(22)), bt, 3)
    # arms
    armcol = sh if coat == 'shirt' else co
    la = c.poly([(6, y(23)), (10, y(22)), (11, y(30)), (10.5, y(42)), (6.5, y(42)), (5, y(30))])
    ra = c.poly([(22, y(22)), (26, y(23)), (27, y(30)), (26.5, y(42)), (22.5, y(42)), (21, y(30))])
    c.solid(la, armcol, 4 if coat == 'shirt' else 3, hl=1, sh=1)
    c.solid(ra, armcol, 3 if coat == 'shirt' else 2, hl=0, sh=1)
    c.fill(c.line([(7, y(31)), (9, y(32))]), armcol, 2)
    c.fill(c.line([(23, y(31)), (25, y(32))]), armcol, 1)
    if coat != 'shirt' and not cassock:
        c.fill(c.rect(7, y(41), 10, y(42)), sh, 5)
        c.fill(c.rect(23, y(41), 26, y(42)), sh, 4)
    c.solid(c.ell(6, y(42), 10, y(47)), sk, 3, hl=1)
    c.solid(c.ell(22, y(42), 26, y(47)), sk, 2, hl=0)
    # apron (printer)
    if apron:
        ap = c.R('apron', apron)
        am = c.poly([(10, y(26)), (22, y(26)), (23, y(58)), (9, y(58))])
        c.solid(am, ap, 4, hl=1, sh=1)
        c.fill(c.line([(13, y(34)), (12, y(56))]), ap, 3)
        c.fill(c.line([(19, y(34)), (20, y(56))]), ap, 2)
        c.fill(c.line([(10, y(26)), (13, y(21))]) | c.line([(22, y(26)), (19, y(21))]), ap, 3)
        ink = c.R('ink', '#2A2A3A')
        c.fill(c.rect(18, y(44), 19, y(45)) | c.rect(13, y(50), 13, y(50)), ink, 2)
    # held items
    if holding == 'book':
        bk = c.R('book', '#7A2E2E')
        pg = c.R('pages', '#EFE6CF')
        c.solid(c.rect(22, y(36), 28, y(45)), bk, 3, hl=1)
        c.fill(c.rect(27, y(37), 28, y(44)), pg, 4)
        c.fill(c.rect(23, y(38), 26, y(38)), c.R('gold', '#C9A24A'), 4)
        c.solid(c.ell(22, y(40), 26, y(45)), sk, 2, hl=0)
    elif holding == 'sheet':
        pg = c.R('pages', '#EFE6CF')
        c.solid(c.poly([(3, y(33)), (11, y(31)), (12, y(43)), (4, y(45))]), pg, 5, hl=1, sh=1)
        for yy in range(35, 43, 2):
            c.fill(c.line([(5, y(yy)), (10, y(yy - 1))]), pg, 2)
        c.solid(c.ell(6, y(40), 10, y(45)), sk, 3, hl=1)
    elif holding == 'envelope':
        pg = c.R('pages', '#E9DFC6')
        c.solid(c.rect(2, y(41), 9, y(46)), pg, 4)
        c.fill(c.line([(2, y(41)), (5.5, y(44)), (9, y(41))]), pg, 2)
        c.solid(c.ell(6, y(42), 10, y(47)), sk, 3, hl=1)
    elif holding == 'cane':
        cn = c.R('cane', '#4A3426')
        c.fill(c.line([(5, y(44)), (3, y(67))]), cn, 2)
    # head
    neck = c.rect(14, y(15), 18, y(19))
    c.fill(neck, sk, 1)
    head = c.ell(11, y(2), 21, y(15)) | c.poly([(12, y(11)), (20, y(11)), (19, y(16)), (17, y(18)), (14, y(17)), (12, y(15))])
    c.solid(head, sk, 3, hl=1, sh=1, sh2=1)
    c.solid(c.ell(19, y(8), 22, y(12)), sk, 2, hl=0)
    c.fill(c.rect(20, y(9), 20, y(10)), sk, 1)
    # hair
    if hair_style in ('side', 'short', 'wavy'):
        hm = (c.ell(10, y(1), 22, y(11)) & ~c.poly([(12, y(7)), (19.5, y(6)), (21, y(13)), (11.5, y(13))])) | c.rect(11, y(6), 12, y(10)) | c.rect(20, y(6), 21, y(8))
        if hair_style == 'side':
            hm |= c.poly([(11, y(3)), (17, y(1)), (20, y(4)), (14, y(5)), (12, y(7))])
        c.solid(hm, hr, 2, hl=1, sh=1)
        if hair_style == 'side':
            c.fill(c.line([(13, y(2)), (15, y(4))]), hr, 4)
            c.fill(c.line([(16, y(2)), (19, y(4))]), hr, 3)
        if hair_style == 'wavy':
            for xx in (13, 16, 19):
                c.fill(c.rect(xx, y(3), xx, y(3)), hr, 4)
    elif hair_style == 'cropped':
        hm = c.ell(10, y(1), 22, y(9)) & ~c.poly([(12, y(6)), (20, y(5)), (21, y(12)), (11.5, y(12))])
        c.solid(hm, hr, 2, hl=1, sh=1)
    _face(c, sk, hr, 13, y(9), mustache=mustache, beard=beard)
    if glasses:
        gl = c.R('glasses', '#C9B07A')
        c.fill(c.rect(12, y(8), 14, y(8)) | c.rect(17, y(8), 19, y(8)) | c.rect(12, y(11), 14, y(11)) | c.rect(17, y(11), 19, y(11)), gl, 3)
        c.fill(c.rect(15, y(9), 16, y(9)) | c.rect(11, y(9), 11, y(10)), gl, 4)
    # hats
    if hat:
        ht = c.R('hat', hat_col)
        if hat == 'bowler':
            c.solid(c.ell(11, y(-2), 21, y(7)), ht, 3, hl=1, sh=1)
            c.solid(c.ell(8, y(5), 24, y(8)), ht, 2, hl=1)
            c.fill(c.rect(11, y(4), 21, y(4)), c.R('band', '#3A2A2A'), 1)
        elif hat == 'top':
            c.solid(c.rect(11, y(-7), 21, y(5)), ht, 2, hl=1, sh=1)
            c.fill(c.rect(11, y(3), 21, y(4)), c.R('band', '#3A3040'), 2)
            c.solid(c.ell(8, y(4), 24, y(7)), ht, 2, hl=1)
            c.fill(c.rect(12, y(-6), 12, y(2)), ht, 5)
        elif hat == 'straw':
            c.solid(c.ell(3, y(4), 29, y(9)), ht, 4, hl=1, sh=1)
            c.solid(c.ell(10, y(-1), 22, y(6)), ht, 4, hl=1, sh=1)
            c.fill(c.rect(10, y(4), 22, y(4)), c.R('band', '#5A3A2A'), 2)
            for xx in range(5, 28, 3):
                c.fill(c.rect(xx, y(7), xx, y(7)), ht, 2)
        elif hat == 'clergy':
            c.solid(c.ell(2, y(4), 30, y(9)), ht, 2, hl=1, sh=1)
            c.solid(c.ell(10, y(-1), 22, y(6)), ht, 2, hl=1, sh=1)
        elif hat == 'salakot':
            c.solid(c.poly([(3, y(8)), (16, y(-3)), (29, y(8))]), ht, 4, hl=1, sh=1)
            c.fill(c.line([(3, y(8)), (29, y(8))]), ht, 1)
            for k in range(-2, 8, 3):
                c.fill(c.line([(16, y(-2)), (6 + k * 2.5, y(8))]), ht, 3)
            c.fill(c.rect(15, y(-4), 17, y(-3)), ht, 2)
        elif hat == 'cap':
            c.solid(c.ell(10, y(0), 23, y(7)), ht, 3, hl=1, sh=1)
            c.solid(c.poly([(7, y(5)), (13, y(4)), (13, y(7)), (7, y(7))]), ht, 2)
    img = c.render(alpha=True)
    return selout(img)


def woman(skin='teodora', hair='#1C1820', dress='filipina', saya='#7A2E3A', tapis='#1E1C2A', camisa='#F2EEE4',
          panuelo='#EDE3CF', holding=None, grade=None, bodice='#3A2E3E', hat_col='#4A3040'):
    W, H, oy = 34, 78, 8
    c = Canvas(W, H, grade=grade)
    y = lambda v: v + oy
    sk = skin_ramp(c, skin)
    hr = c.R('hair', hair)
    if dress == 'filipina':
        cm = c.R('camisa', camisa)
        sa = c.R('saya', saya)
        tp = c.R('tapis', tapis)
        pn = c.R('panuelo', panuelo)
        skirt = c.poly([(9, y(33)), (23, y(33)), (27, y(67)), (5, y(67))])
        c.solid(skirt, sa, 3, hl=1, sh=1)
        stripes = (c.xx % 3 == 0) & skirt
        c.adjust(stripes, -2)
        c.fill(c.rect(9, y(66), 13, y(67)), c.R('shoes', '#3A2A2A'), 2)
        tm = c.poly([(9, y(33)), (23, y(33)), (25, y(53)), (7, y(53))])
        c.solid(tm, tp, 2, hl=1, sh=1)
        c.fill(c.line([(12, y(35)), (10, y(52))]), tp, 3)
        c.fill(c.line([(19, y(35)), (21, y(52))]), tp, 1)
        torso = c.poly([(9, y(21)), (13, y(20)), (19, y(20)), (23, y(21)), (23, y(33)), (9, y(33))])
        c.solid(torso, cm, 4, hl=1, sh=1)
        la = c.poly([(8, y(22)), (12, y(21)), (12, y(29)), (9, y(33)), (3, y(33)), (5, y(26))])
        ra = c.poly([(20, y(21)), (24, y(22)), (27, y(26)), (29, y(33)), (23, y(33)), (20, y(29))])
        c.solid(la, cm, 5, hl=1, sh=1)
        c.solid(ra, cm, 4, hl=0, sh=1)
        # sheer sleeves show the arm a little
        c.fill(c.line([(6, y(25)), (8, y(31))]), sk, 4)
        c.fill(c.line([(25, y(25)), (26, y(31))]), sk, 3)
        pm = c.poly([(8, y(21)), (24, y(21)), (16, y(32))])
        c.solid(pm, pn, 4, hl=1, sh=1)
        c.fill(c.line([(9, y(22)), (16, y(31))]) | c.line([(23, y(22)), (16, y(31))]), pn, 2)
    elif dress == 'kimono':
        km = c.R('kimono', bodice)
        ob = c.R('obi', '#C9A24A')
        body = c.poly([(9, y(20)), (14, y(19)), (19, y(19)), (23, y(20)), (24, y(46)), (23, y(67)), (9, y(67)), (8, y(46))])
        c.solid(body, km, 3, hl=1, sh=1, sh2=1)
        c.fill(c.line([(13, y(20)), (18, y(66))]), km, 1)
        c.fill(c.line([(13, y(20)), (16, y(26))]) | c.line([(19, y(20)), (16, y(26))]), c.R('collar', '#EDE6D6'), 5)
        c.solid(c.rect(9, y(32), 23, y(37)), ob, 4, hl=1, sh=1)
        c.solid(c.poly([(5, y(22)), (10, y(21)), (11, y(40)), (4, y(40))]), km, 4, hl=1)
        c.solid(c.poly([(22, y(21)), (27, y(22)), (28, y(40)), (21, y(40))]), km, 2)
        for k in range(10, 66, 6):
            c.fill(c.rect(10 + (k * 7) % 11, y(k), 10 + (k * 7) % 11, y(k)), c.R('pattern', '#F2D8DE'), 5)
        c.solid(c.ell(6, y(38), 10, y(42)), sk, 3)
        c.fill(c.rect(11, y(66), 15, y(67)), c.R('geta', '#7A5A3A'), 3)
    else:  # 1880s European dress with bustle
        dr = c.R('dress', bodice)
        skirt = c.poly([(9, y(36)), (22, y(36)), (28, y(48)), (26, y(67)), (6, y(67)), (8, y(48))])
        c.solid(skirt, dr, 3, hl=1, sh=1, sh2=1)
        c.fill(c.line([(10, y(50)), (8, y(66))]) | c.line([(15, y(48)), (15, y(66))]), dr, 2)
        c.fill(c.rect(6, y(60), 26, y(60)), dr, 1)
        torso = c.poly([(10, y(21)), (14, y(20)), (19, y(20)), (22, y(21)), (21, y(36)), (11, y(36))])
        c.solid(torso, dr, 3, hl=1, sh=1)
        c.fill(c.rect(15, y(22), 17, y(34)), dr, 4)
        la = c.poly([(8, y(22)), (11, y(21)), (11, y(36)), (8, y(36))])
        ra = c.poly([(21, y(21)), (24, y(22)), (24, y(36)), (21, y(36))])
        c.solid(la, dr, 3); c.solid(ra, dr, 2)
        c.fill(c.rect(14, y(19), 18, y(20)), c.R('lace', '#ECE4D4'), 5)
        c.solid(c.ell(7, y(35), 11, y(39)), sk, 3)
        c.solid(c.ell(21, y(35), 25, y(39)), sk, 2)
    # head
    c.fill(c.rect(14, y(15), 18, y(20)), sk, 2)
    head = c.ell(11, y(3), 21, y(15)) | c.poly([(12, y(11)), (20, y(11)), (18.5, y(15)), (16.5, y(17)), (14, y(16.5)), (12, y(14))])
    c.solid(head, sk, 3, hl=1, sh=1, sh2=1)
    hm = (c.ell(10, y(1.5), 22, y(12)) & ~c.poly([(12, y(7)), (16, y(6)), (20, y(7)), (20, y(14)), (12, y(14))])) | c.rect(11, y(6), 12, y(11))
    hm |= c.ell(19, y(4), 25, y(11))  # bun
    c.solid(hm, hr, 2, hl=1, sh=1)
    c.fill(c.line([(16, y(2)), (16, y(6))]), hr, 1)  # centre part
    c.fill(c.rect(21, y(6), 23, y(6)), hr, 4)
    _face(c, sk, hr, 13, y(9), female=True)
    if dress == 'kimono':
        c.fill(c.ell(12, y(0), 20, y(5)), hr, 2)
        c.fill(c.rect(19, y(2), 21, y(2)), c.R('pin', '#C9A24A'), 5)
    if dress == 'euro':
        ht = c.R('hat', hat_col)
        c.solid(c.ell(9, y(0), 21, y(5)), ht, 3, hl=1)
        c.fill(c.line([(18, y(0)), (22, y(-4))]), c.R('feather', '#D9C9A8'), 4)
    if holding == 'open_book':
        pg = c.R('pages', '#F1E8D2')
        bk = c.R('book', '#5A3A2A')
        c.solid(c.poly([(9, y(29)), (16, y(30)), (23, y(29)), (23, y(34)), (16, y(35)), (9, y(34))]), bk, 2)
        c.fill(c.poly([(10, y(29)), (15.5, y(30)), (15.5, y(34)), (10, y(33))]), pg, 5)
        c.fill(c.poly([(16.5, y(30)), (22, y(29)), (22, y(33)), (16.5, y(34))]), pg, 4)
        for yy in (31, 32):
            c.fill(c.rect(11, y(yy), 14, y(yy)), pg, 2)
            c.fill(c.rect(18, y(yy), 21, y(yy)), pg, 2)
        c.solid(c.ell(7, y(31), 10, y(35)), sk, 3)
        c.solid(c.ell(22, y(31), 25, y(35)), sk, 2)
    elif holding == 'bag':
        bg = c.R('bag', '#2A2228')
        c.solid(c.rect(22, y(37), 27, y(42)), bg, 2, hl=1)
        c.fill(c.line([(23, y(37)), (24, y(35)), (26, y(37))]), bg, 3)
    return selout(c.render(alpha=True))


def child(skin='rizal', hair='#1E1A22', shirt='#F0EADC', shorts='#5A5068', grade=None, barefoot=True, scale='small', holding=None):
    """scale 'small' ~ 3-4 years old; 'boy' ~ 10-12 years old"""
    if scale == 'small':
        W, H = 24, 48
        c = Canvas(W, H, grade=grade)
        sk = skin_ramp(c, skin); hr = c.R('hair', hair); sh = c.R('shirt', shirt); so = c.R('shorts', shorts)
        c.solid(c.rect(8, 36, 10, 44), sk, 3, hl=1); c.solid(c.rect(13, 36, 15, 44), sk, 2)
        c.fill(c.rect(7, 44, 10, 45), sk, 2); c.fill(c.rect(13, 44, 16, 45), sk, 1)
        c.solid(c.poly([(7, 30), (16, 30), (17, 37), (6, 37)]), so, 3, hl=1)
        c.solid(c.poly([(6, 20), (9, 18), (14, 18), (17, 20), (17, 31), (6, 31)]), sh, 4, hl=1, sh=1)
        c.fill(c.line([(11.5, 19), (11.5, 30)]), sh, 3)
        c.solid(c.poly([(4, 20), (7, 19), (7, 28), (4, 28)]), sh, 5)
        c.solid(c.poly([(16, 19), (19, 20), (19, 28), (16, 28)]), sh, 3)
        c.solid(c.ell(4, 27, 7, 30), sk, 3); c.solid(c.ell(16, 27, 19, 30), sk, 2)
        c.fill(c.rect(10, 16, 13, 18), sk, 1)
        head = c.ell(5, 3, 18, 17)
        c.solid(head, sk, 3, hl=1, sh=1, sh2=1)
        c.solid(c.ell(16, 8, 19, 12), sk, 2, hl=0)
        hm = (c.ell(4, 1, 19, 12) & ~c.poly([(6, 8), (17, 7), (18, 14), (6, 14)])) | c.rect(5, 7, 6, 10)
        c.solid(hm, hr, 2, hl=1, sh=1)
        c.fill(c.line([(8, 3), (11, 5)]), hr, 4)
        eye = c.R('eye', colors=[(24, 18, 30)] * 7)
        c.fill(c.rect(8, 10, 8, 11) | c.rect(13, 10, 13, 11), eye, 0)
        c.fill(c.rect(10, 12, 10, 12), sk, 1)
        c.fill(c.rect(9, 14, 11, 14), sk, 1)
        if holding == 'book':
            bk = c.R('book', '#3A5A8A')
            c.solid(c.rect(1, 25, 6, 31), bk, 3, hl=1)
        return selout(c.render(alpha=True))
    W, H, oy = 30, 64, 4
    c = Canvas(W, H, grade=grade)
    y = lambda v: v + oy
    sk = skin_ramp(c, skin); hr = c.R('hair', hair); sh = c.R('shirt', shirt); so = c.R('shorts', shorts)
    long_trousers = not barefoot
    if long_trousers:
        c.solid(c.poly([(9, y(36)), (14, y(36)), (14, y(53)), (9.5, y(53))]), so, 3, hl=1)
        c.solid(c.poly([(15, y(36)), (20, y(36)), (19.5, y(53)), (15, y(53))]), so, 2)
        c.fill(c.rect(15, y(38), 15, y(52)), so, 1)
        shoe = c.R('shoes', '#261E1E')
        c.solid(c.rect(7, y(53), 14, y(56)), shoe, 2, hl=1); c.solid(c.rect(15, y(53), 21, y(56)), shoe, 1)
    else:
        c.solid(c.poly([(9, y(36)), (14, y(36)), (14, y(44)), (9, y(44))]), so, 3, hl=1)
        c.solid(c.poly([(15, y(36)), (20, y(36)), (20, y(44)), (15, y(44))]), so, 2)
        c.solid(c.rect(10, y(44), 13, y(54)), sk, 3, hl=1); c.solid(c.rect(16, y(44), 19, y(54)), sk, 2)
        c.fill(c.rect(8, y(54), 13, y(55)), sk, 2); c.fill(c.rect(16, y(54), 20, y(55)), sk, 1)
    c.solid(c.poly([(8, y(19)), (11, y(17)), (18, y(17)), (21, y(19)), (21, y(37)), (8, y(37))]), sh, 4, hl=1, sh=1)
    c.fill(c.line([(14.5, y(18)), (14.5, y(36))]), sh, 3)
    c.solid(c.poly([(5, y(19)), (9, y(18)), (9, y(32)), (5, y(32))]), sh, 5)
    c.solid(c.poly([(20, y(18)), (24, y(19)), (24, y(32)), (20, y(32))]), sh, 3)
    c.solid(c.ell(5, y(31), 9, y(35)), sk, 3); c.solid(c.ell(20, y(31), 24, y(35)), sk, 2)
    c.fill(c.rect(12, y(14), 16, y(17)), sk, 1)
    head = c.ell(8, y(1), 20, y(14)) | c.poly([(9, y(10)), (19, y(10)), (17, y(15)), (14, y(16)), (10, y(14))])
    c.solid(head, sk, 3, hl=1, sh=1, sh2=1)
    c.solid(c.ell(18, y(6), 21, y(10)), sk, 2, hl=0)
    hm = (c.ell(7, y(0), 21, y(10)) & ~c.poly([(9, y(6)), (18.5, y(5)), (20, y(12)), (9, y(12))])) | c.rect(8, y(5), 9, y(9))
    c.solid(hm, hr, 2, hl=1, sh=1)
    c.fill(c.line([(10, y(1)), (13, y(3))]), hr, 4)
    eye = c.R('eye', colors=[(24, 18, 30)] * 7)
    c.fill(c.rect(11, y(7), 11, y(8)) | c.rect(16, y(7), 16, y(8)), eye, 0)
    c.fill(c.rect(10, y(5), 12, y(5)) | c.rect(15, y(5), 17, y(5)), hr, 1)
    c.fill(c.rect(13, y(9), 13, y(10)), sk, 4); c.fill(c.rect(14, y(10), 14, y(10)), sk, 1)
    c.fill(c.rect(12, y(12), 15, y(12)), sk, 1)
    if holding == 'books':
        b1 = c.R('book', '#6A3A2A'); b2 = c.R('book2', '#2E4A6A')
        c.solid(c.rect(20, y(26), 27, y(29)), b1, 3, hl=1)
        c.solid(c.rect(21, y(29), 28, y(32)), b2, 3, hl=1)
        c.solid(c.ell(20, y(28), 24, y(32)), sk, 2)
    return selout(c.render(alpha=True))


if __name__ == '__main__':
    from PIL import Image
    sprites = [
        man(),  # Rizal, Berlin 1887
        man(skin='viola', hair='#241C1A', coat_col='#5E4632', vest_col='#8A6A44', trousers='#4A3A30', hat='bowler', hat_col='#2E2420', tie='red', holding='envelope'),
        man(coat='over', coat_col='#2A2C36', holding='book'),  # Rizal Madrid
        man(coat='shirt', shirt='#EEE8DA', trousers='#CFC4AE', hat='straw', hat_col='#D8B878', holding='book'),  # Rizal Dapitan
        man(skin='pale', hair='#5A4030', mustache=True, coat='shirt', shirt='#E4DCCB', trousers='#3E3A40', apron='#C9BC9C', hat='cap', hat_col='#3A3A44', holding='sheet'),
        man(skin='fair', hair='#2A2420', cassock=True, coat_col='#1C1A22', mustache=False, hat='clergy', hat_col='#18161C', hair_style='cropped'),
        man(skin='fair', hair='#6A5040', coat='frock', coat_col='#22222A', hat='top', hat_col='#18181E', holding='cane', beard=True),
        woman(holding='open_book'),
        woman(skin='fair', dress='euro', bodice='#4A2E3E', holding='bag'), woman(skin='pale', dress='kimono', bodice='#4A5A8A'), man(skin='fair', cassock=True, coat_col='#ECE6D8', cape='#1E1C22', mustache=False, hair_style='cropped'), man(skin='brown', coat='shirt', shirt='#E8DCC2', trousers='#5A4A3A', hat='salakot', hat_col='#C9A86A', mustache=False),
        child(scale='boy', barefoot=False, shirt='#F0EADC', shorts='#2E3446', holding='books'),
        child(scale='boy', skin='brown', shirt='#E8DCC2', shorts='#6A5A4A'),
        child(scale='small'),
    ]
    Wt = sum(s.width for s in sprites) + 8 * len(sprites)
    sheet = Image.new('RGBA', (Wt, 80), (226, 218, 200, 255))
    x = 4
    for s in sprites:
        sheet.alpha_composite(s, (x, 80 - s.height))
        x += s.width + 8
    sheet.resize((sheet.width * 5, sheet.height * 5), Image.NEAREST).save('out/sheet.png')
    print('ok', sheet.size)
