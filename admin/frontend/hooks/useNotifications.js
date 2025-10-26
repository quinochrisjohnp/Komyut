import { useState, useCallback, useEffect } from "react";
import { Alert } from "react-native"; // remove this line if using plain React (web)

const API_URL = "http://localhost:5002"; // ✅ your backend URL

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  // 🟢 GET: Fetch all notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/notifications`);
      if (!response.ok) throw new Error("Failed to fetch notifications");

      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      Alert?.alert?.("Error", "Could not fetch notifications.");
    }
  }, []);

  // 🟢 POST: Add new notification
  const addNotification = useCallback(
    async (title, category, sent_to, message) => {
      if (!title || !category || !message) {
        Alert?.alert?.("Error", "Title, category, and message are required.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/notifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            category,
            sent_to: sent_to || "All Users",
            message,
          }),
        });

        if (!response.ok) throw new Error("Failed to save notification");

        const result = await response.json();
        const newNotif = result.data;
        setNotifications((prev) => [newNotif, ...prev]);

        return newNotif;
      } catch (error) {
        console.error("Error adding notification:", error);
        Alert?.alert?.("Error", "Could not save notification.");
      }
    },
    []
  );

  // Auto-fetch when mounted
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    fetchNotifications,
    addNotification,
  };
};
