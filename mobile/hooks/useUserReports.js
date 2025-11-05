import { useCallback, useState } from "react";
import { Alert } from "react-native";

const API_URL = "https://komyut-we5n.onrender.com";

export const useUserReports = (user_id) => {
  const [userReports, setUserReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🔹 Fetch all reports by user_id
  const fetchUserReports = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/user_reports/${user_id}`);
      const data = await response.json();
      setUserReports(data);
    } catch (error) {
      console.error("❌ Error fetching user reports:", error);
    }
  }, [user_id]);

  // 🔹 Load reports (can call on screen load or refresh)
  const loadData = useCallback(async () => {
    if (!user_id) return;
    setIsLoading(true);
    try {
      await fetchUserReports();
    } catch (error) {
      console.error("❌ Error loading user reports:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserReports, user_id]);

  // 🔹 Submit a new report
  const addUserReport = async (reportData) => {
    try {
      // ✅ Debug log before sending
      console.log("📤 Sending report data:", reportData);

      const response = await fetch(`${API_URL}/api/user_reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });

      // ✅ Get raw text to see actual response from Render
      const rawResponse = await response.text();
      console.log("📩 Raw server response:", rawResponse);

      if (!response.ok) {
        throw new Error(`Failed to submit report: ${response.status} ${rawResponse}`);
      }

      // ✅ Parse JSON only if response is ok
      const data = JSON.parse(rawResponse);
      console.log("✅ Parsed server response:", data);

      await loadData(); // Refresh reports after submitting
    } catch (error) {
      console.error("❌ Error submitting report:", error);
      Alert.alert("Error", error.message);
    }
  };

  return {
    userReports,
    isLoading,
    loadData,
    addUserReport,
  };
};
