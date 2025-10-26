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
  Modal,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import BottomNav from "../../components/BottomNav";
import { useUser } from "@clerk/clerk-expo";
import Colors from "../Constant_Design";

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
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);

  const router = useRouter();
  const { user } = useUser();

  const handleSwap = () => {
    const temp = place;
    setPlace(destination);
    setDestination(temp);
  };


    // Checks if address is inside Sampaloc, Manila
  const isInsideSampalocManila = (address) => {
    return address.includes("Sampaloc") && address.includes("Manila");
  };


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
    // Check restriction first
    if (!isInsideSampalocManila(description)) {
      setShowRestrictionModal(true);
      setField("");               // clear text
      setPredictions([]);         // clear dropdown
      setShowDropdown(false);
      return;
    }

    // ✅ valid area
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
      <Text style={styles.sectionTitle}>Locations</Text>
      {/* Route Inputs */}
      <View style={styles.card}>
        <View style={styles.locationContainer}>
          <View style={{ flex: 1 }}>
            {/* ADD A PLACE */}
            <TextInput
              style={styles.location}
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
                        <Text style={{ fontWeight: "bold", fontSize: 14 }}>
                          {item.structured_formatting?.main_text}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#555", opacity: 0.6 }}>
                          {item.structured_formatting?.secondary_text}
                        </Text>
                      </View>
                    </TouchableWithoutFeedback>
                  )}
                />
              </View>
            )}

            {/* DESTINATION INPUT */}
            <TextInput
              style={styles.location}
              placeholder="Destination"
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
                        <Text style={{ fontWeight: "bold", fontSize: 14 }}>
                          {item.structured_formatting?.main_text}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#555", opacity: 0.6 }}>
                          {item.structured_formatting?.secondary_text}
                        </Text>
                      </View>
                    </TouchableWithoutFeedback>
                  )}
                />
              </View>
            )}
          </View>

          {/* 🔄 SWITCH BUTTON */}
          <TouchableOpacity onPress={handleSwap} style={styles.switchButton}>
            <Image
              source={require("../../assets/images/switch-black-icon.png")}
              style={styles.switchIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Route Informations</Text>
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

      <Modal
        animationType="fade"
        transparent={true}
        visible={showRestrictionModal}
        onRequestClose={() => setShowRestrictionModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: '#fff',
            padding: 25,
            borderRadius: 12,
            width: '85%',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>
              Unsupported Area
            </Text>
            <Text style={{ textAlign: 'center', fontSize: 15, marginBottom: 20, color: '#444' }}>
              Sorry, the current version of the app is only supported inside the District of Sampaloc, Manila.
            </Text>
            <Pressable
              style={{ backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8 }}
              onPress={() => setShowRestrictionModal(false)}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffffff",
    paddingTop: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {     
    position: "absolute",
    top: 10,
    left: 0,
    padding: 10,
    zIndex: 1,
  },
  backIcon: { width: 24, height: 24 },
  headerTitle: { fontSize: 20, fontWeight: "700", marginTop: 30 },
  card: {
    marginBottom: 20,
    marginHorizontal: 15,
  },

  location: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
    marginHorizontal: 15,
  },

  textArea: {
    height: 100,
    textAlignVertical: "top",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginHorizontal: 15,
  },


  form: { marginBottom: 20 },

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
  sectionTitle: { 
    fontWeight: "600", 
    fontSize: 16, 
    marginVertical: 15,
    marginHorizontal: 15,
    borderBottomWidth: 1, 
    borderColor: "#ccc", 
    paddingBottom: 10,
  },
 locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  switchButton: {
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  switchIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
});
