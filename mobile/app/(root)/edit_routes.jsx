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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSavedRoutes } from "../../hooks/useSavedRoutes";
import { useUser } from "@clerk/clerk-expo";
import BottomNav from "../../components/BottomNav";
import Colors from "../Constant_Design";

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

  // 🧠 State management
  const [type, setType] = useState(initialType || "");
  const [start, setStart] = useState(initialStart || "");
  const [dest, setDest] = useState(initialDest || "");
  const [desc, setDesc] = useState(initialDesc || "");

  // Autocomplete states
  const [placePredictions, setPlacePredictions] = useState([]);
  const [destPredictions, setDestPredictions] = useState([]);
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);

  const handleSwap = () => {
    const temp = start;
    setStart(dest);
    setDest(temp);
  };

  // ✅ Restriction checker
  const isInsideSampalocManila = (address) => {
    return address.includes("Sampaloc") && address.includes("Manila");
  };

  // 🔍 Autocomplete search
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

  // ✋ Handle select prediction (with restriction)
  const handleSelectPrediction = (description, setField, setPredictions, setShowDropdown) => {
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
  };

  // 💾 Save route changes
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
      else router.replace("/saved_routes");
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
        <Text style={styles.headerTitle}>Edit Route</Text>
      </View>

      <Text style={styles.sectionTitle}>Locations</Text>

      {/* Location Inputs */}
      <View style={styles.card}>
        <View style={styles.locationContainer}>
          <View style={{ flex: 1 }}>
            {/* START LOCATION INPUT */}
            <TextInput
              style={styles.location}
              placeholder="Start Location"
              value={start}
              onChangeText={(text) =>
                searchPlaces(text, setStart, setPlacePredictions, setShowPlaceDropdown)
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
                          setStart,
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
              value={dest}
              onChangeText={(text) =>
                searchPlaces(text, setDest, setDestPredictions, setShowDestDropdown)
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
                          setDest,
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

          {/* 🔄 SWITCH BUTTON (placeholder image) */}
          <TouchableOpacity onPress={handleSwap} style={styles.switchButton}>
            <Image
              source={require("../../assets/images/switch-black-icon.png")}
              style={styles.switchIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Route Information</Text>

      {/* Route Info */}
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

      {/* Bottom Navigation */}
      <View style={styles.navOverlay}>
        <BottomNav />
      </View>

      {/* Restriction Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showRestrictionModal}
        onRequestClose={() => setShowRestrictionModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              padding: 25,
              borderRadius: 12,
              width: "85%",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 10,
                color: "#333",
              }}
            >
              Unsupported Area
            </Text>
            <Text
              style={{
                textAlign: "center",
                fontSize: 15,
                marginBottom: 20,
                color: "#444",
              }}
            >
              Sorry, the current version of the app is only supported inside the
              District of Sampaloc, Manila.
            </Text>
            <Pressable
              style={{
                backgroundColor: Colors.primary,
                paddingVertical: 10,
                paddingHorizontal: 25,
                borderRadius: 8,
              }}
              onPress={() => setShowRestrictionModal(false)}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Continue</Text>
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
