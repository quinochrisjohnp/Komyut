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
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import BottomNav from "../../components/BottomNav";
import { useUser } from "@clerk/clerk-expo";

const API_URL = "https://komyut-we5n.onrender.com";
const GOOGLE_MAPS_API_KEY = "AIzaSyCd2dKiKFBQ3C9M0WszyPHHLbBrWafGSvI"; // ⚠️ Replace with your key

export default function AddRoutes() {
  const [place, setPlace] = useState("");
  const [destination, setDestination] = useState("");
  const [routeName, setRouteName] = useState("");
  const [description, setDescription] = useState("");

  // 🧠 Separate states for each autocomplete field
  const [placePredictions, setPlacePredictions] = useState([]);
  const [destPredictions, setDestPredictions] = useState([]);
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const router = useRouter();
  const { user } = useUser();

  // 🔍 Google Places Autocomplete function
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

  // ✋ Select from dropdown
  const handleSelectPrediction = (description, setField, setPredictions, setShowDropdown) => {
    setField(description);
    setPredictions([]);
    setShowDropdown(false);
  };

  const handleSave = async () => {
    if (!place || !destination || !routeName) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/saved_routes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_location: place,
          destination,
          type: routeName,
          description: description || "No description",
          user_id: user.id,
        }),
      });

      const text = await response.text();
      console.log("Response:", text);

      if (!response.ok) throw new Error("Failed to save route.");

      Alert.alert("Success", "Route saved!");
      router.push("/(root)/routes");
    } catch (error) {
      console.error("Error saving route:", error);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/(root)/routes")}
        >
          <Image
            source={require("../../assets/images/back_icon.png")}
            resizeMode="contain"
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Route</Text>
      </View>

      {/* Route Inputs */}
      <View style={styles.card}>
        {/* Add a place */}
        <TextInput
          style={styles.input}
          placeholder="Add a place"
          value={place}
          onChangeText={(text) =>
            searchPlaces(text, setPlace, setPlacePredictions, setShowPlaceDropdown)
          }
        />
        {showPlaceDropdown && placePredictions.length > 0 && (
          <View style={styles.dropdown}>
            <FlatList
              data={placePredictions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableWithoutFeedback
                  onPress={() =>
                    handleSelectPrediction(
                      item.description,
                      setPlace,
                      setPlacePredictions,
                      setShowPlaceDropdown
                    )
                  }
                >
                  <View style={styles.dropdownItem}>
                    <Text>{item.description}</Text>
                  </View>
                </TouchableWithoutFeedback>
              )}
            />
          </View>
        )}

        {/* Add a destination */}
        <TextInput
          style={styles.input}
          placeholder="Add a destination"
          value={destination}
          onChangeText={(text) =>
            searchPlaces(text, setDestination, setDestPredictions, setShowDestDropdown)
          }
        />
        {showDestDropdown && destPredictions.length > 0 && (
          <View style={styles.dropdown}>
            <FlatList
              data={destPredictions}
              keyExtractor={(item) => item.place_id}
              renderItem={({ item }) => (
                <TouchableWithoutFeedback
                  onPress={() =>
                    handleSelectPrediction(
                      item.description,
                      setDestination,
                      setDestPredictions,
                      setShowDestDropdown
                    )
                  }
                >
                  <View style={styles.dropdownItem}>
                    <Text>{item.description}</Text>
                  </View>
                </TouchableWithoutFeedback>
              )}
            />
          </View>
        )}
      </View>

      {/* Route Info */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Name of Route"
          value={routeName}
          onChangeText={setRouteName}
        />
        <TextInput
          style={styles.textArea}
          placeholder="Add a description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.navOverlay}>
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

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
  dropdown: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    maxHeight: 150,
    marginBottom: 10,
    zIndex: 1,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
