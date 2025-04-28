import React from "react";
import { feature } from "topojson-client";
import Svg, { Path } from "react-native-svg";
import { View, ScrollView, Text } from "react-native";
import { normalizeCountryName } from "../../utils/countryHelpers";
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
  showMissingCountries,
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
            // Normalize the feature's country name
            const normalizedFeatureName = normalizeCountryName(
              filteredWorldData.features[index].properties.NAME
            );
            let fillColor;
            if (gameType === "solo") {
              // Check if country is guessed
              const isGuessed = guessedCountries.includes(normalizedFeatureName);
              
              // In solo mode, with the missing countries option
              if (showMissingCountries && !isGuessed) {
                fillColor = "#FF6B6B"; // Red color for unguessed countries
              } else if (isGuessed) {
                fillColor = "#4bd670"; // Green for correct guesses
              } else {
                fillColor = "#FFF9C4"; // Default color
              }
            } else {
              // Multiplayer logic with missing countries option
              let isMyGuess = gameDataCountry?.filter(
                (e) => normalizeCountryName(e.country) === normalizedFeatureName
              );
              let guessMine =
                isMyGuess && (isMyGuess.length > 1
                  ? isMyGuess.find((e) => e.uid == currentUid)
                  : isMyGuess[0]);
                  
              if (showMissingCountries && !guessMine?.uid) {
                fillColor = "#FF6B6B"; // Red for missing countries
              } else if (guessMine?.uid) {
                fillColor = guessMine.uid === currentUid ? "#4bd670" : "#10b1e6";
              } else {
                fillColor = "#FFF9C4"; // Default color
              }
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
