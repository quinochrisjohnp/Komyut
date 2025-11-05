import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from "react-native";
import { useSignIn, useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import authStyles from "./auth-styles";
import Colors from "../Constant_Design";
import PrivacyPolicyModal from "../../components/PrivacyPolicyModal";
import TermsOfServiceModal from "../../components/TermsOfServiceModal";

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [error, setError] = useState("");
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // eye + clear
  const [showPassword, setShowPassword] = useState(false);

  // resend timer
  const [timer, setTimer] = useState(0);

  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  // ---------- Validation helpers ----------
  const isValidEmail = (text) => /\S+@\S+\.\S+/.test(text) && !/\s/.test(text);
  const isValidPassword = (text) => text.length >= 8 && text.length <= 15 && !/\s/.test(text);

  // ---------- Resend timer effect ----------
  useEffect(() => {
    let countdown;
    if (timer > 0) {
      countdown = setTimeout(() => setTimer(timer - 1), 1000);
    }
    return () => clearTimeout(countdown);
  }, [timer]);

  // ---------- Actions ----------
  const sendResetCode = async () => {
    if (!isLoaded) return;
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setSuccessfulCreation(true);
      setTimer(30); // start 60s timer
      setError("");
    } catch (err) {
      setError(err.errors[0]?.longMessage || "Failed to send code.");
    }
  };

  const resetPassword = async () => {
    if (!isLoaded) return;

    if (!isValidPassword(newPassword)) {
      setError("Password must be 8–15 characters, no spaces.");
      return;
    }

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(root)");
      } else {
        setError("Unexpected status. Please try again.");
      }
    } catch (err) {
      const clerkError = err.errors?.[0];
      console.log("RESET ERROR:", JSON.stringify(err, null, 2));

      switch (clerkError?.code) {
        case "form_password_pwned":
          setError(
            "This password has appeared in a data breach. Please use a stronger one — include uppercase letters, numbers, or symbols."
          );
          break;

        case "form_code_incorrect":
          setError("The verification code you entered is incorrect.");
          break;

        case "form_code_expired":
          setError("Your verification code has expired. Please request a new one.");
          break;

        case "form_identifier_not_found":
          setError("No account found with that email address.");
          break;

        case "form_password_length_too_short":
          setError("Password too short. It must be at least 8 characters.");
          break;

        case "form_password_length_too_long":
          setError("Password too long. It must not exceed 15 characters.");
          break;

        default:
          setError(clerkError?.longMessage || "Failed to reset password. Please try again.");
          break;
      }
    }
  };


  return (
    <SafeAreaView style={authStyles.safeArea}>
      {/* back button */}
      <TouchableOpacity onPress={() => router.back()} style={authStyles.backBtn}>
        <Image
          source={require("../../assets/images/back_icon.png")}
          style={authStyles.backIcon}
        />
      </TouchableOpacity>

      <View style={authStyles.container}>
        {/* Logo */}
        <View style={authStyles.logoSection}>
          <Image
            source={require("../../assets/images/app_logo.png")}
            style={authStyles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Middle */}
        <View style={styles.middleSection}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.forgotText}>
            Forgot your password? No worries!
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {!successfulCreation ? (
            <>
              {/* Email input */}
              <View style={authStyles.inputWrapper}>
                <TextInput
                  style={[authStyles.input, { paddingRight: 40 }]}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor="#999"
                  maxLength={50}  
                />
                {email.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setEmail("")}
                    style={authStyles.singleClearBtn}
                  >
                    <Text style={authStyles.clearIcon}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={sendResetCode}
                disabled={!isValidEmail(email)}
              >
                <Text style={styles.loginText}>Send Code</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>

              {/* Verification instructions + resend */}
              <Text style={styles.verifyText}>
                Didn’t get the code? Click below to resend it.
              </Text>
              <TouchableOpacity disabled={timer > 0} onPress={sendResetCode}>
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

              <View style={authStyles.inputWrapper}>
                <TextInput
                  style={[authStyles.input, { paddingRight: 40 }]}
                  placeholder="Enter verification code"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  placeholderTextColor="#999"
                  maxLength={6}  
                />
                {code.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setCode("")}
                    style={authStyles.singleClearBtn}
                  >
                    <Text style={authStyles.clearIcon}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              

              {/* New password input with eye + clear */}
              <View style={authStyles.inputWrapper}>
                <TextInput
                  style={[authStyles.input, { paddingRight: 80 }]}
                  placeholder="Enter new password"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  maxLength={15} 
                  placeholderTextColor="#999"
                />
                <View style={authStyles.iconRow}>
                  {newPassword.length > 0 && (
                    <TouchableOpacity onPress={() => setNewPassword("")}>
                      <Text style={authStyles.clearIcon}>✕</Text>
                    </TouchableOpacity>
                  )}
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Image
                    source={
                      showPassword
                        ? require('../../assets/images/eye_open.png') 
                        : require('../../assets/images/eye_close.png')  
                    }
                    style={authStyles.eyeIcon} // reuse your styling
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                </View>
              </View>

              {/* Reset button */}
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={resetPassword}
                disabled={!isValidPassword(newPassword) || code.length < 6}
              >
                <Text style={styles.loginText}>Reset Password</Text>
              </TouchableOpacity>

            </>
          )}
        </View>

        {/* Footer */}
        <View style={authStyles.footer}>
          <Text
            style={authStyles.footerText}
            onPress={() => setShowPrivacy(true)}
          >
            Privacy Policy
          </Text>
          <Text
            style={authStyles.footerText}
            onPress={() => setShowTerms(true)}
          >
            Terms of Service
          </Text>
          <PrivacyPolicyModal
            visible={showPrivacy}
            onClose={() => setShowPrivacy(false)}
          />
          <TermsOfServiceModal
            visible={showTerms}
            onClose={() => setShowTerms(false)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  middleSection: {
    marginTop: -100,
    alignItems: "center",
  },
  error: {
    color: "red",
    marginTop: 10,
    textAlign: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
    marginTop: 20,
    color: "#333",
  },
  loginBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    marginBottom: 25,
    marginTop: 30,
    alignItems: "center",
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotText: {
    fontSize: 14,
    marginBottom: 20,
    color: "#666",
    alignItems: "center",
  },
  verifyText: {
  fontSize: 14,
  color: '#666',
  textAlign: 'center',
  marginBottom: 5,
  marginTop: -10,
  },

});