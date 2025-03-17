import React, { useState, useEffect } from 'react';
import { View, Image, SafeAreaView, Text, StyleSheet, ActivityIndicator, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import countyAPIs from '../data/valid_counties_only.json';
import debounce from 'lodash.debounce';
import { Ionicons } from '@expo/vector-icons';  // ✅ Import Icon for Back Button

const PEXELS_API_KEY = "PfcX0uhPunDcOEhFyu9qplzbXC5a41vfE6FZoch2cBfQXlWYbT1nuHSE";

const DetailsScreen = ({ route }) => {
  const { propertyid, county } = route.params;
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [adjustedPrice, setAdjustedPrice] = useState(0);
  const navigation = useNavigation();

  // ✅ Load saved dark mode preference on app start
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('darkMode');
        if (savedMode !== null) {
          setDarkMode(JSON.parse(savedMode));
        }
      } catch (error) {
        console.error('Error loading dark mode:', error);
      }
    };
    loadTheme();
  }, []);

  // ✅ Toggle Dark Mode & Save Preference
  const toggleDarkMode = async () => {
    try {
      const newMode = !darkMode;
      setDarkMode(newMode);
      await AsyncStorage.setItem('darkMode', JSON.stringify(newMode));
    } catch (error) {
      console.error('Error saving dark mode:', error);
    }
  };

  // ✅ Fetch Property Details
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const countyAPI = countyAPIs[county];
        if (!countyAPI) {
          console.error(`No API found for county: ${county}`);
          setLoading(false);
          return;
        }

        const detailsUrl = `${countyAPI}/search/SearchResults?keywords=PropertyId%3A${propertyid}&page=1&pagesize=25&recaptchaToken=`;
        console.log("Fetching details from:", detailsUrl);

        const response = await axios.get(detailsUrl);

        if (response.data?.resultsList?.length > 0) {
          setPropertyDetails(response.data.resultsList[0]);
          fetchPropertyImage(response.data.resultsList[0].legalDescription);
        } else {
          console.error('No details found for this property.');
        }
      } catch (error) {
        console.error('Error fetching property details:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyDetails();
  }, [propertyid, county]);

  const fetchPropertyImage = async (legalDescription) => {
    if (!legalDescription) return;

    // Rotate different search queries for variety
    const searchQueries = [
      "luxury house exterior",
      "beautiful home front view",
      "real estate property",
      "modern villa"
    ];

    // Pick a random query
    const searchQuery = searchQueries[Math.floor(Math.random() * searchQueries.length)];

    try {
      const response = await axios.get(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=5`,
        {
          headers: { Authorization: PEXELS_API_KEY }
        }
      );

      console.log("📸 Pexels API Response:", response.data);

      if (response.data.photos.length > 0) {
        // Select a random image from the available ones
        const randomIndex = Math.floor(Math.random() * response.data.photos.length);
        const imgUrl = response.data.photos[randomIndex].src.medium;

        console.log("✅ Random Image Selected:", imgUrl);
        setImageUrl(imgUrl); // Update state with the selected image
      } else {
        console.log("❌ No images found.");
        setImageUrl(null); // No image fallback
      }
    } catch (error) {
      console.error("🚨 Error fetching property image:", error);
    }
  };


  const getPriceEvaluation = () => {
    if (!propertyDetails || !propertyDetails.appraisedValue) return { text: "Not Available", color: '#6B7280' }; // Default color if unavailable

    const appraisedValue = propertyDetails.appraisedValue;
    let priceText = '';
    let textColor = '';

    if (adjustedPrice < appraisedValue * 0.9) {
      priceText = "Great Price";
      textColor = '#16A34A'; // Green for Good Price
    } else if (adjustedPrice <= appraisedValue * 1.1) {
      priceText = "Fair Price";
      textColor = '#F59E0B'; // Yellow/Blue for Fair Price
    } else {
      priceText = "Bad Price";
      textColor = '#F87171'; // Light Red for Bad Price
    }

    return { text: priceText, color: textColor };
  };


  const handleSliderChange = debounce((value) => {
    setAdjustedPrice(value);
  }, 200);



  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      {/* ✅ Back Button & Dark Mode Toggle */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={darkMode ? "#FFD700" : "#007AFF"} />
        </TouchableOpacity>
        <View style={styles.switchContainer}>
          <Text style={[styles.switchLabel, darkMode && styles.switchLabelDark]}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={toggleDarkMode} />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={darkMode ? "#FFD700" : "#007AFF"} />
      ) : propertyDetails ? (
        <ScrollView style={[styles.detailsContainer, darkMode && styles.detailsContainerDark]}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: 300, height: 200 }}
              onError={(e) => console.log("🚨 Image Load Error:", e.nativeEvent.error)}
            />
          ) : (
            <Text>No Image Available</Text>
          )}
          <Text style={[styles.disclaimer, darkMode && styles.disclaimerDark]}>This is just a placeholder image and not the actual property</Text>
          <Text style={[styles.title, darkMode && styles.titleDark]}>{propertyDetails.address || 'No Address Available'}</Text>
          <View style={styles.divider} />
          <Text style={[styles.info, darkMode && styles.infoDark]}>
            <Text style={[styles.label, darkMode && styles.labelDark]}>County:</Text> {county.toUpperCase()}
          </Text>
          <Text style={[styles.info, darkMode && styles.infoDark]}>
            <Text style={[styles.label, darkMode && styles.labelDark]}>Owner:</Text> {propertyDetails.ownerName || 'Not Available'}
          </Text>
          <Text style={[styles.value, darkMode && styles.valueDark]}>
            {`Appraised Value: ${propertyDetails.appraisedValue ? `$${propertyDetails.appraisedValue.toLocaleString()}` : 'Not Available'}`}
          </Text>
          <Text style={[styles.info, darkMode && styles.infoDark]}>
            <Text style={[styles.label, darkMode && styles.labelDark]}>Subdivision:</Text> {propertyDetails.subdivision || 'N/A'}
          </Text>
          <Text style={[styles.info, darkMode && styles.infoDark]}>
            <Text style={[styles.label, darkMode && styles.labelDark]}>Legal Description:</Text> {propertyDetails.legalDescription || 'Not Available'}
          </Text>
          <Text
            style={[styles.priceDeal, { color: getPriceEvaluation().color }]}>
            {getPriceEvaluation().text}
          </Text>
          <Slider
            style={{ width: '100%', height: 40, }}
            minimumValue={propertyDetails.appraisedValue * 0.8}
            maximumValue={propertyDetails.appraisedValue * 1.2}
            value={adjustedPrice}
            onValueChange={handleSliderChange}
            minimumTrackTintColor="#1E90FF"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor="#1E90FF"
          />
          <Text style={[styles.estimatedPrice, darkMode && styles.estimatedPriceDark]}>${adjustedPrice.toLocaleString()}</Text>
        </ScrollView>
      ) : (
        <Text style={[styles.errorText, darkMode && styles.errorTextDark]}>No property details available.</Text>
      )
      }
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  containerDark: {
    backgroundColor: '#181A1B',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // ✅ Back button & Switch on same line
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
    marginRight: 8,
    color: '#374151',
  },
  switchLabelDark: {
    color: '#E4E6EB',
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  detailsContainerDark: {
    backgroundColor: '#242526',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 14,
  },
  titleDark: {
    color: '#E4E6EB',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },
  info: {
    fontSize: 16,
    marginBottom: 8,
    color: '#475569',
  },
  infoDark: {
    color: '#B0B3B8',
  },
  label: {
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  labelDark: {
    color: '#FFD700',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16A34A',
    marginBottom: 10,
  },
  valueDark: {
    color: '#16A34A',
  },
  errorText: {
    fontSize: 18,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 20,
  },
  errorTextDark: {
    color: '#FF6B6B',
  },
  estimatedPrice: {
    fontSize: 16,
    marginBottom: 8,
    paddingBottom: 50,
    textAlign: 'center',
    color: '#475569',
  },
  estimatedPriceDark: {
    color: '#B0B3B8',
  },
  priceDeal: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#475569',
  },
  priceDealDark: {
    color: '#B0B3B8',
  },
  priceDealGreen: {
    color: '#16A34A', // Green for Good Price
  },
  priceDealYellow: {
    color: '#F59E0B', // Yellow/Blue for Fair Price
  },
  priceDealRed: {
    color: '#F87171', // Light Red for Bad Price
  },
  disclaimer: {
    fontSize: 8,
    color: '#475569',
    textAlign: 'center',
    paddingBottom: 10,
  },
  disclaimerDark: {
    color: '#B0B3B8',
  }
});

export default DetailsScreen;
