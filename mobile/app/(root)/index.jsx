import React, { useState, useRef } from 'react';
import { View, TextInput, StyleSheet, FlatList, TouchableOpacity, Text, Image, Pressable, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import BottomNav from '../../components/BottomNav';
import Colors from '../Constant_Design'; // Assuming you use this for color consistency
import debounce from 'lodash.debounce'
import Animated, { SlideInUp } from 'react-native-reanimated';    
import { router } from 'expo-router';


const GOOGLE_MAPS_API_KEY = 'AIzaSyCd2dKiKFBQ3C9M0WszyPHHLbBrWafGSvI';
const MAP_ID = 'c189603921f4de17a7419bb7';

export default function Index() {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const webviewRef = useRef(null);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [selectedPlaceData, setSelectedPlaceData] = useState(null);

  const [hasPermission, setHasPermission] = useState(false);

  const handlePlaceSelect = (place) => {
    const address = place?.description || "";

    if (!address.includes("Sampaloc")) {
      setShowRestrictionModal(true);
      return;
    }

    // Continue with valid place
    setSelectedPlace(place); // or whatever logic you have
  };
  const debouncedSearch = useRef(
  debounce(async (text) => {
  console.log('Searching for:', text); // 🔍 log input
    if (text.length > 2) {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${GOOGLE_MAPS_API_KEY}&components=country:PH`
        );
        const data = await res.json();
        console.log('API Response:', data); // 🧪 log result

        if (data.error_message) {
          console.error('Google API Error:', data.error_message);
        }

        setPredictions(data.predictions || []);
      } catch (err) {
        console.error('Fetch error:', err);
      }
    } else {
      setPredictions([]);
    }
  }, 200)

  ).current;

  const handleSearch = (text) => {
    console.log('Typing:', text);
    setQuery(text);       // still updates input field right away
    debouncedSearch(text); // waits a bit before calling Google
  };

  const handleSelect = async (placeId, description) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      const address = data.result.formatted_address;

      const isInsideSampaloc = address.includes("Sampaloc") && address.includes("Manila");

      if (!isInsideSampaloc) {
        setShowRestrictionModal(true);
        setQuery("");
        setPredictions([]);
        return;
      }

      // ✅ Continue if valid place
      const { lat, lng } = data.result.geometry.location;

      // 🧭 Move the map marker
      webviewRef.current?.postMessage(JSON.stringify({ lat, lng }));

      setSelectedPlaceData({
        name: data.result.name,
        description: data.result.name, // only title
        address,
        location: { lat, lng },
      });


      // ✅ Clear search
      setQuery('');
      setPredictions([]);

      console.log("✅ Selected:", data.result.name, "|", address);

    } catch (error) {
      console.error("❌ Error fetching place details:", error);
    }
  };
  




  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
        <style>
          html, body, #map {
            height: 105%;
            margin: 0;
            padding: 0;
          }
        </style>
        <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}"></script>
        <script>
          let map;
          let currentMarker = null;

          function initMap() {
            const center = { lat: 14.607835931257247, lng: 120.99465234818744 };
            map = new google.maps.Map(document.getElementById('map'), {
              center: center,
              zoom: 14.5,
              mapId: '${MAP_ID}',
              disableDefaultUI: true,
              clickableIcons: false,
              gestureHandling: 'greedy',
            });
          }

          function moveTo(lat, lng) {
            const newPos = new google.maps.LatLng(lat, lng);
            map.panTo(newPos);

            // Remove old marker
            if (currentMarker) {
              currentMarker.setMap(null);
            }

            // Create new marker
            currentMarker = new google.maps.Marker({
              position: newPos,
              map: map,
            });
          }

          function handleMessage(event) {
            try {
              const data = JSON.parse(event.data);
              moveTo(data.lat, data.lng);
            } catch (e) {
              console.error('Failed to parse message', e);
            }
          }

          window.addEventListener('message', handleMessage);
          document.addEventListener('message', handleMessage); // <- for Android WebView
        </script>
      </head>
      <body onload="initMap()">
        <div id="map"></div>
      </body>
    </html>
  `;
  function IconButton({ icon, label, onPress }) {
    return (
      <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', width: 80 }}>
        <Image
          source={icon}
          style={{
            width: 28,
            height: 28,
            marginBottom: 4,
            resizeMode: 'contain',
          }}
        />
        <Text style={{ fontSize: 12, color: '#333' }}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <WebView
          ref={webviewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          style={styles.webview}
          javaScriptEnabled
        />

        {/* Floating Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Image source={require('../../assets/images/search_icon.png')} style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              placeholder="Search location..."
              value={query}
              onChangeText={handleSearch}
            />
          </View>

          {predictions.length > 0 && (
            <View style={styles.dropdown}>
              <FlatList
                data={predictions}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelect(item.place_id, item.structured_formatting.main_text)}
                    style={styles.dropdownItem}
                  >
                    <Text style={{ fontWeight: 'bold', fontSize: 14 }}>
                      {item.structured_formatting?.main_text}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#555', opacity: 0.6 }}>
                      {item.structured_formatting?.secondary_text}
                    </Text>
                  </TouchableOpacity>
                )}
              />

            </View>
          )}
        </View>

        {/* Floating Bottom Nav */}
        <View style={styles.navOverlay}>
          <BottomNav />
        </View>
      </View>

      {/* 🚨 RESTRICTION MODAL GOES HERE — inside JSX return */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showRestrictionModal}
        onRequestClose={() => setShowRestrictionModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Unsupported Area</Text>
            <Text style={styles.modalMessage}>
              Sorry, the current version of the app is only supported inside the District of Sampaloc, Manila.
            </Text>
            <Pressable style={styles.okButton} onPress={() => setShowRestrictionModal(false)}>
              <Text style={styles.okText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {selectedPlaceData && (
        <Animated.View
          entering={SlideInUp.duration(300)}
          style={{
            position: 'absolute',
            bottom: 50, // above nav bar
            left: 0,
            right: 0,
            padding: 20,
            backgroundColor: Colors.primary, // blue container
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 16,
              gap: 8,
            }}
          >
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{selectedPlaceData.name}</Text>
            <Text style={{ color: 'gray' }}>{selectedPlaceData.description}</Text>
            <Text style={{ fontSize: 12, color: '#333' }}>{selectedPlaceData.address}</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 }}>
              <IconButton icon={require('../../assets/images/directions-icon.png')} label="Direction" onPress={() => router.push({
                  pathname: '/destination',
                  params: { 
                    destinationName: selectedPlaceData.name,        // title
                    destinationAddress: selectedPlaceData.address   // full address
                  }
                })}
              /> 

              <IconButton icon={require('../../assets/images/saved-route-selected-logo.png')} label="Save" onPress={() => {}} />

              <IconButton
                icon={require('../../assets/images/share-icon.png')}
                label="Share"
                onPress={() => {
                  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${selectedPlaceData.location.lat},${selectedPlaceData.location.lng}`;
                  Linking.openURL(mapsLink);
                }}
              />
            </View>
          </View>
        </Animated.View>
      )}
    </>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  webview: { flex: 1 },
  navOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  searchContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    zIndex: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lighter,
    borderRadius: 40,
    paddingHorizontal: 20,
    paddingVertical: 10,
    elevation: 5,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#000',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 5,
    maxHeight: 200,
    elevation: 5,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 12,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalMessage: {
    textAlign: 'center',
    fontSize: 15,
    marginBottom: 20,
    color: '#444',
  },
  okButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  okText: {
    color: '#fff',
    fontWeight: '600',
  },
});
