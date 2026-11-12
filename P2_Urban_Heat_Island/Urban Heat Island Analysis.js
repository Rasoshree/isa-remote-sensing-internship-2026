var aoi = 
    /* color: #00ffff */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[88.34123960929273, 22.814853553694935],
          [88.24510923819898, 22.681874719573557],
          [88.32513843427773, 22.400671122440492],
          [88.47894702802773, 22.422253744984182],
          [88.5263255680668, 22.589088168094047]]]);

Map.centerObject(aoi, 11);

var image = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(aoi)
  .filterDate('2023-01-01', '2023-12-31')
  .filter(ee.Filter.lt('CLOUD_COVER', 10))
  .median()
  .clip(aoi);

print('Landsat Image', image);

Map.addLayer(
  image,
  {
    bands: ['SR_B4','SR_B3','SR_B2'],
    min: 7000,
    max: 20000
  },
  'True Color'
);

var lst = image.select('ST_B10')
  .multiply(0.00341802)
  .add(149.0)
  .subtract(273.15)
  .rename('LST');

Map.addLayer(
  lst,
  {
    min: 26,
    max: 36,
    palette: [
      '0000ff',
      '00ffff',
      '00ff00',
      'ffff00',
      'ff8800',
      'ff0000'
    ]
  },
  'Land Surface Temperature'
);

print('Mean LST',
  lst.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: aoi,
    scale: 30,
    maxPixels: 1e13
  })
);
var stats = lst.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: aoi,
  scale: 30,
  maxPixels: 1e13
});

print('LST Min Max', stats);

var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');

Map.addLayer(
  ndvi,
  {
    min: -0.2,
    max: 0.8,
    palette: [
      'brown',
      'yellow',
      'green',
      'darkgreen'
    ]
  },
  'NDVI'
);

var ndbi = image.normalizedDifference(['SR_B6', 'SR_B5']).rename('NDBI');

Map.addLayer(
  ndbi,
  {
    min: -0.5,
    max: 0.5,
    palette: ['blue', 'white', 'red']
  },
  'NDBI'
);

var uhi = lst.gt(33);

Map.addLayer(
  uhi.updateMask(uhi),
  {palette:['red']},
  'UHI Zones'
);

var hotspotArea = uhi.multiply(ee.Image.pixelArea());

var areaStats = hotspotArea.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: aoi,
  scale: 30,
  maxPixels: 1e13
});

print('UHI Hotspot Area (sq. m):', areaStats);

print('UHI Hotspot Area (sq. km):', ee.Number(areaStats.get('LST')).divide(1e6));