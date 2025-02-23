import React from "react";
import { feature } from "topojson-client";
import Svg, { Path } from "react-native-svg";
import { View, ScrollView, Text } from "react-native";
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
  onContainerLayout,
  gameDataCountry,
  countryPaths,
  currentUid,
  containerHeight,
  mapWidth,
  guessedCountries,
  gameType,
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
            // Find the feature name from the path and normalize it
            const featureName =
              filteredWorldData.features[index].properties.NAME.toLowerCase();
            let fillColor;
            if (gameType === "solo") {
              // In solo mode, check if the guessedCountries array includes this country name
              fillColor = guessedCountries.includes(featureName)
                ? "#4bd670"
                : "#FFF9C4";
            } else {
              // Multiplayer logic as before
              let isMyGuess = gameDataCountry?.filter(
                (e) => e.country.toLowerCase() === featureName
              );
              let guessMine =
                isMyGuess && (isMyGuess.length > 1
                  ? isMyGuess.find((e) => e.uid == currentUid)
                  : isMyGuess[0]);
              fillColor = guessMine?.uid
                ? guessMine.uid === currentUid
                  ? "#4bd670"
                  : "blue"
                : "#FFF9C4";
            }
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
