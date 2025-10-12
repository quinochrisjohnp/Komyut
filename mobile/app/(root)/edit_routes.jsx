import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSavedRoutes } from "../../hooks/useSavedRoutes";
import { useUser } from "@clerk/clerk-expo";
import BottomNav from "../../components/BottomNav";

// 🔑 Make sure to set your Google Maps API Key here
const GOOGLE_MAPS_API_KEY = "AIzaSyCd2dKiKFBQ3C9M0WszyPHHLbBrWafGSvI";

export default function EditRouteScreen() {
  const {
    id,
    type: initialType,
    start_location: initialStart,
    destination: initialDest,
    description: initialDesc,
  } = useLocalSearchParams();

  const router = useRouter();
  const { user } = useUser();
  const { updateSavedRoute, loadData } = useSavedRoutes(user?.id);

  // 🧠 Separate states
  const [type, setType] = useState(initialType || "");
  const [start, setStart] = useState(initialStart || "");
  const [dest, setDest] = useState(initialDest || "");
  const [desc, setDesc] = useState(initialDesc || "");

  // Autocomplete states
  const [placePredictions, setPlacePredictions] = useState([]);
  const [destPredictions, setDestPredictions] = useState([]);
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  // 🔍 Google Places Autocomplete Function
  const searchPlaces = async (text, setField, setPredictions, setShowDropdown) => {
    setField(text);

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

  // 🧩 Save Handler
  const handleSave = async () => {
    if (!user) {
      Alert.alert("Error", "User not logged in.");
      return;
    }

    try {
      await updateSavedRoute(id, {
        type,
        start_location: start,
        destination: dest,
        description: desc,
      });

      await loadData();
      Alert.alert("Success", "Route updated!");
      if (router.canGoBack()) router.back();
      else router.replace("/saved_routes"); // ✅ fallback if no history
    } catch (error) {
      console.error("Update failed:", error);
      Alert.alert("Error", "Failed to update route");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/saved_routes");
          }}
        >
          <Image
            source={require("../../assets/images/back_icon.png")}
            resizeMode="contain"
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type ? `${type}` : "Edit Route"}
        </Text>
      </View>

      {/* Blue Card for Start/Destination */}
      <View style={styles.card}>
        {/* Start Input */}
        <TextInput
          style={styles.input}
          placeholder="Start Location"
          value={start}
          onChangeText={(text) =>
            searchPlaces(text, setStart, setPlacePredictions, setShowPlaceDropdown)
          }
        />
        {showPlaceDropdown && (
          <FlatList
            data={placePredictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setStart(item.description);
                  setShowPlaceDropdown(false);
                }}
              >
                <Text>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Destination Input */}
        <TextInput
          style={styles.input}
          placeholder="Destination"
          value={dest}
          onChangeText={(text) =>
            searchPlaces(text, setDest, setDestPredictions, setShowDestDropdown)
          }
        />
        {showDestDropdown && (
          <FlatList
            data={destPredictions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setDest(item.description);
                  setShowDestDropdown(false);
                }}
              >
                <Text>{item.description}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Name + Description */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Name of Route"
          value={type}
          onChangeText={setType}
        />
        <TextInput
          style={styles.textArea}
          placeholder="Add a description"
          value={desc}
          onChangeText={setDesc}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>

      {/* Bottom Nav */}
      <View style={styles.navOverlay}>
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: { padding: 5 },
  backIcon: { width: 24, height: 24, marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: "bold" },

  card: {
    backgroundColor: "#A6D8F5",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  dropdownItem: {
    backgroundColor: "#fff",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  form: { marginBottom: 20 },
  textArea: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    textAlignVertical: "top",
  },
  saveButton: {
    alignSelf: "center",
    backgroundColor: "#4CAFE8",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 20,
    marginBottom: 70,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  navOverlay: { position: "absolute", bottom: 0, width: "100%" },
});
