// TermsOfServiceModal.jsx
import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../app/Constant_Design';

const TermsOfServiceModal = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Terms of Service</Text>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.sectionText}>
              By using our application, you agree to comply with and be legally bound by these Terms of Service.
            </Text>

            <Text style={styles.sectionTitle}>2. Use of the App</Text>
            <Text style={styles.sectionText}>
              You may use the app only for lawful purposes and in accordance with these Terms. You agree not to use the app in any way that violates any applicable national or international law or regulation.
            </Text>

            <Text style={styles.sectionTitle}>3. User Accounts</Text>
            <Text style={styles.sectionText}>
              You are responsible for safeguarding the password that you use to access the app and for any activities or actions under your password.
            </Text>

            <Text style={styles.sectionTitle}>4. Termination</Text>
            <Text style={styles.sectionText}>
              We may terminate or suspend your access to the app immediately, without prior notice or liability, for any reason.
            </Text>

            <Text style={styles.sectionTitle}>5. Limitation of Liability</Text>
            <Text style={styles.sectionText}>
              In no event shall we, nor our partners, be liable for any indirect, incidental, special, consequential or punitive damages.
            </Text>

            <Text style={styles.sectionTitle}>6. Changes to Terms</Text>
            <Text style={styles.sectionText}>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
            </Text>

            <Text style={styles.sectionText}>
              By continuing to access or use our app after any revisions become effective, you agree to be bound by the revised terms.
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  modalContainer: {
    width: '90%',
    height: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    paddingTop: 40,
    elevation: 5,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 15,
    fontSize: 16,
  },
  sectionText: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
});

export default TermsOfServiceModal;