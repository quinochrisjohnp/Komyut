import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import BottomNav from "../../components/BottomNav";
import { useUser } from "@clerk/clerk-expo";

const API_URL = "https://komyut-we5n.onrender.com"; // ✅ Android emulator fix

export default function AddRoutes() {
  const [place, setPlace] = useState("");
  const [destination, setDestination] = useState("");
  const [routeName, setRouteName] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();
  const { user } = useUser(); // ✅ get logged-in Clerk user

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
      console.log("Response status:", response.status);
      const text = await response.text();
      console.log("Response body:", text);
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

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Add a place"
          value={place}
          onChangeText={setPlace}
        />
        <TextInput
          style={styles.input}
          placeholder="Add a destination"
          value={destination}
          onChangeText={setDestination}
        />
      </View>

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

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>

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
});
