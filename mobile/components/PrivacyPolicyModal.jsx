// PrivacyPolicyModal.jsx
import React from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PrivacyPolicyModal = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="gray" />
          </Pressable>

          <Text style={styles.title}>Privacy Policy</Text>
          <ScrollView style={styles.scrollContent}>
            <Text style={styles.sectionTitle}>1. Data Collection</Text>
            <Text style={styles.text}>
              We collect information such as your name, email address, and location solely for the purpose of
              providing you with accurate transportation assistance and personalized user experience.
            </Text>

            <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
            <Text style={styles.text}>
              Your data is used to enhance app functionality, such as providing real-time route updates, saving preferences,
              and improving navigation accuracy. We do not sell or share your personal information with third parties.
            </Text>

            <Text style={styles.sectionTitle}>3. Data Security</Text>
            <Text style={styles.text}>
              We implement standard security practices to protect your data from unauthorized access or disclosure.
              However, please note that no system is 100% secure.
            </Text>

            <Text style={styles.sectionTitle}>4. Third-party Services</Text>
            <Text style={styles.text}>
              We may use third-party APIs (e.g. Google Maps) to enhance user experience. These services may collect data
              according to their own privacy policies.
            </Text>

            <Text style={styles.sectionTitle}>5. User Control</Text>
            <Text style={styles.text}>
              You may request to review, update, or delete your data at any time by contacting our support team.
            </Text>

            <Text style={styles.sectionTitle}>6. Updates to Policy</Text>
            <Text style={styles.text}>
              We may update this Privacy Policy occasionally. You will be notified of any significant changes within the app.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  scrollContent: {
    marginTop: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    fontSize: 16,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
});

export default PrivacyPolicyModal;
