import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Colors from "../../Constant_Design";

export default function DeleteAccount() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Image
          source={require("../../../assets/images/back_icon.png")}
          style={styles.backIcon}
        />
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>Account & Security</Text>

      {/* Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Deletion</Text>

        <Text style={styles.text}>
          Are you sure you want to delete your account?
        </Text>
        <Text style={[styles.text, { marginTop: 8, color: "red" }]}>
          This action is permanent and cannot be undone. All your data, settings,
          and saved routes will be permanently removed.
        </Text>

        {/* Checkbox */}
        <Pressable
          style={styles.checkboxContainer}
          onPress={() => setChecked(!checked)}
        >
          <View style={[styles.checkbox, checked && styles.checkedBox]} />
          <Text style={styles.checkboxText}>
            I understand that this action cannot be undone.
          </Text>
        </Pressable>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={[
            styles.deleteButton,
            checked ? styles.activeDelete : styles.disabledDelete,
          ]}
          disabled={!checked}
          onPress={() => {
            console.log("Delete account confirmed!");
            // placeholder function
          }}
        >
          <Text style={styles.deleteText}>Delete My Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff", 
    padding: 20 
  },
  backBtn: { 
    position: "absolute", 
    top: 50, 
    left: 0, 
    padding: 10, 
    zIndex: 1 
  },
  backIcon: { 
    width: 20, 
    height: 20 
  },
  title: { 
    textAlign: "center", 
    fontSize: 20, 
    fontWeight: "700", 
    marginTop: 50 
  },
  section: { 
    marginTop: 30, 
    paddingTop: 10 
  },
  sectionTitle: { 
    borderBottomWidth: 1, 
    borderColor: "#ccc", 
    fontWeight: "600", 
    fontSize: 16, 
    marginBottom: 20,
    paddingBottom: 10,
  },
  text: { 
    fontSize: 14, 
    color: "#333", 
    lineHeight: 20 
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 80,
    marginBottom: 30,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#333",
    marginRight: 10,
    borderRadius: 4,
  },
  checkedBox: {
    backgroundColor: "red",
    borderColor: "red",
  },
  checkboxText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    flexWrap: "wrap",
  },
  cancelButton: { 
    backgroundColor: Colors.lighter, 
    borderWidth: 1, 
    borderColor: Colors.primary, 
    padding: 12, 
    borderRadius: 20, 
    marginBottom: 15 
  },
  cancelText: { 
    color: "black", 
    fontWeight: "600", 
    textAlign: "center", 
    fontSize: 16 
  },
  deleteButton: {
    padding: 15,
    borderRadius: 20,
    alignItems: "center",
  },
  disabledDelete: {
    backgroundColor: "#ccc",
  },
  activeDelete: {
    backgroundColor: "#ff4d4d",
  },
  deleteText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
