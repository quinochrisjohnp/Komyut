import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import Colors from '../../Constant_Design';
import PrivacyPolicyModal from '../../../components/PrivacyPolicyModal';
import TermsOfServiceModal from '../../../components/TermsOfServiceModal';

export default function AccountSecurity() {
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

      <Text style={styles.title}>Account & Security</Text>

      {/* Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Username</Text>
          <TextInput style={styles.input} value="Chris_lebron" editable={false} />
        </View>
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value="lebron_chris@gmail.com" editable={false} />
        </View>
      </View>

      {/* Security Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Settings</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText} onPress={() => router.push("/settings_pages/change-password")}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText} onPress={() => router.push("/settings_pages/delete-account")}>Delete Account</Text>
        </TouchableOpacity>
      </View>
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
    borderBottomWidth: 1, 
    borderColor: "#ccc", 
    fontWeight: "600", 
    fontSize: 16, 
    marginBottom: 20,
    paddingBottom: 10,
},
  inputWrapper: { 
    marginBottom: 12 
    
},
  label: { 
    fontSize: 14, 
    color: "#555" 
},
  input: { 
    borderWidth: 1, 
    borderColor: Colors.primary, 
    backgroundColor: Colors.lighter,
    borderRadius: 20, 
    padding: 10, 
    marginTop: 4 
},
  actionButton: { 
    backgroundColor: "#fff", 
    borderWidth: 1, 
    borderColor: Colors.primary, 
    backgroundColor: Colors.lighter,
    padding: 12, 
    borderRadius: 20, 
    marginTop: 10 
},
  actionText: { 
    color: 'black', 
    weight: "500",
    fontWeight: "600", 
    textAlign: "center" 
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
