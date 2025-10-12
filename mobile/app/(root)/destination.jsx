import React, { useState, useRef, useEffect,  useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
  Keyboard,
} from "react-native";
import BottomNav from "../../components/BottomNav";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSearchRoutes } from "../../hooks/useSearchRoutes";
import { useAuth } from "@clerk/clerk-expo"; // if you're using Clerk
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
const API_URL = "https://komyut-we5n.onrender.com";  // Note trailing slash


// GeoJSON routes
import tricycleRoutesGeoJSON from "../../assets/routeData/tricycle_terminals.json";
import jeepneyRoutesGeoJSON from "../../assets/routeData/jeepney_routes.json";
import suvRoutesGeoJSON from "../../assets/routeData/suv_routes.json";
import busRoutesGeoJSON from "../../assets/routeData/bus_routes.json";

// ---- CONFIG ----
const GOOGLE_MAPS_API_KEY = 'AIzaSyCd2dKiKFBQ3C9M0WszyPHHLbBrWafGSvI';
const MAP_ID = 'c189603921f4de17a7419bb7';


// ---- FARE CONFIGURATION ----
const TRANSPORT_CONFIG = {
  walking: {
    speed: 5, // km/h
    fare: 0,
    color: "#28a745"
  },
  jeepney: {
    baseFare: 13,
    additionalPerKm: 2,
    speed: 20, // km/h
    color: "#ffc107"
  },
  tricycle: {
    baseFare: 15,
    additionalPerKm: 8,
    speed: 25, // km/h
    color: "#007bff"
  },
  bus: {
    baseFare: 15,
    additionalPerKm: 1.5,
    speed: 30, // km/h
    color: "#dc3545"
  }
};

// ---- HTML MAP ----
const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
    <meta charset="utf-8">
    <style>
      html, body, #map {
        height: 100%;
        margin: 0;
        padding: 0;
      }
    </style>
    <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      let map, polylines = [];
      let geoJsonLayers = [];

      function initMap() {
        const center = { lat: 14.6078, lng: 120.9946 };
        map = new google.maps.Map(document.getElementById('map'), {
          center,
          zoom: 14.5,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
        });
      }

      // ✅ load GeoJSON with default styling
      function loadGeoJSON(data) {
        // Skip drawing GeoJSON completely
      }

      function clearGeoJSON() {
        geoJsonLayers.forEach(l => l.setMap(null));
        geoJsonLayers = [];
      }

      // ✅ draw decoded steps as plain neutral lines
      function drawRouteSteps(steps) {
        // Remove existing polylines
        polylines.forEach(p => p.setMap(null));
        polylines = [];
        // Do not draw anything — lines removed
      }

      // ✅ handle messages
      function handleMessage(event) {
        try {
          const payload = JSON.parse(event.data);

          if (payload.steps) {
            drawRouteSteps(payload.steps);
          }

          if (payload.geojson) {
            clearGeoJSON();
            if (payload.geojson.jeepney) loadGeoJSON(payload.geojson.jeepney);
            if (payload.geojson.tricycle) loadGeoJSON(payload.geojson.tricycle);
            if (payload.geojson.bus) loadGeoJSON(payload.geojson.bus);
            if (payload.geojson.suv) loadGeoJSON(payload.geojson.suv);
          }
        } catch (e) {
          console.error("GeoJSON message error:", e);
        }
      }

      window.addEventListener('message', handleMessage);
      document.addEventListener('message', handleMessage);

      // Initialize map
      window.onload = initMap;
    </script>
  </body>
</html>
`;


// ---- UTILITY FUNCTIONS ----
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateFare(mode, distance) {
  const config = TRANSPORT_CONFIG[mode];
  if (!config) return 0;
  
  if (mode === 'walking') return 0;
  
  const additionalDistance = Math.max(0, distance - 4); // First 4km covered by base fare
  return Math.ceil(config.baseFare + (additionalDistance * config.additionalPerKm));
}

function calculateDuration(mode, distance) {
  const config = TRANSPORT_CONFIG[mode];
  if (!config) return 0;
  
  const hours = distance / config.speed;
  return Math.ceil(hours * 60); // Convert to minutes
}

// ---- SCREEN ----
export default function RoutesScreen() {
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [quickRoute, setQuickRoute] = useState(null);
  const [affordableRoute, setAffordableRoute] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const { userId } = useAuth(); // Clerk gives you the authenticated user id
  const router = useRouter();

  // 🔎 Autocomplete states
  const [startPredictions, setStartPredictions] = useState([]);
  const [endPredictions, setEndPredictions] = useState([]);
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showEndDropdown, setShowEndDropdown] = useState(false);

  const webviewRef = useRef(null);

  const saveRoute = useCallback(
    async ({ starting_loc, destination_loc, event_date, event_time }) => {
      if (!userId || !starting_loc || !destination_loc) {
        Alert.alert("Error", "All fields are required.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/search_routes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            starting_loc,
            destination_loc,
            event_time,
            event_date,
            user_id: userId,
          }),
        });

        if (!response.ok) throw new Error("Failed to save route");
        const newRoute = await response.json();
        setRoutes((prev) => [newRoute, ...prev]);
        return newRoute;
      } catch (error) {
        console.error("Error saving route:", error);
        Alert.alert("Error", "Could not save route.");
      }
    },
    [userId]
  );


  // ---- Send GeoJSON to WebView when map loads ----
  const sendGeoJSON = () => {
    if (webviewRef.current) {
      try {
        webviewRef.current.postMessage(JSON.stringify({
          geojson: {
            jeepney: jeepneyRoutesGeoJSON,
            tricycle: tricycleRoutesGeoJSON,
            bus: busRoutesGeoJSON,
            suv: suvRoutesGeoJSON,
          }
        }));
      } catch (e) {
        console.error("Failed to send geojson to webview:", e);
      }
    }
  };

  // optional: send on mount too (in case webview.load event fired very quickly)
  useEffect(() => {
    // small delay may help if webview not ready immediately
    const t = setTimeout(() => {
      sendGeoJSON();
    }, 600);
    return () => clearTimeout(t);
  }, []);

  // ---- Get coordinates from place_id ----
  const getPlaceDetails = async (placeId) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.result?.geometry?.location) {
        return {
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  };

  // ---- Get directions from Google ----
  const getGoogleDirections = async (origin, destination, mode = 'transit') => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        return data.routes[0];
      }
      return null;
    } catch (error) {
      console.error('Error getting directions:', error);
      return null;
    }
  };

  // ---- Find nearest public transport ----
  const findNearestTransport = (coords, transportType) => {
    const routes = transportType === 'jeepney' ? jeepneyRoutesGeoJSON : tricycleRoutesGeoJSON;
    let nearest = null;
    let minDistance = Infinity;
    
    routes.features?.forEach(feature => {
      if (feature.geometry.type === 'LineString') {
        const coordinates = feature.geometry.coordinates;
        coordinates.forEach(coord => {
          const distance = calculateDistance(
            coords.lat, coords.lng,
            coord[1], coord[0] // GeoJSON uses [lng, lat]
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearest = {
              coords: { lat: coord[1], lng: coord[0] },
              distance,
              properties: feature.properties
            };
          }
        });
      }
    });
    
    return nearest;
  };

  // ---- Generate route steps ----
  const generateRouteSteps = async (origin, destination, prioritizeTime = false) => {
    const steps = [];
    let totalFare = 0;
    let totalDuration = 0;
    let totalDistance = 0;

    // Get walking route as fallback
    const walkingRoute = await getGoogleDirections(origin, destination, 'walking');
    
    if (!walkingRoute) {
      throw new Error('Unable to find route');
    }

    // Check if walking distance is reasonable (< 2km for affordable, < 1km for fastest)
    const walkingDistance = walkingRoute.legs[0].distance.value / 1000; // Convert to km
    const maxWalkingDistance = prioritizeTime ? 1 : 2;
    
    if (walkingDistance <= maxWalkingDistance) {
      // Pure walking route
      const duration = calculateDuration('walking', walkingDistance);
      steps.push({
        mode: 'walking',
        instructions: `Walk to destination (${walkingDistance.toFixed(1)} km)`,
        duration: `${duration} mins`,
        distance: `${walkingDistance.toFixed(1)} km`,
        fare: 0,
        polyline: {
          points: walkingRoute.overview_polyline.points
        },
        color: TRANSPORT_CONFIG.walking.color
      });
      
      totalDuration = duration;
      totalDistance = walkingDistance;
    } else {
      // Multi-modal route
      if (prioritizeTime) {
        // Fastest route: Try tricycle first, then jeepney
        const nearestTricycle = findNearestTransport(origin, 'tricycle');
        const nearestJeepney = findNearestTransport(origin, 'jeepney');
        
        if (nearestTricycle && nearestTricycle.distance < 0.5) {
          // Use tricycle
          const walkToTricycle = nearestTricycle.distance;
          const tricycleDistance = calculateDistance(
            nearestTricycle.coords.lat, nearestTricycle.coords.lng,
            destination.lat, destination.lng
          );
          const walkToDestination = 0.2; // Assume 200m walk from drop-off
          
          // Walking to tricycle
          if (walkToTricycle > 0.1) {
            const walkDuration = calculateDuration('walking', walkToTricycle);
            steps.push({
              mode: 'walking',
              instructions: `Walk to tricycle terminal (${(walkToTricycle * 1000).toFixed(0)}m)`,
              duration: `${walkDuration} mins`,
              distance: `${(walkToTricycle * 1000).toFixed(0)}m`,
              fare: 0,
              color: TRANSPORT_CONFIG.walking.color
            });
            totalDuration += walkDuration;
            totalDistance += walkToTricycle;
          }
          
          // Tricycle ride
          const tricycleFare = calculateFare('tricycle', tricycleDistance);
          const tricycleDuration = calculateDuration('tricycle', tricycleDistance);
          steps.push({
            mode: 'tricycle',
            instructions: `Ride tricycle to near destination`,
            duration: `${tricycleDuration} mins`,
            distance: `${tricycleDistance.toFixed(1)} km`,
            fare: tricycleFare,
            color: TRANSPORT_CONFIG.tricycle.color
          });
          totalFare += tricycleFare;
          totalDuration += tricycleDuration;
          totalDistance += tricycleDistance;
          
          // Walk to final destination
          const finalWalkDuration = calculateDuration('walking', walkToDestination);
          steps.push({
            mode: 'walking',
            instructions: `Walk to destination (${(walkToDestination * 1000).toFixed(0)}m)`,
            duration: `${finalWalkDuration} mins`,
            distance: `${(walkToDestination * 1000).toFixed(0)}m`,
            fare: 0,
            color: TRANSPORT_CONFIG.walking.color
          });
          totalDuration += finalWalkDuration;
          totalDistance += walkToDestination;
          
        } else {
          // Fallback to mixed jeepney route
          return generateJeepneyRoute(origin, destination, steps, false);
        }
      } else {
        // Affordable route: Prioritize jeepney
        return generateJeepneyRoute(origin, destination, steps, true);
      }
    }

    return {
      steps,
      totalFare,
      totalDuration,
      totalDistance,
      summary: {
        duration: `${totalDuration} mins`,
        distance: `${totalDistance.toFixed(1)} km`,
        fare: totalFare
      }
    };
  };

  const generateJeepneyRoute = async (origin, destination, steps, affordable = true) => {
    let totalFare = 0;
    let totalDuration = 0;
    let totalDistance = 0;

    const nearestJeepney = findNearestTransport(origin, 'jeepney');
    
    if (nearestJeepney && nearestJeepney.distance < 1) {
      const walkToJeepney = nearestJeepney.distance;
      const jeepneyDistance = calculateDistance(
        nearestJeepney.coords.lat, nearestJeepney.coords.lng,
        destination.lat, destination.lng
      );
      const walkToDestination = 0.3; // Assume 300m walk from jeepney stop
      
      // Walking to jeepney
      if (walkToJeepney > 0.1) {
        const walkDuration = calculateDuration('walking', walkToJeepney);
        steps.push({
          mode: 'walking',
          instructions: `Walk to jeepney stop (${(walkToJeepney * 1000).toFixed(0)}m)`,
          duration: `${walkDuration} mins`,
          distance: `${(walkToJeepney * 1000).toFixed(0)}m`,
          fare: 0,
          color: TRANSPORT_CONFIG.walking.color
        });
        totalDuration += walkDuration;
        totalDistance += walkToJeepney;
      }
      
      // Jeepney ride
      const jeepneyFare = calculateFare('jeepney', jeepneyDistance);
      const jeepneyDuration = calculateDuration('jeepney', jeepneyDistance);
      const routeName = nearestJeepney.properties?.name || 'Jeepney Route';
      
      steps.push({
        mode: 'jeepney',
        instructions: `Ride ${routeName} jeepney`,
        duration: `${jeepneyDuration} mins`,
        distance: `${jeepneyDistance.toFixed(1)} km`,
        fare: jeepneyFare,
        color: TRANSPORT_CONFIG.jeepney.color
      });
      totalFare += jeepneyFare;
      totalDuration += jeepneyDuration;
      totalDistance += jeepneyDistance;
      
      // Walk to final destination
      const finalWalkDuration = calculateDuration('walking', walkToDestination);
      steps.push({
        mode: 'walking',
        instructions: `Walk to destination (${(walkToDestination * 1000).toFixed(0)}m)`,
        duration: `${finalWalkDuration} mins`,
        distance: `${(walkToDestination * 1000).toFixed(0)}m`,
        fare: 0,
        color: TRANSPORT_CONFIG.walking.color
      });
      totalDuration += finalWalkDuration;
      totalDistance += walkToDestination;
    } else {
      // No nearby public transport, suggest walking or tricycle
      const walkingDistance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
      
      if (!affordable && walkingDistance > 1) {
        // Suggest tricycle for faster route
        const tricycleFare = calculateFare('tricycle', walkingDistance);
        const tricycleDuration = calculateDuration('tricycle', walkingDistance);
        
        steps.push({
          mode: 'tricycle',
          instructions: `Take tricycle directly to destination (no nearby jeepney routes)`,
          duration: `${tricycleDuration} mins`,
          distance: `${walkingDistance.toFixed(1)} km`,
          fare: tricycleFare,
          color: TRANSPORT_CONFIG.tricycle.color
        });
        totalFare = tricycleFare;
        totalDuration = tricycleDuration;
        totalDistance = walkingDistance;
      } else {
        // Walking route
        const walkingDuration = calculateDuration('walking', walkingDistance);
        steps.push({
          mode: 'walking',
          instructions: `Walk to destination (no nearby public transport)`,
          duration: `${walkingDuration} mins`,
          distance: `${walkingDistance.toFixed(1)} km`,
          fare: 0,
          color: TRANSPORT_CONFIG.walking.color
        });
        totalDuration = walkingDuration;
        totalDistance = walkingDistance;
      }
    }

    return {
      steps,
      totalFare,
      totalDuration,
      totalDistance,
      summary: {
        duration: `${totalDuration} mins`,
        distance: `${totalDistance.toFixed(1)} km`,
        fare: totalFare
      }
    };
  };

  // ---- Autocomplete ----
  const searchPlaces = async (text, setPredictions, setShowDropdown) => {
    if (text.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        text
      )}&key=${GOOGLE_MAPS_API_KEY}&components=country:ph&location=14.6078,120.9946&radius=30000`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK") {
        setPredictions(data.predictions);
        setShowDropdown(true);
      } else {
        setPredictions([]);
        setShowDropdown(false);
      }
    } catch (err) {
      console.error("Places API error:", err);
      setPredictions([]);
      setShowDropdown(false);
    }
  };

  const handleStartChange = (text) => {
    setStart(text);
    searchPlaces(text, setStartPredictions, setShowStartDropdown);
  };

  const handleEndChange = (text) => {
    setEnd(text);
    searchPlaces(text, setEndPredictions, setShowEndDropdown);
  };

  const handleStartSelection = async (item) => {
    setStart(item.description);
    setStartPredictions([]);
    setShowStartDropdown(false);
    Keyboard.dismiss();
    
    // Get coordinates
    const coords = await getPlaceDetails(item.place_id);
    setStartCoords(coords);
  };

  const handleEndSelection = async (item) => {
    setEnd(item.description);
    setEndPredictions([]);
    setShowEndDropdown(false);
    Keyboard.dismiss();
    
    // Get coordinates
    const coords = await getPlaceDetails(item.place_id);
    setEndCoords(coords);
  };

  // ---- MAIN computeRoutes ----
  const computeRoutes = async () => {
    if (!start || !end) {
      return Alert.alert("Error", "Enter start and destination");
    }

    if (!startCoords || !endCoords) {
      return Alert.alert("Error", "Please select locations from the dropdown");
    }

    setLoadingRoutes(true);
    setQuickRoute(null);
    setAffordableRoute(null);
    setSelectedRoute(null);

    try {
      // Generate both routes
      const [affordableRouteData, quickRouteData] = await Promise.all([
        generateRouteSteps(startCoords, endCoords, false), // Affordable
        generateRouteSteps(startCoords, endCoords, true)   // Quick
      ]);

      setAffordableRoute({
        type: 'affordable',
        title: '💰 Most Affordable',
        ...affordableRouteData.summary,
        steps: affordableRouteData.steps,
        routeData: affordableRouteData
      });

      setQuickRoute({
        type: 'fastest',
        title: '⚡ Fastest',
        ...quickRouteData.summary,
        steps: quickRouteData.steps,
        routeData: quickRouteData
      });

    } catch (error) {
      console.error('Route calculation error:', error);
      Alert.alert("Error", error.message || "Unable to calculate routes");
    } finally {
      setLoadingRoutes(false);
    }
  };

  const showRouteOnMap = (route) => {
    setSelectedRoute(route);
    if (webviewRef.current && route.steps) {
      try {
        webviewRef.current.postMessage(JSON.stringify({ 
          steps: route.steps.filter(step => step.polyline) 
        }));
      } catch (e) {
        console.error("Failed to post steps to webview:", e);
      }
    }
  };

  // ---- UI ----
  return (
    <SafeAreaView style={styles.container}>
      {/* 🔎 Search */}
      <View style={styles.searchContainer}>
        {/* Start Location */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Enter start location"
            value={start}
            onChangeText={handleStartChange}
            onFocus={() => setShowStartDropdown(startPredictions.length > 0)}
          />
          {showStartDropdown && (
            <View style={styles.dropdownContainer}>
              <FlatList
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
              />
            </View>
          )}
        </View>

        {/* End Location */}
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Enter destination"
            value={end}
            onChangeText={handleEndChange}
            onFocus={() => setShowEndDropdown(endPredictions.length > 0)}
          />
          {showEndDropdown && (
            <View style={styles.dropdownContainer}>
              <FlatList
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
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={async () => {
            try {
              // Step 1: Compute possible routes
              await computeRoutes();

              // Step 2: Save the searched route to DB
              await saveRoute({
                starting_loc: start,
                destination_loc: end,
                event_time: new Date().toTimeString().split(" ")[0], // ✅
                event_date: new Date().toISOString().split("T")[0],
              });

              Alert.alert("Success", "Route calculated and saved!");
            } catch (error) {
              console.error("Find/Save error:", error);
              Alert.alert("Error", "Could not calculate or save route.");
            }
          }}
        >
          <Text style={styles.searchButtonText}>
            {loadingRoutes ? "Calculating Routes..." : "Find Routes"}
          </Text>
        </TouchableOpacity>



      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webviewRef}
          originWhitelist={["*"]}
          source={{ html: htmlContent }}
          javaScriptEnabled
          style={{ flex: 1 }}
          onLoad={() => sendGeoJSON()}
        />
      </View>

      {/* Results */}
      <View style={styles.routesContainer}>
        {loadingRoutes && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Finding best routes...</Text>
          </View>
        )}
        
        {!selectedRoute ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {affordableRoute && (
              <TouchableOpacity
                style={[styles.routeCard, styles.affordableCard]}
                onPress={() => showRouteOnMap(affordableRoute)}
              >
                <View style={styles.routeHeader}>
                  <Text style={styles.routeTitle}>{affordableRoute.title}</Text>
                  <Text style={styles.routeFare}>₱{affordableRoute.fare}</Text>
                </View>
                <Text style={styles.routeInfo}>
                  {affordableRoute.duration} • {affordableRoute.distance}
                </Text>
                <Text style={styles.routePreview}>
                  {affordableRoute.steps.length} steps • Tap to view details
                </Text>
              </TouchableOpacity>
            )}
            
            {quickRoute && (
              <TouchableOpacity
                style={[styles.routeCard, styles.fastestCard]}
                onPress={() => showRouteOnMap(quickRoute)}
              >
                <View style={styles.routeHeader}>
                  <Text style={styles.routeTitle}>{quickRoute.title}</Text>
                  <Text style={styles.routeFare}>₱{quickRoute.fare}</Text>
                </View>
                <Text style={styles.routeInfo}>
                  {quickRoute.duration} • {quickRoute.distance}
                </Text>
                <Text style={styles.routePreview}>
                  {quickRoute.steps.length} steps • Tap to view details
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>{selectedRoute.title}</Text>
                <Text style={styles.detailFare}>₱{selectedRoute.fare}</Text>
              </View>
              <Text style={styles.detailInfo}>
                {selectedRoute.duration} • {selectedRoute.distance}
              </Text>
              
              <View style={styles.stepsContainer}>
                <Text style={styles.stepsTitle}>Step-by-step directions:</Text>
                {selectedRoute.steps.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={[styles.stepIcon, { backgroundColor: step.color }]}>
                      <Text style={styles.stepNumber}>{index + 1}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepInstruction}>{step.instructions}</Text>
                      <Text style={styles.stepDetails}>
                        {step.duration} • {step.distance}
                        {step.fare > 0 && ` • ₱${step.fare}`}
                      </Text>
                    </View>
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

      <BottomNav />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchContainer: { 
    padding: 12, 
    backgroundColor: "#fff", 
    borderBottomWidth: 1, 
    borderBottomColor: "#eee", 
    elevation: 3,
  },
  searchBox: {
    height: 44,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  dropdown: {
    marginBottom: 10,
  },
  picker: {
    height: 44,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  map: {
    flex: 1,
  },
  routesList: {
    maxHeight: 250,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  routeCard: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  affordableCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
  },
  fastestCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  routeDetails: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
  },
  step: {
    fontSize: 13,
    color: "#444",
    marginBottom: 4,
    paddingLeft: 6,
    borderLeftWidth: 2,
    borderLeftColor: "#ddd",
  },
  viewDetailsBtn: {
    marginTop: 6,
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  viewDetailsText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  mapContainer: {
    flex: 1,
  },
  inputWrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    marginBottom: 6
  },
  dropdownContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    maxHeight: 160,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    marginTop: 4,
    zIndex: 1001,
    elevation: 5,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1"
  },
  dropdownText: { 
    color: "#333",
    fontSize: 14,
  },
  searchButton: {
    marginTop: 6,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center"
  },
  searchButtonText: { 
    color: "#fff", 
    fontWeight: "600",
    fontSize: 16,
  },
  routesContainer: { 
    flex: 1, 
    padding: 12,
    backgroundColor: "#f9f9f9",
  },
  loadingContainer: { 
    alignItems: "center", 
    padding: 20 
  },
  loadingText: { 
    marginTop: 8, 
    color: "#666",
    fontSize: 16,
  },
  routeHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  routeFare: { 
    fontWeight: "700",
    fontSize: 18,
    color: "#28a745",
  },
  routeInfo: { 
    color: "#666", 
    marginBottom: 6,
    fontSize: 14,
  },
  routePreview: { 
    color: "#999",
    fontSize: 12,
  },
  detailCard: { 
    padding: 16, 
    backgroundColor: "#fff", 
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  detailHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailTitle: { 
    fontSize: 20, 
    fontWeight: "700",
    color: "#333",
  },
  detailFare: { 
    fontSize: 18, 
    fontWeight: "700",
    color: "#28a745",
  },
  detailInfo: { 
    color: "#666", 
    marginVertical: 8,
    fontSize: 16,
  },
  stepsContainer: { 
    marginTop: 16 
  },
  stepsTitle: { 
    fontWeight: "700", 
    marginBottom: 12,
    fontSize: 16,
    color: "#333",
  },
  stepItem: { 
    flexDirection: "row", 
    marginBottom: 12,
    alignItems: "flex-start",
  },
  stepIcon: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    alignItems: "center", 
    justifyContent: "center", 
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: { 
    color: "#fff", 
    fontWeight: "700",
    fontSize: 14,
  },
  stepContent: { 
    flex: 1 
  },
  stepInstruction: { 
    fontWeight: "600",
    fontSize: 15,
    color: "#333",
    marginBottom: 4,
  },
  stepDetails: { 
    color: "#666",
    fontSize: 13,
  },
  backButton: { 
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    alignItems: "center",
  },
  backButtonText: { 
    color: "#007AFF",
    fontWeight: "600",
    fontSize: 16,
  }
});