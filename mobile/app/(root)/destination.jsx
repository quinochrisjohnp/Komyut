import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import debounce from "lodash.debounce";

const GOOGLE_MAPS_API_KEY = 'AIzaSyCd2dKiKFBQ3C9M0WszyPHHLbBrWafGSvI';
const MAP_ID = 'c189603921f4de17a7419bb7';

export default function Destination() {
  // 🚦 Inputs + predictions
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [startPredictions, setStartPredictions] = useState([]);
  const [endPredictions, setEndPredictions] = useState([]);

  // 🧭 Keep place_id so we can route precisely
  const [startPlace, setStartPlace] = useState(null); // { description, place_id }
  const [endPlace, setEndPlace] = useState(null);

  // 🚗 Route choices (dynamic cards)
  const [quickRoute, setQuickRoute] = useState(null);       // { duration, distance, fare, polyline }
  const [affordableRoute, setAffordableRoute] = useState(null);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  const webViewRef = useRef(null);

  // ============= AUTOCOMPLETE =============
  const fetchPredictions = useRef(
    debounce(async (text, type) => {
      if (text.length < 3) {
        if (type === "start") setStartPredictions([]);
        else setEndPredictions([]);
        return;
      }
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          text
        )}&key=${GOOGLE_MAPS_API_KEY}&components=country:PH`;
        const res = await fetch(url);
        const data = await res.json();
        if (type === "start") setStartPredictions(data.predictions || []);
        else setEndPredictions(data.predictions || []);
      } catch (err) {
        console.error("Autocomplete error:", err);
      }
    }, 300)
  ).current;

  // When user taps a suggestion, store description + place_id
  const selectStart = (place) => {
    setStart(place.description);
    setStartPlace({ description: place.description, place_id: place.place_id });
    setStartPredictions([]);
    // If end is already chosen, compute routes
    if (endPlace) computeRoutes(place.place_id, endPlace.place_id);
  };

  const selectEnd = (place) => {
    setEnd(place.description);
    setEndPlace({ description: place.description, place_id: place.place_id });
    setEndPredictions([]);
    // If start is already chosen, compute routes
    if (startPlace) computeRoutes(startPlace.place_id, place.place_id);
  };

  // ============= ROUTING (Directions API) =============
  /**
   * We call Directions API with place_id-based origin/destination
   * and ask for alternatives. Then:
   *  - Quick  = shortest duration (ETA)
   *  - Affordable = lowest fare (proxy: shortest distance → simple fare model)
   */
  const computeRoutes = async (startPid, endPid) => {
    setLoadingRoutes(true);
    setQuickRoute(null);
    setAffordableRoute(null);

    try {
      // Using place_id improves accuracy vs plain text
      const origin = `place_id:${startPid}`;
      const destination = `place_id:${endPid}`;

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
        origin
      )}&destination=${encodeURIComponent(
        destination
      )}&alternatives=true&region=ph&key=${GOOGLE_MAPS_API_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.routes || data.routes.length === 0) {
        setLoadingRoutes(false);
        return;
      }

      // Choose FASTEST by duration.value
      const fastest = [...data.routes].sort(
        (a, b) => a.legs[0].duration.value - b.legs[0].duration.value
      )[0];

      // Choose CHEAPEST by distance.value (proxy for fare)
      const shortest = [...data.routes].sort(
        (a, b) => a.legs[0].distance.value - b.legs[0].distance.value
      )[0];

      // Simple fare model (customize anytime):
      // Base ₱12 + ₱2 per km (jeepney-like estimate)
      const fareFromMeters = (m) => {
        const km = m / 1000;
        return Math.round(12 + 2 * km);
      };

      setQuickRoute({
        duration: fastest.legs[0].duration.text,
        distance: fastest.legs[0].distance.text,
        fare: fareFromMeters(fastest.legs[0].distance.value),
        polyline: fastest.overview_polyline.points,
      });

      setAffordableRoute({
        duration: shortest.legs[0].duration.text,
        distance: shortest.legs[0].distance.text,
        fare: fareFromMeters(shortest.legs[0].distance.value),
        polyline: shortest.overview_polyline.points,
      });
    } catch (err) {
      console.error("Directions error:", err);
    } finally {
      setLoadingRoutes(false);
    }
  };

  // Tap a card → draw that route on the map
  const showRoute = (polylinePoints) => {
    if (!polylinePoints || !webViewRef.current) return;
    webViewRef.current.injectJavaScript(`
      if (window.drawRoute) {
        window.drawRoute("${polylinePoints}");
      }
      true; // required to silence WebView warnings
    `);
  };

  // ============= MAP (WebView HTML) =============
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no"/>
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
        </style>
        <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&map_ids=${MAP_ID}&libraries=geometry"></script>
      </head>
      <body>
        <div id="map"></div>
        <script>
          let map, polyline;

          function initMap() {
            map = new google.maps.Map(document.getElementById("map"), {
              center: { lat: 14.5995, lng: 120.9842 },
              zoom: 14,
              mapId: "${MAP_ID}"
            });
          }

          // Draw a polyline from encoded points
          window.drawRoute = function(polylinePoints) {
            try {
              if (polyline) polyline.setMap(null);
              const path = google.maps.geometry.encoding.decodePath(polylinePoints);
              polyline = new google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: "#4A90E2",
                strokeOpacity: 1.0,
                strokeWeight: 5,
              });
              polyline.setMap(map);

              // Fit map bounds to the route
              const bounds = new google.maps.LatLngBounds();
              path.forEach(p => bounds.extend(p));
              map.fitBounds(bounds);
            } catch (e) {
              console.error("drawRoute error", e);
            }
          };

          initMap();
        </script>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Map */}
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        style={{ flex: 1 }}
      />

      {/* Top search inputs */}
      <View style={styles.topInputContainer}>
        {/* Start */}
        <View style={styles.inputBox}>
          <Ionicons name="location-outline" size={20} color="#fff" />
          <TextInput
            style={styles.inputText}
            placeholder="Start Location"
            placeholderTextColor="#e0e0e0"
            value={start}
            onChangeText={(text) => {
              setStart(text);
              setStartPlace(null);     // reset
              setQuickRoute(null);     // clear old routes on change
              setAffordableRoute(null);
              fetchPredictions(text, "start");
            }}
            onSubmitEditing={() => {
              // if user pressed enter without selecting suggestion, leave as text (Directions can still geocode text)
              if (endPlace || end) {
                // Prefer place_id; if none, fall back to text
                computeRoutes(startPlace?.place_id ?? start, endPlace?.place_id ?? end);
              }
            }}
          />
        </View>
        {startPredictions.length > 0 && (
          <FlatList
            style={styles.suggestionList}
            data={startPredictions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => selectStart(item)}>
                <Text style={styles.suggestion}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* End */}
        <View style={styles.inputBox}>
          <Ionicons name="flag-outline" size={20} color="#fff" />
          <TextInput
            style={styles.inputText}
            placeholder="Destination"
            placeholderTextColor="#e0e0e0"
            value={end}
            onChangeText={(text) => {
              setEnd(text);
              setEndPlace(null);       // reset
              setQuickRoute(null);
              setAffordableRoute(null);
              fetchPredictions(text, "end");
            }}
            onSubmitEditing={() => {
              if (startPlace || start) {
                computeRoutes(startPlace?.place_id ?? start, endPlace?.place_id ?? end);
              }
            }}
          />
          <TouchableOpacity
            onPress={() => {
              // swap start/end quickly
              const sText = start, sPlace = startPlace;
              setStart(end);
              setStartPlace(endPlace);
              setEnd(sText);
              setEndPlace(sPlace);
              setQuickRoute(null);
              setAffordableRoute(null);
              // if both exist after swap, recompute
              const a = endPlace?.place_id ?? end;
              const b = sPlace?.place_id ?? sText;
              if (a && b) computeRoutes(a, b);
            }}
          >
            <MaterialIcons name="swap-vert" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
        {endPredictions.length > 0 && (
          <FlatList
            style={styles.suggestionList}
            data={endPredictions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => selectEnd(item)}>
                <Text style={styles.suggestion}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Route options */}
      <View style={styles.routeContainer}>
        {loadingRoutes && (
          <View style={[styles.routeCard, { alignItems: "center" }]}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8 }}>Finding routes…</Text>
          </View>
        )}

        {quickRoute && (
          <TouchableOpacity
            style={styles.routeCard}
            onPress={() => showRoute(quickRoute.polyline)}
          >
            <Text style={styles.routeTitle}>⚡ Quick</Text>
            <Text style={styles.routeDetail}>Estimated Price ₱{quickRoute.fare}</Text>
            <Text style={styles.routeDetail}>
              ETA {quickRoute.duration} • {quickRoute.distance}
            </Text>
          </TouchableOpacity>
        )}

        {affordableRoute && (
          <TouchableOpacity
            style={styles.routeCard}
            onPress={() => showRoute(affordableRoute.polyline)}
          >
            <Text style={styles.routeTitle}>💰 Affordable</Text>
            <Text style={styles.routeDetail}>Estimated Price ₱{affordableRoute.fare}</Text>
            <Text style={styles.routeDetail}>
              ETA {affordableRoute.duration} • {affordableRoute.distance}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity>
          <Ionicons name="map-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="settings-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topInputContainer: {
    position: "absolute",
    top: 20,
    left: 10,
    right: 10,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  inputText: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
  },
  suggestionList: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    maxHeight: 200,
  },
  suggestion: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  routeContainer: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
  },
  routeCard: {
    backgroundColor: "#E9F4FF",
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 4,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  routeDetail: {
    fontSize: 14,
    color: "#555",
  },
  bottomNav: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#4A90E2",
    padding: 15,
    borderRadius: 40,
  },
});
