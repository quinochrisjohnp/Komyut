import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  CheckBox, // optional replacement: use react-native-checkbox or pressable custom
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TermsModal = ({ onAgreed }) => {
  const [checked, setChecked] = useState(false);

  const handleAgree = async () => {
    if (checked) {
      await AsyncStorage.setItem('hasAgreedToTerms', 'true'); // ← updated key
      onAgreed();
    }
  };

  return (
    <Modal transparent animationType="slide" visible>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Logo */}
          <Image
            source={require('../assets/images/app_logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* Title */}
          <Text style={styles.title}>Privacy Policy and Terms of Service</Text>

          {/* Scrollable Terms */}
          <ScrollView style={styles.scrollArea}>
            {/* Privacy Policy */}
            <Text style={styles.sectionHeader}>Privacy Policy</Text>
            {[
              {
                title: '1. Data Collection',
                text:
                  'We collect essential personal information such as your email address, location data, and device details to ensure that Komyut works smoothly and delivers accurate and real-time transport information.',
              },
              {
                title: '2. Use of Information',
                text:
                  'Your data is used to personalize your experience, improve route suggestions, and allow key features of the app such as notifications, saved routes, and account recovery.',
              },
              {
                title: '3. Data Sharing',
                text:
                  'We do not sell or share your personal information with third parties unless required by law or to protect the rights and safety of our users and services.',
              },
              {
                title: '4. Data Security',
                text:
                  'We use secure technologies and practices to protect your personal data. Access to your information is restricted to authorized personnel only.',
              },
              {
                title: '5. User Control',
                text:
                  'You can manage notification settings, location sharing, and account information directly from the app at any time.',
              },
              {
                title: '6. Policy Updates',
                text:
                  'We may update this Privacy Policy from time to time. If there are significant changes, we’ll notify you within the app or via email.',
              },
              {
                title: '7. Contact Us',
                text:
                  'For questions or concerns regarding your data, you may contact us through the support section within the app.',
              },
            ].map((item, index) => (
              <View key={index} style={styles.termBlock}>
                <Text style={styles.termTitle}>{item.title}</Text>
                <Text style={styles.termText}>{item.text}</Text>
              </View>
            ))}

            {/* Terms of Service */}
            <Text style={styles.sectionHeader}>Terms of Service</Text>
            {[
              {
                title: '1. Acceptance of Terms',
                text:
                  'By using Komyut, you agree to follow these terms. If you do not agree, please discontinue use of the app.',
              },
              {
                title: '2. Account Responsibility',
                text:
                  'You are responsible for keeping your login credentials secure and for all activity that occurs under your account.',
              },
              {
                title: '3. Prohibited Use',
                text:
                  'You agree not to misuse Komyut for illegal activities, unauthorized access, or anything that disrupts service for others.',
              },
              {
                title: '4. Modifications & Updates',
                text:
                  'We may update the app, features, or these terms at any time. Continued use after changes means you accept the new terms.',
              },
              {
                title: '5. Service Availability',
                text:
                  'While we strive to provide a smooth and reliable experience, Komyut may occasionally be unavailable due to maintenance or technical issues.',
              },
              {
                title: '6. Intellectual Property',
                text:
                  'All content, trademarks, and assets of Komyut belong to the developers and may not be copied or used without permission.',
              },
              {
                title: '7. Termination',
                text:
                  'We reserve the right to suspend or terminate your access if you violate these terms or engage in suspicious behavior.',
              },
              {
                title: '8. Governing Law',
                text:
                  'These terms shall be governed by applicable local laws, and any disputes will be settled under those laws.',
              },
            ].map((item, index) => (
              <View key={`tos-${index}`} style={styles.termBlock}>
                <Text style={styles.termTitle}>{item.title}</Text>
                <Text style={styles.termText}>{item.text}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Checkbox */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity onPress={() => setChecked(!checked)} style={styles.checkbox}>
              {checked && <Text style={styles.checkboxTick}>✔</Text>}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>I have read and agree to the terms</Text>
          </View>

          {/* Agree Button */}
          <TouchableOpacity
            onPress={handleAgree}
            style={[styles.agreeButton, { backgroundColor: checked ? '#0077cc' : '#ccc' }]}
            disabled={!checked}
          >
            <Text style={styles.agreeText}>I Agree</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default TermsModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  card: {
    width: '90%',
    height: '90%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    height: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  scrollArea: {
    flex: 1,
    width: '100%',
    marginVertical: 10,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    color: '#333',
  },
  termBlock: {
    marginBottom: 10,
  },
  termTitle: {
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#222',
  },
  termText: {
    fontWeight: '300',
    color: '#444',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    alignSelf: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#333',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxTick: {
    fontSize: 14,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  agreeButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  agreeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
