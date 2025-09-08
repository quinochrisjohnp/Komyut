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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSavedRoutes } from "../../hooks/useSavedRoutes";
import { useUser } from "@clerk/clerk-expo";
import BottomNav from "../../components/BottomNav";

export default function EditRouteScreen() {
  const {
    id,
    type: initialType,
    start_location: initialStart,
    destination: initialDest,
    description: initialDesc,
  } = useLocalSearchParams();

  const router = useRouter();
  const { user } = useUser(); // replace later with Clerk user id
  const { updateSavedRoute, loadData } = useSavedRoutes(user?.id);


  const [type, setType] = useState(initialType || "");
  const [start, setStart] = useState(initialStart || "");
  const [dest, setDest] = useState(initialDest || "");
  const [desc, setDesc] = useState(initialDesc || "");

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
      router.back();
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
          onPress={() => router.back()}
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

      {/* Blue Card for start/destination */}
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Start Location"
          value={start}
          onChangeText={setStart}
        />
        <TextInput
          style={styles.input}
          placeholder="Destination"
          value={dest}
          onChangeText={setDest}
        />
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
