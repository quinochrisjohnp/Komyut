import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Colors from '../../Constant_Design';

export default function AccountSecurity() {
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
          <Text style={styles.actionText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>Delete Account</Text>
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
    borderRadius: 20, 
    padding: 10, 
    marginTop: 4 
},
  actionButton: { 
    backgroundColor: "#fff", 
    borderWidth: 1, 
    borderColor: Colors.primary, 
    padding: 12, 
    borderRadius: 20, 
    marginTop: 10 
},
  actionText: { 
    color: Colors.primary, 
    fontWeight: "600", 
    textAlign: "center" 
}
});
