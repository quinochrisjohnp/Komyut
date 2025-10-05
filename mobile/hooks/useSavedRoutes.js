import { useCallback, useState } from "react";
import { Alert } from "react-native";

const API_URL = "https://komyut-we5n.onrender.com/"; // ✅ Added trailing slash

export const useSavedRoutes = (user_id) => {
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Fetch all saved routes safely
  const fetchSavedRoutes = useCallback(async () => {
    if (!user_id) return;

    try {
      const response = await fetch(`${API_URL}api/saved_routes/${user_id}`);
      const data = await response.json();

      // ✅ Prevent 'filter of undefined' by forcing array
      setSavedRoutes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching saved routes:", error);
      setSavedRoutes([]); // fallback to empty
    }
  }, [user_id]);

  // ✅ Load routes (only fetching)
  const loadData = useCallback(async () => {
    if (!user_id) return;

    setIsLoading(true);
    try {
      await fetchSavedRoutes();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSavedRoutes, user_id]);

  // ✅ Delete a saved route
  const deleteSavedRoute = async (id) => {
    try {
      const response = await fetch(`${API_URL}api/saved_routes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete route");

      await loadData(); // refresh after deletion
    } catch (error) {
      console.error("Error deleting route:", error);
      Alert.alert("Error", error.message);
    }
  };

  // ✅ Update a saved route
  const updateSavedRoute = async (id, updatedFields) => {
    try {
      const response = await fetch(`${API_URL}api/saved_routes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });

      if (!response.ok) throw new Error("Failed to update route");

      await loadData(); // refresh after update
    } catch (error) {
      console.error("Error updating route:", error);
      Alert.alert("Error", error.message);
    }
  };

  return {
    savedRoutes,
    isLoading,
    loadData,
    deleteSavedRoute,
    updateSavedRoute,
  };
};
