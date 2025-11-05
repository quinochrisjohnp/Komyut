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
  Image,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";
import BottomNav from "../../components/BottomNav";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter, useLocalSearchParams } from "expo-router";
import Colors from '../Constant_Design'; 

const API_URL = "https://komyut-we5n.onrender.com";

// GeoJSON routes
import tricycleRoutesGeoJSON from "../../assets/routeData/tricycle_terminals.json";
import jeepneyRoutesGeoJSON from "../../assets/routeData/jeepney_routes.json";
import suvRoutesGeoJSON from "../../assets/routeData/suv_routes.json";
import busRoutesGeoJSON from "../../assets/routeData/bus_routes.json";

// dddd
const GOOGLE_MAPS_API_KEY = '47d5b949890d7d9d66722f1a';
const MAP_ID = '';

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
      let routeMarkers = [];

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

      function loadGeoJSON(data) {
        // intentionally empty so RN can decide when/what to render
      }

      function clearGeoJSON() {
        geoJsonLayers.forEach(l => l.setMap(null));
        geoJsonLayers = [];
      }

      function drawRouteSteps(steps, iconStartUrl, iconEndUrl) {
        // Clear previous polylines
        polylines.forEach(p => p.setMap(null));
        polylines = [];

        // Clear old markers (if any)
        if (routeMarkers.length > 0) {
          routeMarkers.forEach(m => m.setMap(null));
        }
        routeMarkers = [];

        // Collect all coordinates for bounds & start/end markers
        let allPoints = [];

        steps.forEach((step) => {
          if (step.polyline && step.polyline.points) {
            const path = google.maps.geometry.encoding.decodePath(step.polyline.points);
            allPoints.push(...path);

            const polyline = new google.maps.Polyline({
              path: path,
              geodesic: true,
              strokeColor: step.color || '#007AFF',
              strokeOpacity: 0.8,
              strokeWeight: 4,
              map: map
            });

            polylines.push(polyline);
          }
        });

        // ✅ Add start and end markers (if we have any points)
        if (allPoints.length > 0) {
          // Start marker (first coordinate)
          const startMarker = new google.maps.Marker({
            position: allPoints[0],
            map,
            title: "Start Location",
            icon: {
              url: iconStartUrl || "https://maps.google.com/mapfiles/kml/paddle/grn-circle.png",
              scaledSize: new google.maps.Size(25,25),   // resize
              anchor: new google.maps.Point(20, 20)       // center (half of 40x40)
            }
          });
          routeMarkers.push(startMarker);

          // End marker (last coordinate)
          const endMarker = new google.maps.Marker({
            position: allPoints[allPoints.length - 1],
            map,
            title: "Destination"
          });
          routeMarkers.push(endMarker);

          // Auto-fit map to route
          const bounds = new google.maps.LatLngBounds();
          allPoints.forEach(pt => bounds.extend(pt));
          map.fitBounds(bounds);
        }

      }

      function handleMessage(event) {
        try {
          const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

          if (payload.steps) {
            // ✅ Now includes optional start/end icons from RN side
            drawRouteSteps(payload.steps, payload.iconStart, payload.iconEnd);
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
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateFare(mode, distance) {
  const config = TRANSPORT_CONFIG[mode];
  if (!config) return 0;
  if (mode === "walking") return 0;
  const additionalDistance = Math.max(0, distance - 4);
  return Math.ceil(config.baseFare + additionalDistance * config.additionalPerKm);
}

function calculateDuration(mode, distance) {
  const config = TRANSPORT_CONFIG[mode];
  if (!config) return 0;
  return Math.ceil((distance / config.speed) * 60);
}

// ---- SCREEN ----
export default function RoutesScreen() {
  const params = useLocalSearchParams(); // ✅ Get params from saved routes
  
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
  const [destination, setDestination] = useState('');
  const { destinationName, destinationAddress } = useLocalSearchParams();
  useEffect(() => {
    if (destinationName || destinationAddress) {
      setDestination(destinationName || destinationAddress);
    }
  }, [destinationName, destinationAddress]);


  const webviewRef = useRef(null);

  // ✅ AUTO-POPULATE fields from saved route params
  useEffect(() => {
    if (params.start_location) {
      setStart(params.start_location);
      // Get coordinates for the start location
      geocodeAddress(params.start_location).then(coords => {
        if (coords) setStartCoords(coords);
      });
    }
    
    if (params.destination) {
      setEnd(params.destination);
      // Get coordinates for the destination
      geocodeAddress(params.destination).then(coords => {
        if (coords) setEndCoords(coords);
      });
    }
  }, [params.start_location, params.destination]);

  // ✅ Helper function to geocode address to coordinates
  const geocodeAddress = async (address) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results[0]) {
        return {
          lat: data.results[0].geometry.location.lat,
          lng: data.results[0].geometry.location.lng
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

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

  const findNearestAvailableTransport = (origin) => {
    const transportTypes = ['tricycle', 'jeepney', 'bus', 'suv'];
    let nearest = null;
    let nearestType = null;

    for (const type of transportTypes) {
      const candidate = findNearestTransport(origin, type);
      if (candidate && (!nearest || candidate.distance < nearest.distance)) {
        nearest = candidate;
        nearestType = type;
      }
    }

    return { nearest, nearestType };
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

      // 🔍 Find nearest available transport type dynamically
      const transportTypes = ['tricycle', 'jeepney', 'bus', 'suv'];
      let nearest = null;
      let nearestType = null;

      for (const type of transportTypes) {
        const candidate = findNearestTransport(origin, type);
        if (candidate && (!nearest || candidate.distance < nearest.distance)) {
          nearest = candidate;
          nearestType = type;
        }
      }

      if (nearest && nearestType) {
        // 🚗 Generate route for the nearest available transport
        const result = await generateTransportRoute(origin, destination, nearestType, []);
        if (result) {
          steps.push(...result.steps);
          totalFare = result.totalFare;
          totalDuration = result.totalDuration;
          totalDistance = result.totalDistance;
          routeFound = true;
        }
      } else {
        // 🕒 If no nearby transport found, use fallback by priority
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
      }

      // 🚶 If still no route found, fallback to walking or tricycle direct route
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

    // ✅ Return the full route summary and steps
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

///dddd
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

  const checkIfInSampaloc = async (coords) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${GOOGLE_MAPS_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK") {
        const address = data.results[0].formatted_address.toLowerCase();
        return address.includes("sampaloc") && address.includes("manila");
      }
      return false;
    } catch (err) {
      console.error("Geocoding error:", err);
      return false;
    }
  };

  const handleStartSelection = async (item) => {
    setStart(item.description);
    setStartPredictions([]);
    setShowStartDropdown(false);
    Keyboard.dismiss();

    const coords = await getPlaceDetails(item.place_id);
    if (coords) {
      const isInSampaloc = await checkIfInSampaloc(coords);
      if (!isInSampaloc) {
        Alert.alert("Invalid Area", "Please select a location within Sampaloc, Manila only.");
        setStart("");
        return;
      }
      setStartCoords(coords);
      addRecentSearch(item.description);
      setIsSearchMode(false);
    }
  };

  const handleEndSelection = async (item) => {
    setEnd(item.description);
    setEndPredictions([]);
    setShowEndDropdown(false);
    Keyboard.dismiss();

    const coords = await getPlaceDetails(item.place_id);
    if (coords) {
      const isInSampaloc = await checkIfInSampaloc(coords);
      if (!isInSampaloc) {
        Alert.alert("Invalid Area", "Please select a location within Sampaloc, Manila only.");
        setEnd("");
        return;
      }
      setEndCoords(coords);
      addRecentSearch(item.description);
      setIsSearchMode(false);
    }
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
        title: 'Most Affordable',
        icon: require('../../assets/images/affordable-icon.png'),
        ...affordableRouteData.summary,
        steps: affordableRouteData.steps,
        routeData: affordableRouteData
      });

      setQuickRoute({
        type: 'fastest',
        title: 'Fastest',
        icon: require('../../assets/images/quick-icon.png'),
        ...quickRouteData.summary,
        steps: quickRouteData.steps,
        routeData: quickRouteData
      });

    } catch (error) {
      console.error('Route calculation error:', error);
      Alert.alert("Error", error.message || "Unable to calculate routes");
    } finally {
      setLoadingRoutes(false);
      setIsSearchMode(false); // <-- important: kapag tapos na mag compute, exit search mode para ipakita map+routes
    }

  };

  const showRouteOnMap = (route) => {
    setSelectedRoute(route);

    if (route && route.steps) {
      // Convert local image paths to accessible URIs
      const startIcon = Image.resolveAssetSource(require('../../assets/images/current-location-icon.png')).uri;
      const endIcon = Image.resolveAssetSource(require('../../assets/images/pin-red-icon.png')).uri;

      postToWebView({
        steps: route.steps.filter(step => step.polyline),
        iconStart: startIcon,
        iconEnd: endIcon
      });
    }
  };

  // 🔁 NEW STATES
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);

  // 🔁 Swap locations
  const handleSwap = () => {
    const temp = start;
    setStart(end);
    setEnd(temp);
    const tempCoords = startCoords;
    setStartCoords(endCoords);
    setEndCoords(tempCoords);
  };

  // ✅ Check if address is inside Sampaloc, Manila
  const isInsideSampalocManila = (address) => {
    return address.includes("Sampaloc") && address.includes("Manila");
  };

  // ✋ Updated dropdown selection handler with restriction check
  const handleSelectPrediction = async (
    item,
    setField,
    setPredictions,
    setShowDropdown,
    type
  ) => {
    const description = item.description;

    if (!isInsideSampalocManila(description)) {
      setShowRestrictionModal(true);
      setField("");
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setField(description);
    setPredictions([]);
    setShowDropdown(false);

    // Optional: trigger geocoding immediately
    const coords = await geocodeAddress(description);
    if (type === "start") setStartCoords(coords);
    else setEndCoords(coords);
    addRecentSearch(description);
  };

  const [isSearchMode, setIsSearchMode] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // save to recent
  const addRecentSearch = (item) => {
    setRecentSearches(prev => {
      const updated = [item, ...prev.filter(i => i !== item)];
      return updated.slice(0, 5);
    });
  };

  const showMapAndRoutes = !isSearchMode && (quickRoute || affordableRoute);


return (
  <SafeAreaView style={styles.container}>
    {/* 🔍 SEARCH CONTAINER */}
    <View style={styles.searchContainer}>
      <View style={styles.locationContainer}>
        <View style={{ flex: 1 }}>
          {/* START INPUT */}
          <View style={styles.searchBar}>
            <Image source={require('../../assets/images/search-icon.png')} style={styles.searchIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter start location"
              value={start}
              onChangeText={handleStartChange}
              onFocus={() => {
                setIsSearchMode(true);
                setShowStartDropdown(startPredictions.length > 0);
              }}
            />
          </View>

          {/* START DROPDOWN (main + sub text) */}
          {showStartDropdown && startPredictions.length > 0 && (
            <View style={styles.dropdown}>
              <FlatList
                keyboardShouldPersistTaps="handled"
                data={startPredictions}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() =>
                      // reuse your selection handler which validates and geocodes
                      handleSelectPrediction(item, setStart, setStartPredictions, setShowStartDropdown, "start")
                    }
                  >
                    <Text style={{ fontWeight: "700", fontSize: 14 }}>
                      {item.structured_formatting?.main_text || item.description}
                    </Text>
                    {item.structured_formatting?.secondary_text ? (
                      <Text style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
                        {item.structured_formatting.secondary_text}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
          <View style={styles.searchBar2}>
            <Image source={require('../../assets/images/pin-black-icon.png')} style={styles.searchIcon} />
            {/* DESTINATION INPUT */}
            <TextInput
              style={styles.input}
              placeholder="Enter destination"
              value={end}
              onChangeText={handleEndChange}
              onFocus={() => {
                setIsSearchMode(true);
                setShowEndDropdown(endPredictions.length > 0);
              }}
            />
          </View>
          {/* DESTINATION DROPDOWN (main + sub text) */}
          {showEndDropdown && endPredictions.length > 0 && (
            <View style={styles.dropdown}>
              <FlatList
                keyboardShouldPersistTaps="handled"
                data={endPredictions}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() =>
                      handleSelectPrediction(item, setEnd, setEndPredictions, setShowEndDropdown, "end")
                    }
                  >
                    <Text style={{ fontWeight: "700", fontSize: 14 }}>
                      {item.structured_formatting?.main_text || item.description}
                    </Text>
                    {item.structured_formatting?.secondary_text ? (
                      <Text style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
                        {item.structured_formatting.secondary_text}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* 🔄 SWAP BUTTON */}
        <TouchableOpacity onPress={handleSwap} style={styles.switchButton}>
          <Image
            source={require("../../assets/images/switch-black-icon.png")}
            style={styles.switchIcon}
          />
        </TouchableOpacity>
      </View>
    </View>

    {/* CONDITIONAL: kapag nagta-type pa (isSearchMode=true) o wala pang routes */}
    {isSearchMode || (!quickRoute && !affordableRoute) ? (
      <>
        {/* ✨ SEARCH MODE — show only recent searches under inputs */}
          <View style={styles.recentContainer}>
            <Text style={styles.recentTitle}>Recent Searches</Text>

            <FlatList
              data={recentSearches}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                
                <TouchableOpacity
                  style={styles.recentItemWrapper}
                  onPress={async () => {
                    // set end and trigger compute; your computeRoutes needs startCoords & endCoords
                    setEnd(item);
                    // Optional: geocode and set endCoords here if you prefer immediate geocode:
                    const coords = await geocodeAddress(item);
                    if (coords) setEndCoords(coords);

                    setIsSearchMode(false);
                    try {
                      await computeRoutes();
                      await saveRoute({
                        starting_loc: start,
                        destination_loc: item,
                        event_time: new Date().toTimeString().split(" ")[0],
                        event_date: new Date().toISOString().split("T")[0],
                      });
                      addRecentSearch(item);
                    } catch (err) {
                      console.error(err);
                      Alert.alert("Error", "Could not calculate or save route.");
                    }
                  }}
                >
                  <View style={styles.recentBar}>
                    <Image source={require('../../assets/images/time-icon.png')} style={styles.recentIcon} />
                    <Text style={styles.recentItem}>{item}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={{
                backgroundColor: Colors.primary,
                paddingVertical: 10,
                borderRadius: 20,
                alignItems: "center",
                marginTop: 10,
                marginBottom: 15,
                marginHorizontal: "auto",
                width: 130,
              }}
              onPress={computeRoutes}
            >
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
                Find Route
              </Text>
            </TouchableOpacity>
          </View>
          
      </>
    ) : (
      <>
        {/* 🗺️ MAP VIEW */}
        <View style={styles.filler}>
        </View>

        <View style={styles.mapContainer}>
          <WebView
            ref={webviewRef}
            originWhitelist={["*"]}
            source={{ html: htmlContent }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
            onLoad={() => sendGeoJSON()}
          />
        </View>

        {/* 🚗 ROUTE OPTIONS (Fastest / Cheapest) */}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image source={affordableRoute.icon} style={{ width: 24, height: 24, marginRight: 5,}} />
                      <Text style={styles.routeTitle}>{affordableRoute.title}</Text>
                    </View>
                    <Text style={styles.routeFare}>₱{affordableRoute.fare}</Text>
                  </View>

                  <View style={styles.routedetail}>
                    <Text style={styles.routeInfo}>{affordableRoute.duration} • {affordableRoute.distance}</Text>
                    <Text style={styles.routePreview}>Tap to view details</Text>
                  </View>
                </TouchableOpacity>
              )}

              {quickRoute && (
                <TouchableOpacity
                  style={[styles.routeCard, styles.fastestCard]}
                  onPress={() => showRouteOnMap(quickRoute)}
                >
                  <View style={styles.routeHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Image source={quickRoute.icon} style={{ width: 24, height: 24, marginRight: 5,}} />
                      <Text style={styles.routeTitle}>{quickRoute.title}</Text>
                    </View>
                    <Text style={styles.routeFare}>₱{quickRoute.fare}</Text>
                  </View>
                  <View style={styles.routedetail}>
                    <Text style={styles.routeInfo}>{quickRoute.duration} • {quickRoute.distance} </Text>
                  <Text style={styles.routePreview}>Tap to view details</Text>
                  </View>
                </TouchableOpacity>
              )}
            </ScrollView>
          ) : (
            /* Selected route detail view (unchanged) */
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
                        <Text style={[styles.stepInstruction, { color: step.color || "#000" }]}>
                          {step.instructions}
                        </Text>
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
      </>
    )}
    {/* 🧭 BOTTOM NAVIGATION (always visible) */}
    <BottomNav />
  </SafeAreaView>
);
}

// ----- Styles -----
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffffff" },
  searchContainer: { padding: 12, backgroundColor: "#fff", elevation: 0 },
  inputWrapper: { marginBottom: 8 },
  dropdownContainer: {
    maxHeight: 160,
    backgroundColor: "#fff",
    borderColor: "#eee",
    borderWidth: 1,
    marginTop: 6,
    borderRadius: 6,
  },
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
  mapContainer: { 
    height: 590,  
    backgroundColor: "#ffffffff", 
    zindex: -1,
    position: 'absolute',
    top: 0, 
    left: 0,
    right: 0,
    paddingBottom: 35,
  },
  routesContainer: { 
    position: 'absolute',
    bottom: 50, 
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 35,
  },
  loadingContainer: { alignItems: "center", padding: 20 },
  loadingText: { marginTop: 8, color: "#666" },
  routeCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 12,
    marginBottom: 8,
    elevation: 1
  },
  affordableCard: {},
  fastestCard: {},
  routeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  routedetail: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  routeTitle: { fontWeight: "700" },
  routeFare: { fontWeight: "700",},
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
  backButtonText: { color: "#007AFF", fontWeight: "600" },

  switchIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    maxHeight: 150,
    marginBottom: 10,
    zIndex: 999,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 5,
    marginBottom: -15,
    marginTop: 10,
    paddingLeft: 10,
  },

  input: {
    flex: 1,
    color: '#000',
  },
  searchIcon: {
    width: 25,
    height: 25,
    marginRight: 5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lighter,
    borderRadius: 40,
    paddingHorizontal: 15,
    paddingVertical: 3,
    elevation: 3,
    marginBottom: 10,
  },

  searchBar2: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#ffffffff",
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 40,
    paddingHorizontal: 15,
    paddingVertical: 3,
    elevation: 3,
    marginBottom: 10,
  },

  switchButton: {
    marginLeft: 10,
    justifyContent: "center", // centers vertically
    alignItems: "center",
  },

  switchIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },

  recentContainer: {
    marginTop: 0,
    borderTopWidth: 1,
    borderColor: "#ffffffff",
    padding: 20,
    height: 526,
  },

  recentTitle: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 10,
    color: "#bdbdbdff",
  },

  recentItem: {
    fontSize: 15,
    paddingVertical: 8,
  },

  recentIcon: {
    width: 25,
    height: 25,
    marginRight: 8,
    marginLeft: -12,
  },

  recentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#ffffffff",
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 10,
    color: "#363636ff",
    borderBottomWidth: 1,
    borderBottomColor: "#cececeff",
  },
  filler: {
    height: 526,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 35,
  }
});