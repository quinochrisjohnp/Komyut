import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Colors from '../../Constant_Design';

export default function HelpSupport() {
  const router = useRouter();

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
          <Text style={styles.contactText}>Contact Support</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Privacy Policy</Text>
        <Text style={styles.footerDivider}>|</Text>
        <Text style={styles.footerText}>Terms of Service</Text>
        <Text style={styles.footerDivider}>|</Text>
        <Text style={styles.footerText}>v1.0.0</Text>
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
    borderRadius: 20, 
    padding: 12, 
    marginTop: 10 
},
  faqText: { 
    color: Colors.primary, 
    textAlign: "center", 
    fontWeight: "500" 
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
  footer: { 
    flexDirection: "row", 
    justifyContent: "center", 
    marginTop: "auto", 
    marginBottom: 20 
},
  footerText: { 
    color: "#666", 
    fontSize: 12 
},
  footerDivider: { 
    marginHorizontal: 8, 
    color: "#999" 
}
});
