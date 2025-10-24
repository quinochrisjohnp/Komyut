import { useCallback, useState } from "react";
import { Alert } from "react-native";

const API_URL = "http://localhost:5002"; // 🔁 Change if using Render or another host

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/notifications`);
      if (!response.ok) throw new Error("Failed to fetch notifications");

      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert.alert("Error", "Unable to load notifications.");
    }
  }, []);

  // ✅ Create a new notification
  const addNotification = useCallback(async (newNotification) => {
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNotification),
      });

      if (!response.ok) throw new Error("Failed to create notification");

      const data = await response.json();
      setNotifications((prev) => [data.data, ...prev]); // Add new one on top
      Alert.alert("Success", "Notification added successfully!");
    } catch (error) {
      console.error("Error adding notification:", error);
      Alert.alert("Error", error.message);
    }
  }, []);

  // ✅ Load data (like useEffect)
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchNotifications();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchNotifications]);

  return {
    notifications,
    isLoading,
    loadData,
    addNotification,
  };
};
