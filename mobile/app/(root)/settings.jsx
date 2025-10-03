import { View, Text, Image, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";

import { useUser } from "@clerk/clerk-expo";
import { SignOutButton } from "@/components/SignOutButton";
import Colors from "../Constant_Design";
import PrivacyPolicyModal from "../../components/PrivacyPolicyModal";
import TermsOfServiceModal from "../../components/TermsOfServiceModal";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [profileUri, setProfileUri] = useState(user.imageUrl || null);
  
  const pickImage = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access media library is required!");
      return;
    }

    // Launch picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    // Check if user actually picked an image
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const localUri = result.assets[0].uri;
      const filename = localUri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;

      const formData = new FormData();
      formData.append("file", {
        uri: localUri,
        name: filename,
        type,
      });

      try {
        // Upload to Clerk
        await user.setProfileImage({ file: formData.get("file") });
        await user.reload();

        // Update local UI immediately
        setProfileUri(localUri);

        alert("Profile image updated!");
      } catch (err) {
        console.error(err);
        alert("Failed to upload profile image. Check your network.");
      }
    }
  };



  if (!isLoaded) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Image
          source={require("../../assets/images/back_icon.png")}
          style={styles.backIcon}
        />
      </TouchableOpacity>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileWrapper}>
          <Image
            source={
              profileUri
                ? { uri: profileUri }       
                : require("../../assets/images/profile_placeholder.png") // fallback
            }
            style={styles.profilePic}
          />
          <TouchableOpacity style={styles.editButton} onPress={pickImage}>
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>
          {user.username || user.firstName || user.lastName || "User Name"}
        </Text>
      </View>

      {/* Middle Section */}
      <View style={styles.middleSection}>
        {/* Account & Security */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/settings_pages/account-security")}
        >
          <View style={styles.menuRow}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#2563EB" />
            <Text style={styles.menuText}>Account & Security</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Help & Support */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/settings_pages/help-support")}
        >
          <View style={styles.menuRow}>
            <Ionicons name="help-circle-outline" size={22} color="#2563EB" />
            <Text style={styles.menuText}>Help & Support</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Logout Section */}
      <View style={styles.logoutWrapper}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutModal(true)}
        >
          <MaterialIcons name="logout" size={25} color={Colors.primary} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        transparent
        visible={showLogoutModal}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Are you sure?</Text>
            <Text style={styles.modalMessage}>Do you really want to log out?</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <SignOutButton />
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <Text style={styles.footerText} onPress={() => setShowPrivacy(true)}>
          Privacy Policy
        </Text>
        <Text style={styles.footerText} onPress={() => setShowTerms(true)}>
          Terms of Service
        </Text>
        <PrivacyPolicyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
        <TermsOfServiceModal visible={showTerms} onClose={() => setShowTerms(false)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 20,
    paddingTop: 75,
  },

  // Profile
  profileSection: {
    alignItems: "center",
    marginTop: 24,
  },
  profileWrapper: {
    position: "relative",
  },
  profilePic: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  editButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 20,
  },
  userName: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
  },

  // Middle section
  middleSection: {
    marginTop: 40,
    gap: 24,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuText: {
    fontSize: 16,
    color: "#374151",
  },

  // Logout
  logoutWrapper: {
    marginTop: "auto",
    marginBottom: 40,
    alignItems: "center",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 23,
    fontWeight: "bold",
    color: Colors.primary,
  },

  // Back button
  backBtn: {
    position: "absolute",
    top: 50,
    left: 0,
    padding: 10,
    zIndex: 1,
  },
  backIcon: {
    width: 20,
    height: 20,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#E5E7EB",
    marginRight: 8,
  },
  cancelText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 20,
    paddingHorizontal: 25,
  },
  footerText: {
    fontSize: 12,
    color: "#888",
    textDecorationLine: "underline",
  },
});
