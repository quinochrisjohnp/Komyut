import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import BottomNav from "../../components/BottomNav";
import { useSavedRoutes } from "../../hooks/useSavedRoutes"; // <-- import your hook

export default function SavedRoutesScreen() {
  const router = useRouter();

  // 🔑 Use hook
  const user_id = 1; // 👈 example (replace with real logged-in user id)
  const {
    savedRoutes,
    isLoading,
    deleteSavedRoute,
    loadData,
    updateSavedRoute, // <-- ✅ make sure your hook exposes this
  } = useSavedRoutes(user_id);

  const [search, setSearch] = useState("");

  // Run when screen loads
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter routes based on search
  const filteredRoutes = savedRoutes.filter((r) =>
    r.type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Saved Routes</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" style={{ marginTop: 50 }} />
      ) : savedRoutes.length === 0 ? (
        // ---------------- Empty State ----------------
        <>
          <View style={styles.middleSection}>
            <Image
              source={require("../../assets/images/app_logo.png")}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>

          <View style={styles.middleSection}>
            <Text style={styles.subtitle}>Hey, Chris!</Text>
            <Text style={styles.message}>
              You have no saved routes{"\n"}Ready to plan your trip?
            </Text>
          </View>

          <View style={styles.middleSection}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/(root)/add_routes")}
            >
              <Text style={styles.addButtonText}>Add Route</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        // ---------------- Saved Routes List ----------------
        <View style={styles.listContainer}>
          {/* Search Bar */}
          <TextInput
            placeholder="Search"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
          />

          {/* List of routes with Footer */}
          <FlatList
            data={filteredRoutes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.routeCard}>
                <Text style={styles.routeName}>{item.type}</Text>
                <Text style={styles.routeDescription}>
                  {item.start_location} - {item.destination}
                </Text>

                {/* Update Button */}
                <TouchableOpacity
                  style={[styles.updateButton, { marginTop: 10 }]}
                  onPress={() =>
                    router.push({
                      pathname: "/(root)/edit_routes", // 👈 matches your file name
                      params: {
                        id: item.id,
                        type: item.type,
                        start_location: item.start_location,
                        destination: item.destination,
                        description: item.description,
                      },
                    })
                  }
                >
                  <Text style={styles.updateButtonText}>Update</Text>
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                  style={[styles.deleteButton, { marginTop: 10 }]}
                  onPress={() => deleteSavedRoute(item.id)}
                >
                  <Text style={styles.addButtonText}>Delete</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <View
                style={{
                  alignItems: "center",
                  marginTop: 20,
                  marginBottom: 100,
                }}
              >
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => router.push("/(root)/add_routes")}
                >
                  <Text style={styles.addButtonText}>Add Route</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      )}

      {/* Bottom Navigation */}
      <View style={styles.navOverlay}>
        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9F9F9",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  middleSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  illustration: {
    width: 200,
    height: 200,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  addButton: {
    backgroundColor: "#4CAFE8",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  updateButton: {
    backgroundColor: "orange",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  deleteButton: {
    backgroundColor: "red",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  listContainer: {
    flex: 1,
  },
  search: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },
  routeCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  routeName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  routeDescription: {
    fontSize: 14,
    color: "#555",
  },
  navOverlay: {
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
});
