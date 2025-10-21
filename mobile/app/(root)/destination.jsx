import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";

const API_URL = "https://komyut-we5n.onrender.com";

// GeoJSON routes
import tricycleRoutesGeoJSON from "../../assets/routeData/tricycle_terminals.json";
import jeepneyRoutesGeoJSON from "../../assets/routeData/jeepney_routes.json";
import suvRoutesGeoJSON from "../../assets/routeData/suv_routes.json";
import busRoutesGeoJSON from "../../assets/routeData/bus_routes.json";

// ---- CONFIG ----
const GOOGLE_MAPS_API_KEY = 'AIzaSyCd2dKiKFBQ3C9M0WszyPHHLbBrWafGSvI';
const MAP_ID = 'c189603921f4de17a7419bb7';

// ---- UPDATED FARE CONFIGURATION (with SUV) ----
const TRANSPORT_CONFIG = {
  walking: {
    speed: 5,
    fare: 0,
    color: "#28a745"
  },
  jeepney: {
    baseFare: 13,
    additionalPerKm: 2,
    speed: 20,
    color: "#ffc107"
  },
  tricycle: {
    baseFare: 15,
    additionalPerKm: 8,
    speed: 25,
    color: "#007bff"
  },
  bus: {
    baseFare: 15,
    additionalPerKm: 1.5,
    speed: 30,
    color: "#dc3545"
  },
  suv: {
    baseFare: 20,
    additionalPerKm: 3,
    speed: 50,
    color: "#6f42c1"
  }
};

// ---- HTML MAP ----
const htmlContent = `<!DOCTYPE html>
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

      function loadGeoJSON(data) {
        // intentionally empty so RN can decide when/what to render
      }

      function clearGeoJSON() {
        geoJsonLayers.forEach(l => l.setMap(null));
        geoJsonLayers = [];
      }

      function drawRouteSteps(steps) {
        polylines.forEach(p => p.setMap(null));
        polylines = [];

        steps.forEach((step) => {
          if (step.polyline && step.polyline.points) {
            const path = google.maps.geometry.encoding.decodePath(step.polyline.points);

            const polyline = new google.maps.Polyline({
              path: path,
              geodesic: true,
              strokeColor: step.color || '#007AFF',
              strokeOpacity: 0.8,
              strokeWeight: 4,
              map: map
            });

            polylines.push(polyline);

            // If this is the last polyline, fit bounds to all points
            if (polylines.length === steps.length) {
              const bounds = new google.maps.LatLngBounds();
              steps.forEach(s => {
                if (s.polyline && s.polyline.points) {
                  const p = google.maps.geometry.encoding.decodePath(s.polyline.points);
                  p.forEach(point => bounds.extend(point));
                }
              });
              map.fitBounds(bounds);
            }
          }
        });
      }

      function handleMessage(event) {
        try {
          const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

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

      // For compatibility with RN WebView messaging
      window.addEventListener('message', handleMessage);
      document.addEventListener('message', handleMessage);

      window.onload = initMap;
    </script>
  </body>
</html>`;

// ---- UTILITY FUNCTIONS ----
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
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

  const additionalDistance = Math.max(0, distance - 4);
  return Math.ceil(config.baseFare + (additionalDistance * config.additionalPerKm));
}

function calculateDuration(mode, distance) {
  const config = TRANSPORT_CONFIG[mode];
  if (!config) return 0;

  const hours = distance / config.speed;
  return Math.ceil(hours * 60);
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
  const { userId } = useAuth();
  const router = useRouter();

  const [startPredictions, setStartPredictions] = useState([]);
  const [endPredictions, setEndPredictions] = useState([]);
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showEndDropdown, setShowEndDropdown] = useState(false);

  const webviewRef = useRef(null);

  // Helper: post to webview reliably (postMessage if available, fallback injectJavaScript)
  const postToWebView = useCallback((payload) => {
    const msg = JSON.stringify(payload);
    try {
      if (webviewRef.current && typeof webviewRef.current.postMessage === "function") {
        webviewRef.current.postMessage(msg);
      } else if (webviewRef.current && typeof webviewRef.current.injectJavaScript === "function") {
        // Escape single quotes/newlines to safely inject
        const safe = msg.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
        const js = `(function(){ try{ window.postMessage('${safe}'); }catch(e){console.error(e);} })();`;
        webviewRef.current.injectJavaScript(js);
      } else {
        console.warn("Unable to send message to WebView - no supported method available");
      }
    } catch (e) {
      console.error("postToWebView error:", e);
    }
  }, []);

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
        return newRoute;
      } catch (error) {
        console.error("Error saving route:", error);
        Alert.alert("Error", "Could not save route.");
      }
    },
    [userId]
  );

  const sendGeoJSON = useCallback(() => {
    postToWebView({
      geojson: {
        jeepney: jeepneyRoutesGeoJSON,
        tricycle: tricycleRoutesGeoJSON,
        bus: busRoutesGeoJSON,
        suv: suvRoutesGeoJSON,
      }
    });
  }, [postToWebView]);

  useEffect(() => {
    const t = setTimeout(() => {
      sendGeoJSON();
    }, 600);
    return () => clearTimeout(t);
  }, [sendGeoJSON]);

  useEffect(() => {
    const displayRouteOnMap = async () => {
      if (!quickRoute && !affordableRoute && startCoords && endCoords) {
        try {
          const walkingRoute = await getGoogleDirections(startCoords, endCoords, 'walking');

          if (walkingRoute && walkingRoute.overview_polyline) {
            postToWebView({
              steps: [{
                polyline: {
                  points: walkingRoute.overview_polyline.points
                },
                color: '#999999'
              }]
            });
          }
        } catch (error) {
          console.error('Error displaying route preview:', error);
        }
      }
    };

    displayRouteOnMap();
  }, [startCoords, endCoords, quickRoute, affordableRoute, postToWebView]);

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

  const getGoogleDirections = async (origin, destination, mode = 'transit') => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        return data.routes[0];
      }
      return null;
    } catch (error) {
      console.error('Error getting directions:', error);
      return null;
    }
  };

  const findNearestTransport = (coords, transportType) => {
    let routes;

    switch(transportType) {
      case 'jeepney':
        routes = jeepneyRoutesGeoJSON;
        break;
      case 'tricycle':
        routes = tricycleRoutesGeoJSON;
        break;
      case 'bus':
        routes = busRoutesGeoJSON;
        break;
      case 'suv':
        routes = suvRoutesGeoJSON;
        break;
      default:
        return null;
    }

    let nearest = null;
    let minDistance = Infinity;

    routes.features?.forEach(feature => {
      if (feature.geometry.type === 'LineString') {
        const coordinates = feature.geometry.coordinates;
        coordinates.forEach(coord => {
          const distance = calculateDistance(
            coords.lat, coords.lng,
            coord[1], coord[0]
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

  const generateTransportRoute = async (origin, destination, transportType, steps) => {
    let totalFare = 0;
    let totalDuration = 0;
    let totalDistance = 0;

    const nearestTransport = findNearestTransport(origin, transportType);
    const transportConfig = TRANSPORT_CONFIG[transportType];

    if (nearestTransport && nearestTransport.distance < 1) {
      const walkToStopRoute = await getGoogleDirections(
        origin,
        nearestTransport.coords,
        'walking'
      );

      if (walkToStopRoute && nearestTransport.distance > 0.1) {
        const walkDuration = calculateDuration('walking', nearestTransport.distance);
        steps.push({
          mode: 'walking',
          instructions: `Walk to ${transportType} stop (${(nearestTransport.distance * 1000).toFixed(0)}m)`,
          duration: `${walkDuration} mins`,
          distance: `${(nearestTransport.distance * 1000).toFixed(0)}m`,
          fare: 0,
          polyline: {
            points: walkToStopRoute.overview_polyline.points
          },
          color: TRANSPORT_CONFIG.walking.color
        });
        totalDuration += walkDuration;
        totalDistance += nearestTransport.distance;
      }

      const googleMode = transportType === 'jeepney' ? 'transit' : 'driving';
      const transportRoute = await getGoogleDirections(
        nearestTransport.coords,
        destination,
        googleMode
      );

      const transportDistance = calculateDistance(
        nearestTransport.coords.lat, nearestTransport.coords.lng,
        destination.lat, destination.lng
      );
      const transportFare = calculateFare(transportType, transportDistance);
      const transportDuration = calculateDuration(transportType, transportDistance);
      const routeName = nearestTransport.properties?.name || `${transportType.charAt(0).toUpperCase() + transportType.slice(1)} Route`;

      steps.push({
        mode: transportType,
        instructions: `Ride ${routeName}`,
        duration: `${transportDuration} mins`,
        distance: `${transportDistance.toFixed(1)} km`,
        fare: transportFare,
        polyline: transportRoute && transportRoute.overview_polyline ? {
          points: transportRoute.overview_polyline.points
        } : null,
        color: transportConfig ? transportConfig.color : '#000'
      });
      totalFare += transportFare;
      totalDuration += transportDuration;
      totalDistance += transportDistance;

      const walkToDestination = 0.3;
      const finalWalkDuration = calculateDuration('walking', walkToDestination);
      steps.push({
        mode: 'walking',
        instructions: `Walk to destination (${(walkToDestination * 1000).toFixed(0)}m)`,
        duration: `${finalWalkDuration} mins`,
        distance: `${(walkToDestination * 1000).toFixed(0)}m`,
        fare: 0,
        polyline: null,
        color: TRANSPORT_CONFIG.walking.color
      });
      totalDuration += finalWalkDuration;
      totalDistance += walkToDestination;

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
    }

    return null;
  };

  const generateRouteSteps = async (origin, destination, prioritizeTime = false) => {
    const steps = [];
    let totalFare = 0;
    let totalDuration = 0;
    let totalDistance = 0;

    const walkingRoute = await getGoogleDirections(origin, destination, 'walking');

    if (!walkingRoute) {
      throw new Error('Unable to find route');
    }

    const walkingDistance = walkingRoute.legs[0].distance.value / 1000;
    const maxWalkingDistance = prioritizeTime ? 1 : 2;

    if (walkingDistance <= maxWalkingDistance) {
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
      let routeFound = false;

      if (prioritizeTime) {
        const transportPriority = ['tricycle', 'suv', 'jeepney', 'bus'];

        for (const transportType of transportPriority) {
          const result = await generateTransportRoute(origin, destination, transportType, []);
          if (result) {
            steps.push(...result.steps);
            totalFare = result.totalFare;
            totalDuration = result.totalDuration;
            totalDistance = result.totalDistance;
            routeFound = true;
            break;
          }
        }
      } else {
        const transportPriority = ['jeepney', 'bus', 'tricycle', 'suv'];

        for (const transportType of transportPriority) {
          const result = await generateTransportRoute(origin, destination, transportType, []);
          if (result) {
            steps.push(...result.steps);
            totalFare = result.totalFare;
            totalDuration = result.totalDuration;
            totalDistance = result.totalDistance;
            routeFound = true;
            break;
          }
        }
      }

      if (!routeFound) {
        const directDistance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);

        if (!prioritizeTime || directDistance <= 2) {
          const walkingDuration = calculateDuration('walking', directDistance);
          steps.push({
            mode: 'walking',
            instructions: `Walk to destination (no nearby public transport)`,
            duration: `${walkingDuration} mins`,
            distance: `${directDistance.toFixed(1)} km`,
            fare: 0,
            polyline: walkingRoute ? {
              points: walkingRoute.overview_polyline.points
            } : null,
            color: TRANSPORT_CONFIG.walking.color
          });
          totalDuration = walkingDuration;
          totalDistance = directDistance;
        } else {
          const tricycleRoute = await getGoogleDirections(origin, destination, 'driving');
          const tricycleFare = calculateFare('tricycle', directDistance);
          const tricycleDuration = calculateDuration('tricycle', directDistance);

          steps.push({
            mode: 'tricycle',
            instructions: `Take tricycle directly to destination`,
            duration: `${tricycleDuration} mins`,
            distance: `${directDistance.toFixed(1)} km`,
            fare: tricycleFare,
            polyline: tricycleRoute && tricycleRoute.overview_polyline ? {
              points: tricycleRoute.overview_polyline.points
            } : null,
            color: TRANSPORT_CONFIG.tricycle.color
          });
          totalFare = tricycleFare;
          totalDuration = tricycleDuration;
          totalDistance = directDistance;
        }
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

    const coords = await getPlaceDetails(item.place_id);
    setStartCoords(coords);
  };

  const handleEndSelection = async (item) => {
    setEnd(item.description);
    setEndPredictions([]);
    setShowEndDropdown(false);
    Keyboard.dismiss();

    const coords = await getPlaceDetails(item.place_id);
    setEndCoords(coords);
  };

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
      const [affordableRouteData, quickRouteData] = await Promise.all([
        generateRouteSteps(startCoords, endCoords, false),
        generateRouteSteps(startCoords, endCoords, true)
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
    if (route && route.steps) {
      postToWebView({
        steps: route.steps.filter(step => step.polyline)
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
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
              await computeRoutes();

              await saveRoute({
                starting_loc: start,
                destination_loc: end,
                event_time: new Date().toTimeString().split(" ")[0],
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
                    <View style={[styles.stepIcon, { backgroundColor: step.color || '#ccc' }]}>
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
}

// ----- Styles -----
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  searchContainer: { padding: 12, backgroundColor: "#fff", elevation: 2 },
  inputWrapper: { marginBottom: 8 },
  input: {
    height: 44,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff"
  },
  dropdownContainer: {
    maxHeight: 160,
    backgroundColor: "#fff",
    borderColor: "#eee",
    borderWidth: 1,
    marginTop: 6,
    borderRadius: 6,
  },
  dropdownItem: { padding: 10, borderBottomColor: "#f1f1f1", borderBottomWidth: 1 },
  dropdownText: { fontSize: 14 },
  searchButton: {
    marginTop: 6,
    height: 44,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  searchButtonText: { color: "#fff", fontWeight: "600" },
  mapContainer: { height: 260, marginVertical: 8, backgroundColor: "#e9ecef" },
  routesContainer: { flex: 1, padding: 12 },
  loadingContainer: { alignItems: "center", padding: 20 },
  loadingText: { marginTop: 8, color: "#666" },
  routeCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 1
  },
  affordableCard: {},
  fastestCard: {},
  routeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  routeTitle: { fontWeight: "700" },
  routeFare: { fontWeight: "700" },
  routeInfo: { color: "#666", marginTop: 6 },
  routePreview: { color: "#888", marginTop: 4, fontSize: 13 },
  detailCard: { backgroundColor: "#fff", borderRadius: 10, padding: 12 },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailTitle: { fontWeight: "700", fontSize: 18 },
  detailFare: { fontWeight: "700" },
  detailInfo: { color: "#666", marginVertical: 8 },
  stepsContainer: { marginTop: 8 },
  stepsTitle: { fontWeight: "700", marginBottom: 8 },
  stepItem: { flexDirection: "row", marginBottom: 10, alignItems: "flex-start" },
  stepIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", marginRight: 10 },
  stepNumber: { color: "#fff", fontWeight: "700" },
  stepContent: { flex: 1 },
  stepInstruction: { fontWeight: "600" },
  stepDetails: { color: "#666", marginTop: 4 },
  backButton: { marginTop: 10 },
  backButtonText: { color: "#007AFF", fontWeight: "600" }
});
