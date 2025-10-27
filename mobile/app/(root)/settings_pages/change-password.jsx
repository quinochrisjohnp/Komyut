import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useUser, useAuth } from "@clerk/clerk-expo";
import Colors from "../../Constant_Design";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useAuth();

  const [step, setStep] = useState(1);
  const [currentPassword, setCurrentPassword] = useState(""); // ✅ added
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(0);

  const isValidPassword = (text) =>
    text.length >= 8 && text.length <= 15 && !/\s/.test(text);

  useEffect(() => {
    let countdown;
    if (timer > 0) countdown = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(countdown);
  }, [timer]);

  const handleSendVerification = async () => {
    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }
    if (!isValidPassword(newPassword) || !isValidPassword(confirmPassword)) {
      setError("Password must be 8–15 characters, no spaces.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const primaryEmail = user?.primaryEmailAddress;

      if (!primaryEmail) {
        setError("No primary email address found for this user.");
        return;
      }

      await primaryEmail.prepareVerification({ strategy: "email_code" });

      setStep(2);
      setTimer(30);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to send verification code. Try again.");
    }
  };

  const handleConfirmChange = async () => {
    if (code.length < 6) {
      setError("Enter a valid 6-digit code.");
      return;
    }

    try {
      await user.reload();
      const primaryEmail = user.primaryEmailAddress;

      if (primaryEmail.verification?.status === "verified") {
        console.log("Email already verified — skipping verification step");
      } else {
        await primaryEmail.attemptVerification({ code: code.trim() });
      }

      // ✅ include currentPassword here
      await user.updatePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
      });

      Alert.alert("Success", "Your password has been changed. Please log in again.");
      await signOut();
      router.replace("/(root)/index");
    } catch (err) {
      console.error("Verification failed:", err);
      setError("Invalid or expired code. Please check your email again.");
    }
  };

  const handleResend = async () => {
    if (timer === 0) {
      try {
        const primaryEmail = user?.primaryEmailAddress;
        await primaryEmail.prepareVerification({ strategy: "email_code" });
        setTimer(30);
      } catch (err) {
        console.error(err);
        setError("Could not resend verification code.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Image
          source={require("../../../assets/images/back_icon.png")}
          style={styles.backIcon}
        />
      </TouchableOpacity>

      <View style={styles.container}>

        {step === 1 ? (
          <View style={styles.middleSection}>
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>
              Logged in as{" "}
              <Text style={{ fontWeight: "600", color: Colors.primary }}>
                {user?.primaryEmailAddress?.emailAddress || "—"}
              </Text>
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {/* ✅ Current Password Field */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 80 }]}
                placeholder="Enter current password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                maxLength={15}
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 80 }]}
                placeholder="Enter new password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
                maxLength={15}
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 80 }]}
                placeholder="Confirm new password"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                maxLength={15}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor:
                    currentPassword && newPassword && confirmPassword
                      ? Colors.primary
                      : "#ccc",
                },
              ]}
              onPress={handleSendVerification}
            >
              <Text style={styles.actionText}>Send Verification Code</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.middleSection}>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{" "}
              <Text style={{ fontWeight: "600", color: Colors.primary }}>
                {user?.primaryEmailAddress?.emailAddress}
              </Text>
              .
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 40 }]}
                placeholder="Enter verification code"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={6}
                value={code}
                onChangeText={setCode}
              />
            </View>

            <Text style={styles.verifyText}>
              Didn’t get the code? Click below to resend.
            </Text>
            <TouchableOpacity disabled={timer > 0} onPress={handleResend}>
              <Text
                style={{
                  fontSize: 14,
                  color: timer > 0 ? "#aaa" : Colors.primary,
                  marginTop: 10,
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                {timer > 0 ? `Resend code in ${timer}s` : "Resend Code"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: code.length === 6 ? Colors.primary : "#ccc",
                },
              ]}
              onPress={handleConfirmChange}
            >
              <Text style={styles.actionText}>Confirm Password Change</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  backBtn: { position: "absolute", top: 60, left: 25, zIndex: 1 },
  backIcon: { width: 20, height: 20 },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 120,
  },
  logoSection: { marginBottom: 40 },
  logo: { width: 120, height: 120 },
  middleSection: { width: "100%", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 100, marginTop: 50, color: "#000000ff" },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  inputWrapper: { width: "100%", position: "relative", marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 15,
    color: "#333",
  },
  actionBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 30,
  },
  actionText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "red", marginBottom: 10, textAlign: "center" },
  verifyText: { fontSize: 14, color: "#666", textAlign: "center", marginTop: 10 },
});
