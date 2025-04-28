import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import recognizedCountries from '../../utils/recognized_countries.json';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  FadeIn,
  FadeInDown,
  SlideInDown,
} from 'react-native-reanimated';
import Badge from '../../components/Badge/Badge';

// Create animated components
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);
const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function CountryOfTheDayScreen() {
  const navigation = useNavigation();
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [selectedContinent, setSelectedContinent] = useState(null);

  useEffect(() => {
    fetchCountryOfTheDay();
  }, []);

  const fetchCountryOfTheDay = async () => {
    try {
      setLoading(true);
      
      // Check if we already have a country for today
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const storedData = await AsyncStorage.getItem('countryOfTheDay');
      const parsedData = storedData ? JSON.parse(storedData) : null;
      
      // If we have stored data and it's from today, use it
      if (parsedData && parsedData.date === today) {
        setCountry(parsedData.country);
        setLoading(false);
        return;
      }
      
      // Otherwise, select a new random country
      const countries = recognizedCountries.recognized_countries;
      const randomIndex = Math.floor(Math.random() * countries.length);
      const randomCountry = countries[randomIndex];
      
      // Fetch country details from the API
      const response = await fetch(`https://restcountries.com/v3.1/name/${randomCountry}?fullText=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch country data');
      }
      
      const data = await response.json();
      const countryData = data[0];
      
      // Format the country data
      const formattedCountry = {
        name: countryData.name.common,
        officialName: countryData.name.official,
        capital: countryData.capital ? countryData.capital[0] : 'N/A',
        region: countryData.region,
        subregion: countryData.subregion,
        population: countryData.population.toLocaleString(),
        languages: countryData.languages ? Object.values(countryData.languages).join(', ') : 'N/A',
        currencies: countryData.currencies ? 
          Object.values(countryData.currencies)
            .map(currency => `${currency.name} (${currency.symbol || 'N/A'})`)
            .join(', ') : 'N/A',
        flagUrl: countryData.flags.png,
        timezones: countryData.timezones.join(', '),
        continents: countryData.continents.join(', '),
        borders: countryData.borders ? countryData.borders.join(', ') : 'None',
        independent: countryData.independent ? 'Yes' : 'No',
        unMember: countryData.unMember ? 'Yes' : 'No',
        area: countryData.area ? `${countryData.area.toLocaleString()} km²` : 'N/A',
      };
      
      // Store the country data with today's date
      await AsyncStorage.setItem('countryOfTheDay', JSON.stringify({
        date: today,
        country: formattedCountry
      }));
      
      setCountry(formattedCountry);
    } catch (err) {
      console.error('Error fetching country of the day:', err);
      setError('Failed to load country information. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinentPress = (continent) => {
    setSelectedContinent(continent);
    setBadgeModalVisible(true);
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#70ab51', '#7dbc63', '#70ab51']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading country information...</Text>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={['#70ab51', '#7dbc63', '#70ab51']}
        style={styles.errorContainer}
      >
        <MaterialIcons name="error-outline" size={50} color="#ffffff" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCountryOfTheDay}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        overScrollMode="never"
      >
        {/* White top section */}
        <View style={styles.topSection}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back-ios" size={24} color="#333333" />
            </TouchableOpacity>
            <AnimatedText 
              entering={FadeInDown.duration(600).springify()}
              style={styles.headerTitle}
            >
              Country of the Day
            </AnimatedText>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.countryHeaderContainer}>
            <AnimatedText 
              entering={FadeInDown.duration(800).springify()}
              style={styles.countryName}
            >
              {country.name}
            </AnimatedText>
            <AnimatedText 
              entering={FadeInDown.duration(1000).springify()}
              style={styles.countrySubtext}
            >
              {country.name} is a country in{' '}
              <Text 
                style={styles.continentLink}
                onPress={() => handleContinentPress(country.continents)}
              >
                {country.continents}
              </Text>
            </AnimatedText>

            <AnimatedView 
              entering={FadeIn.duration(1200).springify()}
              style={styles.flagContainer}
            >
              <AnimatedImage
                entering={FadeIn.duration(1500)}
                style={styles.flag}
                source={{ uri: country.flagUrl }}
                resizeMode="contain"
              />
            </AnimatedView>
          </View>
        </View>

        {/* V-shaped divider with more pronounced angle */}
        <View style={styles.dividerContainer}>
          <Svg height="50" width="100%" viewBox="0 0 100 50" preserveAspectRatio="none">
            <Path
              d="M0,0 L100,0 L100,15 L50,50 L0,15 Z"
              fill="#ffffff"
            />
          </Svg>
        </View>

        {/* Green section with info pills */}
        <View style={styles.greenSection}>
          <View style={styles.infoContainer}>
            {/* Use an array to create staggered animations for info items */}
            {[
              { icon: "location-city", label: "Capital", value: country.capital },
              { icon: "people", label: "Population", value: country.population },
              { icon: "attach-money", label: "Currency", value: country.currencies },
              { icon: "translate", label: "Languages", value: country.languages },
              { icon: "schedule", label: "Timezones", value: country.timezones },
              { icon: "public", label: "Region", value: `${country.subregion}, ${country.region}` },
              { icon: "straighten", label: "Area", value: country.area },
              { icon: "map", label: "Borders", value: country.borders },
              { icon: "info", label: "Official Name", value: country.officialName },
              { icon: "check-circle", label: "UN Member", value: country.unMember }
            ].map((item, index) => (
              <AnimatedView
                key={item.label}
                entering={FadeInDown.duration(400).delay(1200 + index * 100)}
              >
                <InfoItem 
                  icon={item.icon} 
                  label={item.label} 
                  value={item.value} 
                />
              </AnimatedView>
            ))}
          </View>
        </View>
      </ScrollView>
      
      {badgeModalVisible && (
        <Badge
          visible={badgeModalVisible}
          onClose={() => setBadgeModalVisible(false)}
          initialBadgeId={selectedContinent}
        />
      )}
    </View>
  );
}

// Helper component for displaying info items
function InfoItem({ icon, label, value }) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIconContainer}>
        <MaterialIcons name={icon} size={24} color="#ffc268" />
      </View>
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7dbc63',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#70ab51',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  topSection: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 10,
  },
  countryHeaderContainer: {
    paddingHorizontal: 16,
  },
  countryName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  countrySubtext: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  flagContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  flag: {
    width: '70%',
    height: 100,
    marginHorizontal: '5%',
    margin: 20,
  },
  dividerContainer: {
    backgroundColor: '#7dbc63',
    marginTop: -1,
  },
  greenSection: {
    backgroundColor: '#7dbc63',
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  scrollContent: {
    flexGrow: 1,
  },
  infoContainer: {
    marginBottom: 20,
    marginTop: 20,
  },
  infoItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#d2d2d2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  infoIconContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333333',
  },
  continentLink: {
    color: '#7dbc63',
    fontWeight: 'bold',
  },
}); 