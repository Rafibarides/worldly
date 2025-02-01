import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { geoPath, geoNaturalEarth1 } from 'd3-geo';
import { feature } from 'topojson-client';
import worldData from '../../../assets/geojson/ne_50m_admin_0_countries.json';

// 1) Handle both GeoJSON and TopoJSON by checking .type
let geoJSON;
if (worldData.type === 'Topology') {
  // File is TopoJSON
  geoJSON = feature(worldData, worldData.objects.ne_50m_admin_0_countries);
} else {
  // File is already normal GeoJSON
  geoJSON = worldData;
}

// 2) Filter out Antarctica if necessary
const filteredWorldData = {
  ...geoJSON,
  features: geoJSON.features.filter(
    (feat) => feat.properties && feat.properties.NAME !== 'Antarctica'
  ),
};

export default function MapView() {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const [containerHeight, setContainerHeight] = useState(0);

  // Handle layout to measure container height
  const onContainerLayout = useCallback((e) => {
    const { height } = e.nativeEvent.layout;
    setContainerHeight(height);
  }, []);

  // Calculate the map width based on the container height and world aspect ratio
  const mapWidth = containerHeight * 2;

  // Memoize the generated paths to avoid recalculating on every render
  const countryPaths = useMemo(() => {
    if (containerHeight > 0) {
      // Use geoNaturalEarth1 to avoid huge shapes crossing ±180° longitude
      const projection = geoNaturalEarth1();

      // Scale/translate to fit [mapWidth, containerHeight]
      projection.fitSize([mapWidth, containerHeight], filteredWorldData);

      // Create path generator from the new projection
      const pathGenerator = geoPath().projection(projection);

      // Return path strings for all filtered countries
      return filteredWorldData.features.map((feat) => pathGenerator(feat));
    }
    return [];
  }, [containerHeight, mapWidth]);

  return (
    <View style={{ flex: 1 }} onLayout={onContainerLayout}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ width: '100%', height: '100%' }}
        contentContainerStyle={{
          width: mapWidth, 
          height: '100%',
        }}
      >
        <Svg
          width={mapWidth}
          height={containerHeight}
          preserveAspectRatio="xMidYMid meet"
        >
          {countryPaths.map((d, index) => (
            <Path
              key={`country-${index}`}
              d={d}
              fill="#FFF9C4"  // switched to a soft pastel yellow
              stroke="#000"
              strokeWidth={1}
            />
          ))}
        </Svg>
      </ScrollView>
    </View>
  );
} 