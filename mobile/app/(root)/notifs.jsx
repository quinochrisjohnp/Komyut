// app/loading-demo.jsx
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";

export default function LoadingDemo() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // simulate loading for 3 seconds
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading Demo...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20 }}>✅ Content Loaded!</Text>
    </View>
  );
}
