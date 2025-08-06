import { useState } from 'react';
import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
} from 'react-native';
import Colors from '../Constant_Design';
import authStyles from './auth-styles';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();


export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifyError, setVerifyError] = useState("");


  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;
    
    setUsernameError("");
    setPasswordError("");
    setEmailError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    try {
      await signUp.create({
        username,
        emailAddress,
        password
      });
      
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      setPendingVerification(true);
      setError(""); // Clear error if everything went fine
    } catch (err) {
      const errorMessage = err?.errors?.[0]?.message || "Something went wrong.";

       if (errorMessage.toLowerCase().includes("username")) {
        setUsernameError("Username is already taken.");
      } else if (errorMessage.toLowerCase().includes("email")) {
        setEmailError("This email address is already registered.");
      } else {
        setError(""); 
      }
    }
  };


  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    setVerifyError(""); // Clear previous error

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({ code });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/(root)');
      } else {
        setVerifyError("Verification not complete. Please try again.");
        console.error("Verification incomplete:", signUpAttempt);
      }

    } catch (err) {
      const errorCode = err?.errors?.[0]?.code;

      if (errorCode === "form_code_incorrect") {
        setVerifyError("The verification code you entered is incorrect.");
      } else {
        setVerifyError("Something went wrong. Please try again.");
      }

      console.error("Verification error:", JSON.stringify(err, null, 2));
    }
  };


  const { startOAuthFlow: googleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: facebookOAuth } = useOAuth({ strategy: 'oauth_facebook' });

  const handleGoogleSignUp = async () => {
    try {
      const { createdSessionId, setActive } = await googleOAuth();
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        router.replace('/(root)');
      }
    } catch (err) {
      console.error('Google OAuth error:', err);
    }
  };

  const handleFacebookSignUp = async () => {
    try {
      const { createdSessionId, setActive } = await facebookOAuth();
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        router.replace('/(root)');
      }
    } catch (err) {
      console.error('Facebook OAuth error:', err);
    }
  };

  if (pendingVerification) {
    return (
      <>
        <SafeAreaView style={authStyles.safeArea}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Image
              source={require('../../assets/images/back_icon.png')}
              style={authStyles.backIcon}
            />
          </TouchableOpacity>
          <View style={authStyles.container}>
            {/* Top: Logo */}
            <View style={authStyles.logoSection}>
              <Image
                source={require('../../assets/images/app_logo.png')}
                style={authStyles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Middle: Inputs & Buttons */}
            <View style={authStyles.middleSection}>
              <Text style={styles.verifyTitle}>Verify your Identity</Text>
              <Text style={styles.verifyText}>A code has been sent to your email. Enter the code to verify your identity.</Text>

              <TextInput
                style={authStyles.input}
                placeholder="Enter code"
                placeholderTextColor="#999"
                value={code}
                onChangeText={(code) => setCode(code)}
              />
              {verifyError !== "" && (<Text style={{ color: 'red', marginTop: 4 }}>{verifyError}</Text>)}
              <Text style={styles.verifyText}>Didn’t get the code?</Text>

              <TouchableOpacity style={styles.signUpBtn} onPress={onVerifyPress}>
                <Text style={styles.signUpText}>Enter Code</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={authStyles.footer}>
              <Text style={authStyles.footerText}>Privacy Policy</Text>
              <Text style={authStyles.footerText}>Terms of Service</Text>
            </View>
          </View>
        </SafeAreaView>
      </>
    )
  }

  return (
    <SafeAreaView style={authStyles.safeArea}>
      <TouchableOpacity onPress={() => router.back()} style={authStyles.backBtn}>
        <Image
          source={require('../../assets/images/back_icon.png')}
          style={authStyles.backIcon}
        />
      </TouchableOpacity>
      <View style={authStyles.container}>
        {/* Logo */}
        <View style={authStyles.logoSection}>
          <Image
            source={require('../../assets/images/app_logo.png')}
            style={authStyles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Form Section */}
        <View style={authStyles.middleSection}>
          <Text style={styles.title}>Create Account</Text>

          
          <TextInput
            style={authStyles.input}
            placeholder="Enter username"
            placeholderTextColor="#666"
            autoCapitalize="none"
            value={username}
            onChangeText={(username) => setUsername(username)}
          />
          {usernameError && <Text style={{ color: "red" }}>{usernameError}</Text>}
          <TextInput
            style={authStyles.input}
            placeholder="Enter email"
            placeholderTextColor="#666"
            autoCapitalize="none"
            value={emailAddress}
            onChangeText={(email) => setEmailAddress(email)}
          />
          {emailError !== "" && (<Text style={{ color: 'red', marginTop: 4 }}>{emailError}</Text>)}
          <TextInput
            style={authStyles.input}
            placeholder="Enter password"
            placeholderTextColor="#666"
            value={password}
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
          />
          <TextInput
            style={authStyles.input}
            placeholder="Confirm password"
            placeholderTextColor="#666"
            value={confirmPassword}
            secureTextEntry={true}
            onChangeText={(confirmPassword) => setConfirmPassword(confirmPassword)}
          />

          {passwordError !== "" && (
            <Text style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>
              {passwordError}
              </Text>
            )}

          <TouchableOpacity style={styles.signUpBtn} onPress={onSignUpPress}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>

          <Text style={styles.altText}>Or sign up with</Text>

          <View style={authStyles.iconRow}>
            <TouchableOpacity style={authStyles.iconBtn} onPress={handleGoogleSignUp}>
              <Image
                source={require('../../assets/images/google_icon.png')}
                style={authStyles.icon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={authStyles.iconBtn} onPress={handleFacebookSignUp}> 
              <Image
                source={require('../../assets/images/facebook_icon.webp')}
                style={authStyles.icon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={authStyles.footer}>
          <Text style={authStyles.footerText}>Privacy Policy</Text>
          <Text style={authStyles.footerText}>Terms of Service</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 30,
    color: '#333',
  },
  verifyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: -20,
    marginBottom: 25,
    color: '#333',
  },
  signUpBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    marginBottom: 25,
    alignItems: 'center',
  },
  signUpText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  altText: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666',
  },
});
