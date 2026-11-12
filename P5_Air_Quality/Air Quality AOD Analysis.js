var geometry = 
    /* color: #00ffff */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[88.34123960929273, 22.814853553694935],
          [88.24510923819898, 22.681874719573557],
          [88.32513843427773, 22.400671122440492],
          [88.47894702802773, 22.422253744984182],
          [88.5263255680668, 22.589088168094047]]]);

var aoi = geometry;
Map.centerObject(aoi, 11);

var aod = ee.ImageCollection('MODIS/061/MCD19A2_GRANULES')
    .filterBounds(aoi)
    .filterDate('2023-11-01', '2023-11-30')
    .select('Optical_Depth_047');

print('AOD Collection', aod);

var meanAOD = aod.mean().clip(aoi);

print('Mean AOD', meanAOD);

Map.addLayer(
  meanAOD,
  {
    min: 700,
    max: 1100,
    palette: [
      '006400',
      '7FFF00',
      'FFFF00',
      'FFA500',
      'FF0000'
    ]
  },
  'Mean AOD'
);

var stats = meanAOD.reduceRegion({
  reducer: ee.Reducer.minMax(),
  geometry: aoi,
  scale: 1000,
  maxPixels: 1e13
});

print('AOD Min Max', stats);

print(
  'Mean AOD Value',
  meanAOD.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: aoi,
    scale: 1000,
    maxPixels: 1e13
  })
);

var hotspot = meanAOD.gt(1000);

Map.addLayer(
  hotspot.updateMask(hotspot),
  {palette:['red']},
  'Pollution Hotspots'
);

var hotspotArea = hotspot.multiply(ee.Image.pixelArea());

var area = hotspotArea.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: aoi,
  scale: 1000,
  maxPixels: 1e13
});

print('Hotspot Area (sq m)', area);

print('Hotspot Area (sq km)', ee.Number(area.get('Optical_Depth_047')).divide(1e6));