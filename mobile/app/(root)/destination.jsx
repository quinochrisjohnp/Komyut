import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  FlatList,
  Keyboard,
  Alert,
} from "react-native";
import BottomNav from "../../components/BottomNav";
import { WebView } from "react-native-webview";
import debounce from "lodash.debounce";
import { SafeAreaView } from "react-native-safe-area-context";

const GOOGLE_MAPS_API_KEY = 'AIzaSyCd2dKiKFBQ3C9M0WszyPHHLbBrWafGSvI';
const MAP_ID = 'c189603921f4de17a7419bb7';

// ---- HTML MAP ----
const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
    </style>
    <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry"></script>
    <script>
      let map;
      let currentMarker = null;
      let polyline = null;

      function initMap() {
        const center = { lat: 14.6078, lng: 120.9946 };
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
        if (currentMarker) currentMarker.setMap(null);
        currentMarker = new google.maps.Marker({ position: newPos, map: map });
      }

      function drawPolyline(encoded) {
        try {
          if (polyline) polyline.setMap(null);
          const decoded = google.maps.geometry.encoding.decodePath(encoded);
          polyline = new google.maps.Polyline({
            path: decoded,
            geodesic: true,
            strokeColor: "#007AFF",
            strokeOpacity: 0.8,
            strokeWeight: 5,
          });
          polyline.setMap(map);
          const bounds = new google.maps.LatLngBounds();
          decoded.forEach(p => bounds.extend(p));
          map.fitBounds(bounds);
        } catch(e) { 
          console.error("Polyline error", e); 
        }
      }

      function handleMessage(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.lat && data.lng) {
            moveTo(data.lat, data.lng);
          }
          if (data.polyline) {
            drawPolyline(data.polyline);
          }
        } catch (e) {
          console.error('Failed to parse message', e);
        }
      }

      window.addEventListener('message', handleMessage);
      document.addEventListener('message', handleMessage);
    </script>
  </head>
  <body onload="initMap()">
    <div id="map"></div>
  </body>
</html>
`;

export default function RoutesScreen() {
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [quickRoute, setQuickRoute] = useState(null);
  const [affordableRoute, setAffordableRoute] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const [startPredictions, setStartPredictions] = useState([]);
  const [endPredictions, setEndPredictions] = useState([]);
  const [startSuggestion, setStartSuggestion] = useState("");
  const [endSuggestion, setEndSuggestion] = useState("");
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showEndDropdown, setShowEndDropdown] = useState(false);

  const [isStudent, setIsStudent] = useState(false);

  const webviewRef = useRef(null);

  // ---- HELPERS ----
  const kmFromMeters = (m) => Math.ceil(m / 1000);

  // Simplified Sampaloc Fare Calculator
  const fareCalculator = (mode, km) => {
    const roundedKm = Math.ceil(km);
    if (mode === "walking") return 0;
    if (mode === "jeep") return 13;
    if (mode === "ejeep") return 15;
    if (mode === "tricycle") return roundedKm < 1 ? 30 : 30 + (roundedKm - 1) * 50;
    return 0; // fallback
  };

  // For Sampaloc, prioritize short-distance modes
  const chooseLocalModeByKm = (km) => {
    if (km <= 1) return "tricycle";
    if (km <= 3) return "jeep";
    if (km <= 4) return "ejeep";
    return "walking"; // anything beyond 4km usually leaves Sampaloc
  };


  const mapGoogleStepToMode = (step, kmForStep = 0) => {
    if (step.travel_mode === "WALKING") return "walking";  

    if (step.travel_mode === "TRANSIT") {
      const vehicle = step.transit_details?.line?.vehicle?.type || "";
      if (vehicle === "BUS" || vehicle === "MINIBUS") return "ejeep";  // treat bus/minibus as e-jeep
      if (vehicle === "SHARED_TAXI") return "jeep";                    // treat shared taxi as jeep
      return "jeep"; // fallback
    }

    if (step.travel_mode === "DRIVING") {
      return chooseLocalModeByKm(kmForStep); // estimate based on distance
    }

    return "walking"; // default
  };


  const enrichStepsWithFare = (steps) => {
    return steps.map((s) => {
      const km = kmFromMeters(s.distance?.value || 0);
      const mode = mapGoogleStepToMode(s, km);
      const fare = fareCalculator(mode, km, isStudent);
      return { ...s, localMode: mode, localFare: fare };
    });
  };

  const modeLabel = (mode) => {
    switch (mode) {
      case "jeep": return "Jeepney";
      case "ejeep": return "E-Jeep";
      case "uv_traditional": return "UV (Traditional)";
      case "uv_modern": return "UV (Modern)";
      case "tricycle": return "Tricycle";
      case "walking": return "Walking";
      default: return mode;
    }
  };

  // ---- SEARCH ----
  const searchPlaces = async (text, setPredictions, setShowDropdown) => {
    if (text.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text
        )}&key=${GOOGLE_MAPS_API_KEY}&components=country:ph&location=14.6078,120.9946&radius=30000`
      );
      const data = await res.json();

      if (data.status === 'OK') {
        // Filter results containing Sampaloc
        const filtered = (data.predictions || []).filter(p =>
          p.description.toLowerCase().includes("sampaloc")
        );
        setPredictions(filtered);
        setShowDropdown(filtered.length > 0);
      } else {
        console.error("Places API error:", data.status);
        setPredictions([]);
        setShowDropdown(false);
      }
    } catch (err) {
      console.error("Search error:", err);
      setPredictions([]);
      setShowDropdown(false);
    }
  };

  const debouncedSearchStart = useRef(
    debounce(async (t) => {
      await searchPlaces(t, (results) => {
        setStartPredictions(results);
        setStartSuggestion(results.length > 0 ? results[0].description : "");
      }, setShowStartDropdown);
    }, 300)
  ).current;

  const debouncedSearchEnd = useRef(
    debounce(async (t) => {
      await searchPlaces(t, (results) => {
        setEndPredictions(results);
        setEndSuggestion(results.length > 0 ? results[0].description : "");
      }, setShowEndDropdown);
    }, 300)
  ).current;

  const handleSearchStart = (text) => {
    setStart(text);
    debouncedSearchStart(text);
  };

  const handleSearchEnd = (text) => {
    setEnd(text);
    debouncedSearchEnd(text);
  };

  const getPlaceId = async (address) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${GOOGLE_MAPS_API_KEY}&components=country:PH&bounds=14.5500,120.9200|14.6600,121.0700`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.results.length > 0) {
        // Prefer Sampaloc results
        const sampalocResult = data.results.find(r =>
          r.formatted_address.toLowerCase().includes("sampaloc")
        );
        return sampalocResult ? sampalocResult.place_id : data.results[0].place_id;
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  // ---- Distance Helper ----
  const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const computeRoutes = async () => {
    if (!start.trim() || !end.trim()) {
      Alert.alert("Error", "Please enter both start and destination");
      return;
    }
    
    Keyboard.dismiss();
    setShowStartDropdown(false);
    setShowEndDropdown(false);
    setLoadingRoutes(true);
    setQuickRoute(null);
    setAffordableRoute(null);
    setSelectedRoute(null);

    try {
      const startPid = await getPlaceId(start);
      const endPid = await getPlaceId(end);
      
      if (!startPid || !endPid) {
        Alert.alert("Error", "Could not find one of the locations. Please try different search terms.");
        setLoadingRoutes(false);
        return;
      }

      // Get coordinates for distance calculation
      const geoUrl = (pid) =>
        `https://maps.googleapis.com/maps/api/geocode/json?place_id=${pid}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const [sRes, eRes] = await Promise.all([
        fetch(geoUrl(startPid)),
        fetch(geoUrl(endPid)),
      ]);
      
      const sData = await sRes.json();
      const eData = await eRes.json();
      
      if (sData.status !== 'OK' || eData.status !== 'OK') {
        throw new Error("Failed to get location coordinates");
      }
      
      const sLoc = sData.results[0].geometry.location;
      const eLoc = eData.results[0].geometry.location;

      const straightKm = haversineDistanceKm(
        sLoc.lat,
        sLoc.lng,
        eLoc.lat,
        eLoc.lng
      );

      // Short-distance fallback (≤1.5km)
      if (straightKm <= 1.5) {
        // For short distances, still call Google Directions API to get actual routes and polylines
        const origin = `place_id:${startPid}`;
        const destination = `place_id:${endPid}`;

        try {
          // Get walking route
          const walkingUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
            origin
          )}&destination=${encodeURIComponent(
            destination
          )}&mode=walking&key=${GOOGLE_MAPS_API_KEY}`;

          // Get transit route (if available)
          const transitUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
            origin
          )}&destination=${encodeURIComponent(
            destination
          )}&mode=transit&departure_time=now&key=${GOOGLE_MAPS_API_KEY}`;

          const [walkRes, transitRes] = await Promise.all([
            fetch(walkingUrl),
            fetch(transitUrl)
          ]);

          const walkData = await walkRes.json();
          const transitData = await transitRes.json();

          // Process walking route
          if (walkData.status === 'OK' && walkData.routes.length > 0) {
            const walkRoute = walkData.routes[0];
            const walkSteps = enrichStepsWithFare(walkRoute.legs[0].steps);
            
            setAffordableRoute({
              mode: "Cheapest Route",
              duration: walkRoute.legs[0].duration.text,
              distance: walkRoute.legs[0].distance.text,
              fare: "0.00",
              steps: walkSteps,
              polyline: walkRoute.overview_polyline.points,
            });
          } else {
            // Fallback to estimated walking
            setAffordableRoute({
              mode: "Cheapest Route",
              duration: `${Math.max(1, Math.round(straightKm / 0.07))} mins (walking est)`,
              distance: `${straightKm.toFixed(2)} km`,
              fare: "0.00",
              steps: [{ localMode: "walking", localFare: 0, html_instructions: "Walk to destination" }],
              polyline: null,
            });
          }

          // Process transit route or use tricycle fallback
          if (transitData.status === 'OK' && transitData.routes.length > 0) {
            const transitRoute = transitData.routes[0];
            const transitSteps = enrichStepsWithFare(transitRoute.legs[0].steps);
            const totalFare = transitSteps.reduce((sum, s) => sum + s.localFare, 0);
            
            setQuickRoute({
              mode: "Fastest Route",
              duration: transitRoute.legs[0].duration.text,
              distance: transitRoute.legs[0].distance.text,
              fare: totalFare.toFixed(2),
              steps: transitSteps,
              polyline: transitRoute.overview_polyline.points,
            });
          } else {
            // Fallback to tricycle option
            const tricycleFare = fareCalculator("tricycle", straightKm, isStudent);
            setQuickRoute({
              mode: "Fastest Route",
              duration: `${Math.max(1, Math.round(straightKm / 0.25))} mins (tricycle est)`,
              distance: `${straightKm.toFixed(2)} km`,
              fare: tricycleFare.toFixed(2),
              steps: [{
                localMode: "tricycle",
                localFare: tricycleFare,
                html_instructions: "Take tricycle to destination"
              }],
              polyline: null,
            });
          }

        } catch (error) {
          console.error("Short distance route error:", error);
          // Fallback to original simple routes
          const walkTime = Math.max(1, Math.round(straightKm / 0.07));
          const tricycleTime = Math.max(1, Math.round(straightKm / 0.25));
          const tricycleFare = fareCalculator("tricycle", straightKm, isStudent);
          
          setAffordableRoute({
            mode: "Cheapest Route",
            duration: `${walkTime} mins (walking est)`,
            distance: `${straightKm.toFixed(2)} km`,
            fare: "0.00",
            steps: [{ localMode: "walking", localFare: 0, html_instructions: "Walk to destination" }],
            polyline: null,
          });

          setQuickRoute({
            mode: "Fastest Route",
            duration: `${tricycleTime} mins (tricycle est)`,
            distance: `${straightKm.toFixed(2)} km`,
            fare: tricycleFare.toFixed(2),
            steps: [{
              localMode: "tricycle",
              localFare: tricycleFare,
              html_instructions: "Take tricycle to destination"
            }],
            polyline: null,
          });
        }

        setLoadingRoutes(false);
        return;
      }

      // For longer distances, use Google Directions API
      const origin = `place_id:${startPid}`;
      const destination = `place_id:${endPid}`;

      const baseUrl = (pref) =>
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
          origin
        )}&destination=${encodeURIComponent(
          destination
        )}&alternatives=true&region=ph&mode=transit&departure_time=now&transit_routing_preference=${pref}&key=${GOOGLE_MAPS_API_KEY}`;

      const [res1, res2] = await Promise.all([
        fetch(baseUrl("less_walking")),
        fetch(baseUrl("fewer_transfers")),
      ]);
      
      const data1 = await res1.json();
      const data2 = await res2.json();

      const allRoutes = [...(data1.routes || []), ...(data2.routes || [])];
      
      if (allRoutes.length === 0) {
        Alert.alert("No Routes", "No available routes found. Try different locations or check your internet connection.");
        setLoadingRoutes(false);
        return;
      }

      // Process routes with fares
      const routesWithFares = allRoutes.map((route) => {
        const steps = enrichStepsWithFare(route.legs[0].steps);
        const totalFare = steps.reduce((sum, s) => sum + s.localFare, 0);
        return {
          route,
          steps,
          totalFare,
          duration: route.legs[0].duration.value, // seconds
        };
      });

      // Find cheapest route
      const cheapest = routesWithFares.reduce((a, b) =>
        a.totalFare < b.totalFare ? a : b
      );

      // Find fastest route
      const fastest = routesWithFares.reduce((a, b) =>
        a.duration < b.duration ? a : b
      );

      // Set routes
      setQuickRoute({
        mode: "Fastest Route",
        duration: fastest.route.legs[0].duration.text,
        distance: fastest.route.legs[0].distance.text,
        fare: fastest.totalFare.toFixed(2),
        steps: fastest.steps,
        polyline: fastest.route.overview_polyline.points,
      });

      setAffordableRoute({
        mode: "Cheapest Route",
        duration: cheapest.route.legs[0].duration.text,
        distance: cheapest.route.legs[0].distance.text,
        fare: cheapest.totalFare.toFixed(2),
        steps: cheapest.steps,
        polyline: cheapest.route.overview_polyline.points,
      });

      
    } catch (err) {
      console.error("Directions error:", err);
      Alert.alert("Error", "Something went wrong while fetching routes. Please check your internet connection and try again.");
    } finally {
      setLoadingRoutes(false);
    }
  };

  const showRouteOnMap = (route) => {
    setSelectedRoute(route);
    if (webviewRef.current && route.polyline) {
      const message = JSON.stringify({ polyline: route.polyline });
      webviewRef.current.postMessage(message);
    }
  };

  const handleStartSelection = (item) => {
    setStart(item.description);
    setStartPredictions([]);
    setShowStartDropdown(false);
    Keyboard.dismiss();
  };

  const handleEndSelection = (item) => {
    setEnd(item.description);
    setEndPredictions([]);
    setShowEndDropdown(false);
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Section */}
      <View style={styles.searchContainer}>
        {/* Start Location Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter start location"
            value={start}
            onChangeText={handleSearchStart}
            onFocus={() => setShowStartDropdown(startPredictions.length > 0)}
            onSubmitEditing={() => {
              if (startSuggestion) {
                setStart(startSuggestion);
                setStartPredictions([]);
                setShowStartDropdown(false);
              }
            }}
          />
        </View>

        {/* Start Predictions Dropdown */}
        {showStartDropdown && startPredictions.length > 0 && (
          <View style={styles.dropdownContainer}>
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={startPredictions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleStartSelection(item)}
                >
                  <Text style={styles.dropdownText}>{item.description}</Text>
                </TouchableOpacity>
              )}
              nestedScrollEnabled={true}
              maxHeight={150}
            />
          </View>
        )}

        {/* End Location Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter destination"
            value={end}
            onChangeText={handleSearchEnd}
            onFocus={() => setShowEndDropdown(endPredictions.length > 0)}
            onSubmitEditing={() => {
              if (endSuggestion) {
                setEnd(endSuggestion);
                setEndPredictions([]);
                setShowEndDropdown(false);
              }
            }}
          />
        </View>

        {/* End Predictions Dropdown */}
        {showEndDropdown && endPredictions.length > 0 && (
          <View style={styles.dropdownContainer}>
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={endPredictions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleEndSelection(item)}
                >
                  <Text style={styles.dropdownText}>{item.description}</Text>
                </TouchableOpacity>
              )}
              nestedScrollEnabled={true}
              maxHeight={150}
            />
          </View>
        )}

        {/* Search Button */}
        <TouchableOpacity 
          style={[styles.searchButton, loadingRoutes && styles.searchButtonDisabled]} 
          onPress={computeRoutes}
          disabled={loadingRoutes}
        >
          <Text style={styles.searchButtonText}>
            {loadingRoutes ? "Finding Routes..." : "Find Routes"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webviewRef}
          originWhitelist={["*"]}
          source={{ html: htmlContent }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onError={(error) => console.error("WebView error:", error)}
          onHttpError={(error) => console.error("WebView HTTP error:", error)}
        />
      </View>

      {/* Routes Section */}
      <View style={styles.routesContainer}>
        {loadingRoutes && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Finding best routes...</Text>
          </View>
        )}
        
        {!selectedRoute ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {quickRoute && (
              <TouchableOpacity
                style={styles.routeCard}
                onPress={() => showRouteOnMap(quickRoute)}
              >
                <Text style={styles.routeTitle}>⚡ Quick Route</Text>
                <Text style={styles.routeDetail}>
                  {quickRoute.duration} • {quickRoute.distance}
                </Text>
                <Text style={styles.routeFare}>₱ {quickRoute.fare}</Text>
              </TouchableOpacity>
            )}
            {affordableRoute && (
              <TouchableOpacity
                style={styles.routeCard}
                onPress={() => showRouteOnMap(affordableRoute)}
              >
                <Text style={styles.routeTitle}>💰 Affordable Route</Text>
                <Text style={styles.routeDetail}>
                  {affordableRoute.duration} • {affordableRoute.distance}
                </Text>
                <Text style={styles.routeFare}>₱ {affordableRoute.fare}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>{selectedRoute.mode}</Text>
              <Text style={styles.detailFare}>₱ {selectedRoute.fare}</Text>
              <Text style={styles.detailInfo}>
                {selectedRoute.duration} • {selectedRoute.distance}
              </Text>
              
              <View style={styles.stepBox}>
                {selectedRoute.steps.map((step, idx) => (
                  <View key={idx} style={styles.stepItem}>
                    <Text style={styles.stepText}>
                      {step.html_instructions?.replace(/<[^>]+>/g, "") || "Continue"}
                    </Text>
                    {step.distance?.text && (
                      <Text style={styles.stepDistance}>({step.distance.text})</Text>
                    )}
                    {step.localFare > 0 && (
                      <Text style={styles.stepFare}>
                        {modeLabel(step.localMode)} - ₱{step.localFare.toFixed(2)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
              
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setSelectedRoute(null)}
              >
                <Text style={styles.backButtonText}>← Back to Routes</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.navOverlay}>
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

// ---- STYLES ----
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    padding: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  inputContainer: {
    position: "relative",
    marginBottom: 8,
    zIndex: 1,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },

  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownText: {
    fontSize: 14,
    color: "#333",
  },
  searchButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  searchButtonDisabled: {
    backgroundColor: "#ccc",
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
  },
  routesContainer: {
    flex: 1,
    padding: 12,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    color: "#666",
  },
  routeCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  routeTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
    color: "#333",
  },
  routeDetail: {
    color: "#666",
    fontSize: 14,
  },
  routeFare: {
    fontWeight: "bold",
    marginTop: 4,
    fontSize: 16,
    color: "#007AFF",
  },
  detailCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 6,
    color: "#333",
  },
  detailFare: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
    color: "#007AFF",
  },
  detailInfo: {
    color: "#555",
    marginBottom: 10,
    fontSize: 14,
  },
  stepBox: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  stepItem: {
    marginBottom: 8,
  },
  stepText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
  },
  stepDistance: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  stepFare: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "bold",
  },
  backButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  backButtonText: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  navOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});