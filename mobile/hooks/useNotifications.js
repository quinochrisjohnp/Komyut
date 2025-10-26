import { useCallback, useState } from "react";
import { Alert } from "react-native";

// ✅ Change this to your actual backend (the mobile backend, NOT the admin one)
const API_URL = "http://10.0.2.2:5001"; 
// or http://192.168.x.x:5001 if running locally

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to fetch notifications");

      // If your backend returns `{ success, data }`
      setNotifications(data.data || data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Error", error.message || "Something went wrong.");
    }
  }, []);

  // ✅ Wrapper for loading state
  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchNotifications();
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchNotifications]);

  return {
    notifications,
    isLoading,
    loadNotifications,
  };
};
