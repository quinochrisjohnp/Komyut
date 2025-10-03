import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Colors from "../../Constant_Design";
import { useUser, useClerk } from "@clerk/clerk-expo";


export default function DeleteAccount() {
  const router = useRouter();
  const { user } = useUser();
  const [checked, setChecked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const { signOut } = useClerk(); 


  const handleDeleteAccount = async () => {
    try {
      if (user) {
        await user.delete();   // Clerk delete
        await signOut();       // clear session
        router.replace('/(auth)/choose-auth'); // same as SignOutButton
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete account. Check your network.");
    }
  };

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
          onPress={() => setShowConfirmModal(true)}
        >
          <Text style={styles.deleteText}>Delete My Account</Text>
        </TouchableOpacity>
      </View>

      {/* Second Confirmation Modal */}
      <Modal
        transparent
        visible={showConfirmModal}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            <Text style={modalStyles.modalTitle}>Confirm Deletion</Text>
            <Text style={modalStyles.modalMessage}>
              Are you absolutely sure you want to delete your account? This cannot be undone.
            </Text>
            <View style={modalStyles.modalButtons}>
              <TouchableOpacity
                style={[modalStyles.modalButton, modalStyles.cancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={modalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[modalStyles.modalButton, modalStyles.deleteButton]}
                onPress={() => {
                  setShowConfirmModal(false);
                  handleDeleteAccount();
                }}
              >
                <Text style={modalStyles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Account Deleted Modal */}
      <Modal
        transparent
        visible={showDeletedModal}
        animationType="fade"
        onRequestClose={() => setShowDeletedModal(false)}
      >
        <View style={modalStyles.modalOverlay}>
          <View style={modalStyles.modalContent}>
            <Text style={modalStyles.modalTitle}>Account Deleted</Text>
            <Text style={modalStyles.modalMessage}>
              Your account has been successfully deleted.
            </Text>
            <TouchableOpacity
              style={[modalStyles.modalButton, modalStyles.deleteButton]}
              onPress={() => {
                setShowDeletedModal(false);
                router.replace("/app/(auth)/choose-auth"); // redirect to home or login
              }}
            >
              <Text style={modalStyles.deleteText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  backBtn: { position: "absolute", top: 50, left: 0, padding: 10, zIndex: 1 },
  backIcon: { width: 20, height: 20 },
  title: { textAlign: "center", fontSize: 20, fontWeight: "700", marginTop: 50 },
  section: { marginTop: 30, paddingTop: 10 },
  sectionTitle: { borderBottomWidth: 1, borderColor: "#ccc", fontWeight: "600", fontSize: 16, marginBottom: 20, paddingBottom: 10 },
  text: { fontSize: 14, color: "#333", lineHeight: 20 },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginTop: 80, marginBottom: 30 },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: "#333", marginRight: 10, borderRadius: 4 },
  checkedBox: { backgroundColor: "red", borderColor: "red" },
  checkboxText: { fontSize: 14, color: "#333", flex: 1, flexWrap: "wrap" },
  cancelButton: { backgroundColor: Colors.lighter, borderWidth: 1, borderColor: Colors.primary, padding: 12, borderRadius: 20, marginBottom: 15 },
  cancelText: { color: "black", fontWeight: "600", textAlign: "center", fontSize: 16 },
  deleteButton: { padding: 15, borderRadius: 20, alignItems: "center" },
  disabledDelete: { backgroundColor: "#ccc" },
  activeDelete: { backgroundColor: "#ff4d4d" },
  deleteText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

const modalStyles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "80%", backgroundColor: "#fff", borderRadius: 12, padding: 20, alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  modalMessage: { fontSize: 16, color: "#555", marginBottom: 20, textAlign: "center" },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  modalButton: { flex: 1, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  cancelButton: { backgroundColor: Colors.lighter, borderWidth: 1, borderColor: Colors.primary, marginRight: 8 },
  deleteButton: { backgroundColor: "#ff4d4d" },
  deleteText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
