import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSavedRoutes } from "../../hooks/useSavedRoutes";

export default function EditRouteScreen() {
  // ✅ only declare once
  const { id, type: initialType, start_location: initialStart, destination: initialDest, description: initialDesc } = useLocalSearchParams();
  
  const router = useRouter();
  const user_id = 1; // replace with real auth
  const { updateSavedRoute } = useSavedRoutes(user_id);

  const [type, setType] = useState(initialType);
  const [start, setStart] = useState(initialStart);
  const [dest, setDest] = useState(initialDest);
  const [desc, setDesc] = useState(initialDesc);

  const handleSave = async () => {
    try {
      await updateSavedRoute(id, {
        type,
        start_location: start,
        destination: dest,
        description: desc,
      });
      Alert.alert("Success", "Route updated!");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to update route");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Route</Text>

      <TextInput style={styles.input} value={type} onChangeText={setType} placeholder="Type" />
      <TextInput style={styles.input} value={start} onChangeText={setStart} placeholder="Start Location" />
      <TextInput style={styles.input} value={dest} onChangeText={setDest} placeholder="Destination" />
      <TextInput style={styles.input} value={desc} onChangeText={setDesc} placeholder="Description" />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 12 },
  saveButton: { backgroundColor: "#4CAFE8", padding: 15, borderRadius: 8, alignItems: "center" },
  saveButtonText: { color: "#fff", fontWeight: "bold" },
});
