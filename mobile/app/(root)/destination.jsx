import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { WebView } from "react-native-webview";
import debounce from "lodash.debounce";

const GOOGLE_MAPS_API_KEY = 'AIzaSyCd2dKiKFBQ3C9M0WszyPHHLbBrWafGSvI';
const MAP_ID = 'c189603921f4de17a7419bb7';

export default function Destination() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [startPredictions, setStartPredictions] = useState([]);
  const [endPredictions, setEndPredictions] = useState([]);
  const webViewRef = useRef(null);

  // 🔹 Debounced search for both start and end
  const debouncedSearch = useRef(
    debounce(async (text, type) => {
      console.log("Searching for:", text); // 🔍 log input
      if (text.length > 2) {
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${GOOGLE_MAPS_API_KEY}&components=country:PH`
          );
          const data = await res.json();
          console.log("API Response:", data); // 🧪 log result

          if (data.error_message) {
            console.error("Google API Error:", data.error_message);
          }

          if (type === "start") {
            setStartPredictions(data.predictions || []);
          } else {
            setEndPredictions(data.predictions || []);
          }
        } catch (err) {
          console.error("Fetch error:", err);
        }
      } else {
        if (type === "start") setStartPredictions([]);
        else setEndPredictions([]);
      }
    }, 300)
  ).current;

  // 🔹 Input Handlers
  const handleStartChange = (text) => {
    setStart(text);
    debouncedSearch(text, "start");
  };

  const handleEndChange = (text) => {
    setEnd(text);
    debouncedSearch(text, "end");
  };

  // 🔹 Select suggestion
  const selectStart = (place) => {
    setStart(place.description);
    setStartPredictions([]);
  };
  const selectEnd = (place) => {
    setEnd(place.description);
    setEndPredictions([]);
  };

  // 🔹 Get route
  const getRoute = async () => {
    if (!start || !end) return;

    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
          start
        )}&destination=${encodeURIComponent(
          end
        )}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await res.json();

      if (data.routes.length > 0) {
        const points = data.routes[0].overview_polyline.points;
        webViewRef.current.injectJavaScript(`
          if(window.drawRoute){
            window.drawRoute("${points}");
          }
        `);
      }
    } catch (err) {
      console.error("Directions error:", err);
    }
  };

  // 🔹 WebView HTML
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no"/>
      <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
      <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&map_ids=${MAP_ID}"></script>
    </head>
    <body>
      <div id="map"></div>
      <script>
        let map;
        let polyline;
        function initMap() {
          map = new google.maps.Map(document.getElementById("map"), {
            center: { lat: 14.5995, lng: 120.9842 },
            zoom: 13,
            mapId: "${MAP_ID}",
          });
        }

        function decodePolyline(encoded) {
          let points = [];
          let index = 0, len = encoded.length;
          let lat = 0, lng = 0;
          while (index < len) {
            let b, shift = 0, result = 0;
            do {
              b = encoded.charCodeAt(index++) - 63;
              result |= (b & 0x1f) << shift;
              shift += 5;
            } while (b >= 0x20);
            let dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
            lat += dlat;

            shift = 0;
            result = 0;
            do {
              b = encoded.charCodeAt(index++) - 63;
              result |= (b & 0x1f) << shift;
              shift += 5;
            } while (b >= 0x20);
            let dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
            lng += dlng;

            points.push({ lat: lat / 1e5, lng: lng / 1e5 });
          }
          return points;
        }

        window.drawRoute = function(polylinePoints) {
          if (polyline) polyline.setMap(null);
          const decodedPath = decodePolyline(polylinePoints);
          polyline = new google.maps.Polyline({
            path: decodedPath,
            geodesic: true,
            strokeColor: "#4285F4",
            strokeOpacity: 1.0,
            strokeWeight: 5,
          });
          polyline.setMap(map);
          map.fitBounds(new google.maps.LatLngBounds(
            decodedPath[0], decodedPath[decodedPath.length - 1]
          ));
        };

        initMap();
      </script>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Map */}
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        style={{ flex: 1 }}
      />

      {/* Inputs */}
      <View style={styles.inputContainer}>
        {/* Start */}
        <TextInput
          style={styles.input}
          placeholder="Start Location"
          value={start}
          onChangeText={handleStartChange}
        />
        {startPredictions.length > 0 && (
          <FlatList
            data={startPredictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => selectStart(item)}>
                <Text style={styles.suggestion}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* End */}
        <TextInput
          style={styles.input}
          placeholder="Destination"
          value={end}
          onChangeText={handleEndChange}
        />
        {endPredictions.length > 0 && (
          <FlatList
            data={endPredictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => selectEnd(item)}>
                <Text style={styles.suggestion}>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Button */}
        <TouchableOpacity style={styles.goButton} onPress={getRoute}>
          <Text style={styles.goButtonText}>Show Route</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    padding: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: "50%",
  },
  input: {
    backgroundColor: "#f1f1f1",
    marginVertical: 5,
    padding: 10,
    borderRadius: 8,
  },
  suggestion: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  goButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  goButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
