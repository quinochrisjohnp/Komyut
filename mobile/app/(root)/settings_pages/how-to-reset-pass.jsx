import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import PrivacyPolicyModal from "../../../components/PrivacyPolicyModal";
import TermsOfServiceModal from "../../../components/TermsOfServiceModal";
import Colors from "../../Constant_Design";

export default function FAQ() {
  const router = useRouter();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Image
          source={require("../../../assets/images/back_icon.png")}
          style={styles.backIcon}
        />
      </TouchableOpacity>

      {/* Page Title */}
      <Text style={styles.title}>Reset Your Password</Text>

      {/* Scrollable Instructions Section */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.boldText}>Follow these steps to reset your password:</Text>
        <View style={styles.line} />

        <View style={styles.steps}>
          <Text style={styles.step}>1. From the main menu, click on the settings icon.</Text>
          <Text style={styles.step}>2. Tap on “Account Security”.</Text>
          <Text style={styles.step}>3. Click on “Change Password”.</Text>
          <Text style={styles.step}>4. Enter your new password.</Text>
          <Text style={styles.step}>5. Confirm your new password.</Text>
          <Text style={styles.step}>6. Enter the code sent to your email.</Text>
          <Text style={styles.step}>7. Click on “Save Password”.</Text>
        </View>

        <View style={styles.line} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText} onPress={() => setShowPrivacy(true)}>Privacy Policy</Text>
        <Text style={styles.footerText} onPress={() => setShowTerms(true)}>Terms of Service</Text>
      </View>

      {/* Modals */}
      <PrivacyPolicyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <TermsOfServiceModal visible={showTerms} onClose={() => setShowTerms(false)} />
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
  content: { 
    marginTop: 40, 
    paddingBottom: 20 
  },
  boldText: { 
    fontSize: 16, 
    fontWeight: "700", 
    marginBottom: 10 
  },
  line: { 
    borderBottomWidth: 1, 
    borderColor: "#ccc", 
    marginVertical: 10 
  },
  steps: { 
    marginVertical: 10 
  },
  step: { 
    fontSize: 15, 
    color: "#333", 
    marginBottom: 8, 
    lineHeight: 22 
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 20,
    paddingHorizontal: 25,
    marginBottom: 9,
    marginTop: "auto"
  },
  footerText: {
    fontSize: 12,
    color: "#888",
    textDecorationLine: "underline",
  },
});
