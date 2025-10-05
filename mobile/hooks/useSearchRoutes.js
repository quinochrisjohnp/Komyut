import { useCallback, useState, useEffect } from "react";
import { Alert } from "react-native";

const API_URL = "http://192.168.1.10:5001";

export const useSearchRoutes = (user_id) => {
  const [routes, setRoutes] = useState([]);

  // 🟢 GET: Fetch all routes for this user
  const fetchRoutes = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/search_routes/${user_id}`);
      const data = await response.json();
      setRoutes(data);
    } catch (error) {
      console.error("Error fetching routes:", error);
      Alert.alert("Error", "Could not fetch routes.");
    }
  }, [user_id]);

  // 🟢 POST: Save a new route
  const saveRoute = useCallback(
    async (starting_loc, destination_loc, event_date, event_time) => {
      if (!user_id || !starting_loc || !destination_loc) {
        Alert.alert("Error", "All fields are required.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/search_routes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            starting_loc,
            destination_loc,
            event_time,
            event_date,
            user_id,
          }),
        });

        if (!response.ok) throw new Error("Failed to save route");
        const newRoute = await response.json();
        setRoutes((prev) => [newRoute, ...prev]);
        return newRoute;
      } catch (error) {
        console.error("Error saving route:", error);
        Alert.alert("Error", "Could not save route.");
      }
    },
    [user_id]
  );

  // Auto-fetch when hook is first used
  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  return {
    routes,
    fetchRoutes,
    saveRoute,
  };
};
