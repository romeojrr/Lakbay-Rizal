from terrain import render
from PIL import Image
O='out/'
laguna=[(14.53,121.05),(14.45,121.05),(14.36,121.10),(14.25,121.13),(14.20,121.17),(14.22,121.25),(14.26,121.36),(14.27,121.42),(14.33,121.47),(14.40,121.46),(14.48,121.38),(14.43,121.33),(14.36,121.32),(14.38,121.25),(14.46,121.21),(14.50,121.18),(14.55,121.12)]
ph, pos = render(4.8, 20.2, 114.6, 130.2, 320, 320, seed=11, lakes=[laguna],
  mountains=[((16.4,18.2),(120.7,121.2),5,False,False),((15.3,18.0),(121.5,122.2),4,False,False),
             ((7.0,8.6),(124.0,126.0),5,False,False),((13.25,13.26),(123.68,123.69),1,False,True),((9.8,10.8),(122.9,123.2),2,False,False)],
  towns=[('manila',(14.59,120.98)),('dapitan',(8.66,123.42))])
ph.save(O+'map_ph.png'); ph.resize((960,960),Image.NEAREST).save(O+'map_ph_preview.png'); print(pos)
ins, pos2 = render(13.95, 14.75, 120.75, 121.55, 176, 176, seed=5, despeck=False, wave_rate=0.01, lakes=[laguna],
  towns=[('manila',(14.59,120.98)),('binan',(14.34,121.08)),('calamba',(14.21,121.17))])
ins.save(O+'map_manila.png'); ins.resize((704,704),Image.NEAREST).save(O+'map_manila_preview.png'); print(pos2)
