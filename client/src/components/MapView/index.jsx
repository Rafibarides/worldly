import React from "react";
import { feature } from "topojson-client";
import Svg, { Path } from "react-native-svg";
import { View, ScrollView } from "react-native";
import worldData from "../../../assets/geojson/ne_50m_admin_0_countries.json";

let geoJSON;
if (worldData.type === "Topology") {
  geoJSON = feature(worldData, worldData.objects.ne_50m_admin_0_countries);
} else geoJSON = worldData;

// 2) Filter out Antarctica if necessary
const filteredWorldData = {
  ...geoJSON,
  features: geoJSON.features.filter(
    (feat) => feat.properties && feat.properties.NAME !== "Antarctica"
  ),
};

export default function MapView({
  guessedCountries = [],
  onContainerLayout,
  gameDataCountry,
  countryPaths,
  currentUid,
  containerHeight,
  mapWidth,
}) {
  return (
    <View style={{ flex: 1 }} onLayout={onContainerLayout}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ width: "100%", height: "100%" }}
        contentContainerStyle={{
          width: mapWidth,
          height: "100%",
        }}
      >
        <Svg
          width={mapWidth}
          height={containerHeight}
          preserveAspectRatio="xMidYMid meet"
        >
          {countryPaths.map((d, index) => {
            // Find the feature name from the path
            const featureName =
              filteredWorldData.features[index].properties.NAME.toLowerCase();
            // If it's guessed, fill with #4bd670; else pastel yellow
            const fillColorCheck = guessedCountries.includes(featureName);
            let isMyGuess = gameDataCountry?.find(
              (e) => e.country == featureName
            );

            const fillColor = fillColorCheck
              ? isMyGuess?.uid === currentUid
                ? "#4bd670"
                : "tomato"
              : "#FFF9C4";
            return (
              <Path
                key={`country-${index}`}
                d={d}
                fill={fillColor}
                stroke="#000"
                strokeWidth={1}
              />
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
}
