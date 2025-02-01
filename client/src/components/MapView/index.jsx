import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { geoPath, geoEquirectangular } from 'd3-geo';
import worldData from '../../../assets/geojson/ne_50m_admin_0_countries.json';

export default function MapView() {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const [containerHeight, setContainerHeight] = useState(0);

  // Create our projection & path generator
  const projection = geoEquirectangular();
  const pathGenerator = geoPath().projection(projection);

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
      // First fit the projection to our container size
      projection.fitSize([mapWidth, containerHeight], worldData);
      
      // Scale up by 2%
      const currentScale = projection.scale();
      projection.scale(currentScale * 1.01);
      
      // Recenter after scaling
      projection.translate([mapWidth / 2, containerHeight / 2]);
    }
    // Return an array of path strings for all countries
    return worldData.features.map((feature) => pathGenerator(feature));
  }, [containerHeight, projection, pathGenerator, mapWidth]);

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
              fill="none"
              stroke="#000"
              strokeWidth="0.5"
            />
          ))}
        </Svg>
      </ScrollView>
    </View>
  );
} 