import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, TextInput, Button, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';  // ✅ Import AsyncStorage
import axios from 'axios';
import countyAPIs from '../data/valid_counties.json';

const HomeScreen = () => {
  const [streetNumber, setStreetNumber] = useState('');
  const [streetName, setStreetName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);  // ✅ Dark Mode State
  const navigation = useNavigation();
  const BATCH_SIZE = 15;

  // ✅ Load saved theme when the app starts
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

  const fetchSuggestions = async () => {
    if (!streetName) return;
    setLoading(true);
    setSuggestions([]);
    const formattedStreetName = `StreetName%3A${streetName.replace(/\s+/g, '%20')}`;
    const formattedStreetNumber = streetNumber ? `StreetNumber%3A${streetNumber.replace(/\s+/g, '%20')}%20` : '';

    const countyEntries = Object.entries(countyAPIs);
    let results = new Map();

    for (let i = 0; i < countyEntries.length; i += BATCH_SIZE) {
      const batch = countyEntries.slice(i, i + BATCH_SIZE);
      const apiRequests = batch.map(([county, apiURL]) => {
        const queryURL = apiURL.replace('StreetNumber%3A2', formattedStreetNumber)
          .replace('StreetName%3AH', formattedStreetName)
          .concat('%20Year%3A2025');
        return axios.get(queryURL)
          .then(response => {
            if (response.data?.resultsList?.length > 0) {
              response.data.resultsList.forEach(item => {
                const uniqueId = `${county}_${item.propertyId || 'UnknownID'}`;
                if (!results.has(uniqueId)) {
                  results.set(uniqueId, {
                    propertyid: uniqueId,
                    situs: item.address || 'Unknown Address',
                    county
                  });
                }
              });
            }
          })
          .catch(error => console.error(`Error fetching data from ${county}:`, error.message));
      });

      await Promise.allSettled(apiRequests);
      setSuggestions(Array.from(results.values()));
    }

    setLoading(false);
  };

  const handleSelectSuggestion = (item) => {
    const propertyIdWithoutCounty = item.propertyid.split('_')[1];
    navigation.navigate('Details', { propertyid: propertyIdWithoutCounty, county: item.county });
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.containerDark]}>
      <View style={styles.switchContainer}>
        <Text style={[styles.switchLabel, darkMode && styles.switchLabelDark]}>Dark Mode</Text>
        <Switch value={darkMode} onValueChange={toggleDarkMode} />
      </View>

      <TextInput
        value={streetNumber}
        onChangeText={setStreetNumber}
        placeholder="Enter street number (optional)..."
        style={[styles.input, darkMode && styles.inputDark]}
        placeholderTextColor={darkMode ? "#B0B3B8" : "#000"}
      />
      <TextInput
        value={streetName}
        onChangeText={setStreetName}
        placeholder="Enter street name..."
        style={[styles.input, darkMode && styles.inputDark]}
        placeholderTextColor={darkMode ? "#B0B3B8" : "#000"}
      />
      <TouchableOpacity style={[styles.button, darkMode && styles.buttonDark]} onPress={fetchSuggestions}>
        <Text style={styles.buttonText}>Search</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color={darkMode ? "#FFD700" : "#007AFF"} style={styles.loading} />}

      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.propertyid}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleSelectSuggestion(item)} style={[styles.card, darkMode && styles.cardDark]}>
            <View>
              <Text style={[styles.address, darkMode && styles.addressDark]}>{item.situs}</Text>
              <Text style={[styles.county, darkMode && styles.countyDark]}>{item.county.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F8FAFC' },
  containerDark: { backgroundColor: '#181A1B' },
  switchContainer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 10 },
  switchLabel: { fontSize: 16, marginRight: 8, color: '#374151' },
  switchLabelDark: { color: '#E4E6EB' },
  input: { height: 44, borderColor: '#CBD5E1', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#FFFFFF', marginBottom: 12, color: '#000' },
  inputDark: { backgroundColor: '#303236', borderColor: '#555759', color: '#FFF' },
  button: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: 12, elevation: 4 },
  buttonDark: { backgroundColor: '#FFD700' },
  buttonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#FFF', padding: 14, borderRadius: 10, marginBottom: 10, elevation: 4 },
  cardDark: { backgroundColor: '#242526' },
  address: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  addressDark: { color: '#E4E6EB' },
  county: { fontSize: 14, color: '#6B7280' },
  countyDark: { color: '#B0B3B8' },
  loading: { marginTop: 12 },
});

export default HomeScreen;
