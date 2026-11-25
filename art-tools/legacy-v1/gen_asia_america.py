"""Asia (Japan + Hong Kong) and America region maps for Lakbay Rizal."""
from terrain import render

# Asia: lat 18–40, lon 110–145 (Hong Kong 22.28N 114.16E; Tokyo 35.68N 139.69E)
asia, pa = render(18.0, 40.0, 110.0, 145.0, 384, 240, seed=21, tree_kind='tree',
                  mountains=[((35.0, 36.6), (137.2, 139.0), 7, True, False),   # Japanese Alps
                             ((35.2, 35.5), (138.6, 138.9), 1, True, True),    # Fuji
                             ((23.0, 24.6), (120.6, 121.3), 4, False, False),  # Taiwan range
                             ((24.0, 27.0), (113.0, 117.0), 6, False, False)], # S. China hills
                  towns=[('hongkong', (22.28, 114.16)), ('tokyo', (35.68, 139.69))])
asia.save('out/asia.png')
asia.resize((384 * 3, 240 * 3), 0).save('out/asia_prev.png')
print('asia', pa)

# America: lat 30–46, lon −126 to −70 (San Francisco 37.77N 122.42W; New York 40.71N 74.01W)
am, pm = render(30.0, 46.0, -126.0, -70.0, 384, 192, seed=22, tree_kind='tree',
                mountains=[((37.0, 40.5), (-121.0, -119.5), 6, True, False),   # Sierra Nevada
                           ((37.0, 44.0), (-110.0, -105.0), 9, True, False),   # Rockies
                           ((35.5, 41.0), (-81.5, -77.0), 6, False, False)],  # Appalachians
                lakes=[[(41.4, -83.4), (41.7, -81.7), (42.1, -80.3), (42.6, -79.0), (42.9, -78.9), (42.7, -80.1), (42.3, -81.6), (42.0, -82.8)],          # Erie
                       [(43.2, -79.8), (43.4, -78.6), (43.3, -77.5), (43.5, -76.4), (44.1, -76.3), (43.9, -77.5), (43.7, -79.4)],                      # Ontario
                       [(41.62, -87.5), (42.5, -87.8), (43.5, -87.7), (44.5, -87.5), (45.4, -86.9), (45.9, -85.9), (45.7, -85.0), (44.8, -85.6),
                        (43.6, -86.4), (42.4, -86.3), (41.7, -86.9)],                                                                                  # Michigan
                       [(43.0, -82.4), (44.0, -82.6), (45.0, -83.4), (45.9, -84.5), (46.2, -83.0), (45.9, -81.5), (45.0, -80.8), (44.5, -81.3), (43.6, -81.7)]],  # Huron
                towns=[('sanfrancisco', (37.77, -122.42)), ('newyork', (40.71, -74.01))])
am.save('out/america.png')
am.resize((384 * 3, 192 * 3), 0).save('out/america_prev.png')
print('america', pm)
