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

  // ✅ Send code to the existing user email
  const handleSendVerification = async () => {
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

      await primaryEmail.prepareVerification({
        strategy: "email_code",
      });

      setStep(2);
      setTimer(30);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to send verification code. Try again.");
    }
  };

  // ✅ Verify the code and update password
const handleConfirmChange = async () => {
  if (code.length < 6) {
    setError("Enter a valid 6-digit code.");
    return;
  }

  try {
    await user.reload();
    const primaryEmail = user.primaryEmailAddress;

    // ✅ Skip if already verified
    if (primaryEmail.verification?.status === "verified") {
      console.log("Email already verified — skipping verification step");
    } else {
      await primaryEmail.attemptVerification({ code: code.trim() });
    }

    // ✅ Then update password
    await user.update({ password: newPassword });

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
        <View style={styles.logoSection}>
          <Image
            source={require("../../../assets/images/app_logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {step === 1 ? (
          // ---------- PAGE 1: NEW PASSWORD ----------
          <View style={styles.middleSection}>
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>
              Logged in as{" "}
              <Text style={{ fontWeight: "600", color: Colors.primary }}>
                {user?.primaryEmailAddress?.emailAddress || "—"}
              </Text>
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

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
              <View style={styles.iconRow}>
                {newPassword.length > 0 && (
                  <TouchableOpacity onPress={() => setNewPassword("")}>
                    <Text style={styles.clearIcon}>✕</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? "🙈" : "👁️"}
                  </Text>
                </TouchableOpacity>
              </View>
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
              <View style={styles.iconRow}>
                {confirmPassword.length > 0 && (
                  <TouchableOpacity onPress={() => setConfirmPassword("")}>
                    <Text style={styles.clearIcon}>✕</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Text style={styles.eyeIcon}>
                    {showConfirm ? "🙈" : "👁️"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor:
                    newPassword && confirmPassword ? Colors.primary : "#ccc",
                },
              ]}
              onPress={handleSendVerification}
            >
              <Text style={styles.actionText}>Send Verification Code</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // ---------- PAGE 2: VERIFY CODE ----------
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
              {code.length > 0 && (
                <TouchableOpacity
                  onPress={() => setCode("")}
                  style={styles.singleClearBtn}
                >
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
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
  backBtn: { position: "absolute", top: 40, left: 25, zIndex: 10 },
  backIcon: { width: 28, height: 28 },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 120,
  },
  logoSection: { marginBottom: 40 },
  logo: { width: 120, height: 120 },
  middleSection: { width: "100%", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 10, color: "#333" },
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
  iconRow: {
    position: "absolute",
    right: 15,
    top: "35%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clearIcon: { fontSize: 14, color: "#999", marginRight: 10 },
  eyeIcon: { fontSize: 16 },
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
