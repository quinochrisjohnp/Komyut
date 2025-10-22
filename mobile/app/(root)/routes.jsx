import React, { useState, useCallback } from "react";
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
  Alert,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import BottomNav from "../../components/BottomNav";
import { useSavedRoutes } from "../../hooks/useSavedRoutes";
import { useUser } from "@clerk/clerk-expo";
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";
import Colors from "../Constant_Design";

export default function SavedRoutesScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { savedRoutes = [], isLoading, deleteSavedRoute, loadData } = useSavedRoutes(user?.id);
  const [search, setSearch] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadData();
      }
    }, [loadData, user?.id])
  );

  const filteredRoutes = savedRoutes.filter((r) =>
    r.type?.toLowerCase().includes(search.toLowerCase())
  );

  const confirmUpdate = (item) => {
    Alert.alert("Update Route", "Do you want to update?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Update",
        style: "default",
        onPress: () =>
          router.push({
            pathname: "/(root)/edit_routes",
            params: {
              id: item.id,
              type: item.type,
              start_location: item.start_location,
              destination: item.destination,
              description: item.description,
            },
          }),
      },
    ]);
  };

  const confirmDelete = (item) => {
    Alert.alert("Delete Route", "Are you sure you want to delete?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteSavedRoute(item.id),
      },
    ]);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Saved Routes</Text>
          </View>

          <TextInput
            style={styles.search}
            placeholder="Search"
            value={search}
            onChangeText={setSearch}
          />

          {isLoading ? (
            <ActivityIndicator size="large" style={{ marginTop: 50 }} />
          ) : savedRoutes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Image
                source={require("../../assets/images/route-icon.png")}
                style={styles.illustration}
                resizeMode="contain"
              />
              <Text style={styles.subtitle}>Hey, {user?.username || "Traveler"}!</Text>
              <Text style={styles.message}>
                You have no saved routes{"\n"}Ready to plan your trip?
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push("/(root)/add_routes")}
              >
                <Text style={styles.addButtonText}>Add Route</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              contentContainerStyle={{ paddingBottom: 120 }}
              data={filteredRoutes}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Swipeable
                  renderRightActions={() => (
                    <View style={styles.swipeActions}>
                      {/* Update Icon (no background) */}
                      <TouchableOpacity onPress={() => confirmUpdate(item)}>
                        <Image
                          source={require("../../assets/images/edit-icon.png")}
                          style={styles.plainIcon}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>

                      {/* Delete Icon (no background) */}
                      <TouchableOpacity onPress={() => confirmDelete(item)}>
                        <Image
                          source={require("../../assets/images/delete-icon.png")}
                          style={styles.plainIcon}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                >
                  {/* Card content */}
                  <View style={styles.routeCard}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.routeName}>{item.type}</Text>
                        <Text style={styles.routeDescription}>
                          {item.start_location}
                        </Text>
                        <Text style={styles.routeDescription}>
                          {item.destination}
                        </Text>
                      </View>
                      <Image
                        source={require("../../assets/images/slide-icon.png")}
                        style={styles.slideHint}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                </Swipeable>
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
          )}
        </View>

        {/* Bottom Navigation */}
        <View style={styles.navOverlay}>
          <BottomNav />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
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
    marginBottom: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 80,
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  illustration: {
    width: 200,
    height: 200,
    marginBottom: 20,
    marginTop: -150,
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
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  search: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  routeCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 15,
    marginBottom: 10,
    borderWidth: 2,
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
  swipeActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: 10,
    paddingRight: 10,
    gap: 5, // spacing between icons
  },
  plainIcon: {
    width: 50,
    height: 50,
  },
  slideHint: {
    width: 16,
    height: 16,
    tintColor: "#bbb",
    marginTop: 5,
  },
  addButtonText: {
    color: "white",
  },
});
