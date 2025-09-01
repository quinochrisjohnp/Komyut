import { useCallback, useState } from "react";
import { Alert } from "react-native";

const API_URL = "https://komyut-we5n.onrender.com/api";

export const useSavedRoutes = (user_id) => {
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [summary, setSummary] = useState({
    start_location: "",
    destination: "",
    estimated_cost: 0,
    duration_minutes: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all saved routes
  const fetchSavedRoutes = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/saved_routes/${user_id}`);
      const data = await response.json();
      setSavedRoutes(data);
    } catch (error) {
      console.error("Error fetching saved routes:", error);
    }
  }, [user_id]);

  // Fetch summary (assuming backend has this endpoint)
  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/summary/${user_id}`);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }, [user_id]);

  // Load both routes + summary
  const loadData = useCallback(async () => {
    if (!user_id) return;

    setIsLoading(true);
    try {
      await Promise.all([fetchSavedRoutes(), fetchSummary()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSavedRoutes, fetchSummary, user_id]);

  // Delete a saved route
  const deleteSavedRoute = async (id) => {
    try {
      const response = await fetch(`${API_URL}/saved_routes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete route");

      // Refresh data after deletion
      loadData();
    } catch (error) {
      console.error("Error deleting route:", error);
      Alert.alert("Error", error.message);
    }
  };

  // ✅ Update a saved route
  const updateSavedRoute = async (id, updatedFields) => {
  try {
    const response = await fetch(`${API_URL}/saved_routes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFields),
    });

    if (!response.ok) throw new Error("Failed to update route");

    // Refresh data after update
    loadData();
  } catch (error) {
    console.error("Error updating route:", error);
    Alert.alert("Error", error.message);
  }
};

  return {
    savedRoutes,
    summary,
    isLoading,
    loadData,
    deleteSavedRoute,
    updateSavedRoute, // 👈 expose update
  };
};
