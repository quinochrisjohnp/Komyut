import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { useRouter } from "expo-router";
import BottomNav from "../../components/BottomNav";
import { useUser } from "@clerk/clerk-expo";

const API_URL = "https://komyut-we5n.onrender.com";
const GOOGLE_MAPS_API_KEY = "AIzaSyCd2dKiKFBQ3C9M0WszyPHHLbBrWafGSvI";

export default function AddRoutes() {
  const [place, setPlace] = useState("");
  const [destination, setDestination] = useState("");
  const [routeName, setRouteName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();
  const { user } = useUser();

  const startRef = useRef();
  const destinationRef = useRef();

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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Image
                source={require("../../assets/images/back_icon.png")}
                resizeMode="contain"
                style={styles.backIcon}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Route</Text>
          </View>

          {/* Google Autocomplete Inputs */}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Start Location</Text>
            <GooglePlacesAutocomplete
              ref={startRef}
              placeholder="Add a place"
              minLength={2}
              fetchDetails={true}
              onFail={(error) => console.warn("Places API error:", error)}
              onNotFound={() => console.warn("No results found")}
              onPress={(data, details = null) => {
                setPlace(details?.formatted_address || data.description);
                console.log("Start Location:", details?.geometry?.location);
              }}
              query={{
                key: GOOGLE_MAPS_API_KEY,
                language: "en",
              }}
              styles={autocompleteStyles}
            />

            <Text style={[styles.cardLabel, { marginTop: 15 }]}>
              Destination
            </Text>
            <GooglePlacesAutocomplete
              ref={destinationRef}
              placeholder="Add a destination"
              minLength={2}
              fetchDetails={true}
              onFail={(error) => console.warn("Places API error:", error)}
              onNotFound={() => console.warn("No results found")}
              onPress={(data, details = null) => {
                setDestination(details?.formatted_address || data.description);
                console.log("Destination:", details?.geometry?.location);
              }}
              query={{
                key: GOOGLE_MAPS_API_KEY,
                language: "en",
              }}
              styles={autocompleteStyles}
            />
          </View>

          {/* Form */}
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
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.navOverlay}>
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const autocompleteStyles = {
  textInputContainer: {
    backgroundColor: "transparent",
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 45,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  listView: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    zIndex: 100,
  },
  row: {
    backgroundColor: "#fff",
    padding: 13,
    height: 44,
  },
  separator: {
    height: 0.5,
    backgroundColor: "#c8c7cc",
  },
  description: {
    fontSize: 13,
    color: "#333",
  },
  poweredContainer: {
    display: "none",
  },
};

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
  cardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
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
});
