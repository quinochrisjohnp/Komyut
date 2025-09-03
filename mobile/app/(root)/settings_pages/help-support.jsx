import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import Colors from '../../Constant_Design';
import PrivacyPolicyModal from '../../../components/PrivacyPolicyModal';
import TermsOfServiceModal from '../../../components/TermsOfServiceModal';


export default function HelpSupport() {
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

      <Text style={styles.title}>Help & Support</Text>

      {/* FAQs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <TouchableOpacity style={styles.faqBtn}><Text style={styles.faqText}>How to reset my password?</Text></TouchableOpacity>
        <TouchableOpacity style={styles.faqBtn}><Text style={styles.faqText}>How do I plan a route?</Text></TouchableOpacity>
        <TouchableOpacity style={styles.faqBtn}><Text style={styles.faqText}>How to save a route?</Text></TouchableOpacity>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Need more help?</Text>
        <TouchableOpacity style={styles.contactBtn}>
          <Text style={styles.contactText} onPress={() => router.push("/settings_pages/contact-support")}>Contact Support</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText} onPress={() => setShowPrivacy(true)} >Privacy Policy</Text>
        <Text style={styles.footerText} onPress={() => setShowTerms(true)}>Terms of Service</Text>
        <PrivacyPolicyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
        <TermsOfServiceModal visible={showTerms} onClose={() => setShowTerms(false)} />
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
    fontWeight: "600", 
    fontSize: 16, 
    marginBottom: 10,
    borderBottomWidth: 1, 
    borderColor: "#ccc", 
    paddingBottom: 10,
},
  faqBtn: { 
    borderWidth: 1, 
    borderColor: Colors.primary, 
    backgroundColor: Colors.lighter,
    borderRadius: 20, 
    padding: 12, 
    marginTop: 10 
},
  faqText: { 
    color: Colors.primary, 
    textAlign: "center", 
    fontWeight: "500",
    color: 'black'
},
  contactBtn: { 
    backgroundColor: Colors.primary, 
    borderRadius: 20, 
    padding: 14, 
    marginTop: 12 
},
  contactText: { 
    color: "#fff", 
    textAlign: "center", 
    fontWeight: "600" 
},
  footerDivider: { 
    marginHorizontal: 8, 
    color: "#999" 
},
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 20,
    paddingHorizontal: 25,
    marginBottom: 9,
    marginTop: 'auto'
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    textDecorationLine: 'underline',
  },
});
