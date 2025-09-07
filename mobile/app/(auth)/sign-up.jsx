import { useState, useEffect } from 'react';
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
import PrivacyPolicyModal from '../../components/PrivacyPolicyModal';
import TermsOfServiceModal from '../../components/TermsOfServiceModal';
import { useLoading } from "../../components/LoadingContext";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

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

  const { setLoading } = useLoading();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // helpers
  const isValidLength = (text) => text.length >= 6 && text.length <= 15;
  const hasNoSpaces = (text) => !/\s/.test(text);
  const [timer, setTimer] = useState(30);

    useEffect(() => {
      let interval;
      if (timer > 0) {
        interval = setInterval(() => setTimer((t) => t - 1), 1000);
      }
      return () => clearInterval(interval);
    }, [timer]);

    const handleResend = async () => {
      if (timer === 0) {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setTimer(30); // restart timer
      }
    };


  // input handlers (block spaces)
  const handleUsernameChange = (text) => {
    if (/\s/.test(text)) {
      setUsernameError("Spaces are not allowed in username.");
      return;
    }
    setUsernameError("");
    setUsername(text);
  };

  const handleEmailChange = (text) => {
    if (/\s/.test(text)) {
      setEmailError("Spaces are not allowed in email.");
      return;
    }
    setEmailError("");
    setEmailAddress(text);
  };

  const handlePasswordChange = (text) => {
    if (/\s/.test(text)) {
      setPasswordError("Spaces are not allowed in password.");
      return;
    }
    setPasswordError("");
    setPassword(text);
  };

  const handleConfirmPasswordChange = (text) => {
    if (/\s/.test(text)) {
      setPasswordError("Spaces are not allowed in confirm password.");
      return;
    }
    setPasswordError("");
    setConfirmPassword(text);
  };

  // sign up press
  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    setUsernameError("");
    setPasswordError("");
    setEmailError("");
    setError("");

    // local validations
    if (/\s/.test(username)) {
      setUsernameError("Username cannot contain spaces.");
      return;
    }
    if (username.length < 8 || username.length > 15) {
      setUsernameError("Username must be 8–15 characters.");
      return;
    }

    if (/\s/.test(password) || /\s/.test(confirmPassword)) {
      setPasswordError("Password cannot contain spaces.");
      return;
    }
    if (password.length < 8 || password.length > 15) {
      setPasswordError("Password must be 8–15 characters.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailAddress) || /\s/.test(emailAddress)) {
      setEmailError("Please enter a valid email address (no spaces).");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    // clerk request
    try {
      await signUp.create({
        username,
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      const errorCode = err?.errors?.[0]?.code;

      switch (errorCode) {
        case "form_identifier_exists":
          setEmailError("This email is already registered.");
          break;
        case "form_username_exists":
          setUsernameError("Username is already taken.");
          break;
        case "form_password_invalid_length":
        case "form_password_length_too_short":
          setPasswordError("Password must be 8–15 characters.");
          break;
        case "form_password_pwned":
          setPasswordError("Password isn’t safe. Try a unique one with letters, numbers & symbols.");
          break;
        default:
          setError("Something went wrong. Please try again.");
          console.error("Signup error:", JSON.stringify(err, null, 2));
      }
    }
  };


  // verification
  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setVerifyError("");
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
      <SafeAreaView style={authStyles.safeArea}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Image
            source={require('../../assets/images/back_icon.png')}
            style={authStyles.backIcon}
          />
        </TouchableOpacity>
        <View style={authStyles.container}>
          <View style={authStyles.logoSection}>
            <Image
              source={require('../../assets/images/app_logo.png')}
              style={authStyles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={authStyles.middleSection}>
            <Text style={styles.verifyTitle}>Verify your Identity</Text>
            <Text style={styles.verifyText}>
              A code has been sent to your email. Enter the code to verify your identity. 
            </Text>
            <Text style={styles.verifyText}>
              Didn’t get the code? Click below to resend it.
            </Text>
            <TouchableOpacity disabled={timer > 0} onPress={handleResend}>
              <Text style={{ 
                fontSize: 14, 
                color: timer > 0 ? '#aaa' : Colors.primary,
                marginTop: 10,
                marginBottom: 20,
                textAlign: 'center'
              }}>
                {timer > 0 ? `Resend code in ${timer}s` : "Resend Code"}
              </Text>
            </TouchableOpacity>

            <View style={authStyles.inputWrapper}>
              <TextInput
                style={[authStyles.input, { paddingRight: 40 }]}
                placeholder="Enter code"
                placeholderTextColor="#999"
                value={code}
                onChangeText={setCode}
                maxLength={6}
                keyboardType="numeric"
              />
              {code.length > 0 && (
                <TouchableOpacity onPress={() => setCode('')} style={authStyles.singleClearBtn}>
                  <Text style={authStyles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {verifyError !== "" && (<Text style={{ color: 'red', marginTop: 4 }}>{verifyError}</Text>)}
            <TouchableOpacity style={styles.signUpBtn} onPress={onVerifyPress}>
              <Text style={styles.signUpText}>Enter Code</Text>
            </TouchableOpacity>
          </View>
          <View style={authStyles.footer}>
            <Text style={authStyles.footerText} onPress={() => setShowPrivacy(true)} >Privacy Policy</Text>
            <Text style={authStyles.footerText} onPress={() => setShowTerms(true)}>Terms of Service</Text>
            <PrivacyPolicyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
            <TermsOfServiceModal visible={showTerms} onClose={() => setShowTerms(false)} />
          </View>
        </View>
      </SafeAreaView>
    );
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
        <View style={authStyles.logoSection}>
          <Image
            source={require('../../assets/images/app_logo.png')}
            style={authStyles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={authStyles.middleSection}>
          <Text style={styles.title}>Create Account</Text>

          {/* Username */}
          <View style={authStyles.inputWrapper}>
            <TextInput
              style={[authStyles.input, { paddingRight: 40 }]}
              placeholder="Enter username"
              placeholderTextColor="#666"
              autoCapitalize="none"
              value={username}
              onChangeText={handleUsernameChange}
              maxLength={15}
            />
            {username.length > 0 && (
              <TouchableOpacity onPress={() => setUsername('')} style={authStyles.singleClearBtn}>
                <Text style={authStyles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {usernameError && <Text style={{ color: "red" }}>{usernameError}</Text>}

          {/* Email */}
          <View style={authStyles.inputWrapper}>
            <TextInput
              style={[authStyles.input, { paddingRight: 40 }]}
              placeholder="Enter email"
              placeholderTextColor="#666"
              autoCapitalize="none"
              value={emailAddress}
              onChangeText={handleEmailChange}
              maxLength={30}
            />
            {emailAddress.length > 0 && (
              <TouchableOpacity onPress={() => setEmailAddress('')} style={authStyles.singleClearBtn}>
                <Text style={authStyles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {emailError !== "" && (<Text style={{ color: 'red', marginTop: 4 }}>{emailError}</Text>)}

          {/* Password */}
          <View style={authStyles.inputWrapper}>
            <TextInput
              style={[authStyles.input, { paddingRight: 80 }]}
              placeholder="Enter password"
              placeholderTextColor="#666"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={handlePasswordChange}
              maxLength={15}
            />
            <View style={authStyles.iconRow}>
              {password.length > 0 && (
                <TouchableOpacity onPress={() => setPassword('')}>
                  <Text style={authStyles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={authStyles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={authStyles.inputWrapper}>
            <TextInput
              style={[authStyles.input, { paddingRight: 80 }]}
              placeholder="Confirm password"
              placeholderTextColor="#666"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              maxLength={15}
            />
            <View style={authStyles.iconRow}>
              {confirmPassword.length > 0 && (
                <TouchableOpacity onPress={() => setConfirmPassword('')}>
                  <Text style={authStyles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Text style={authStyles.eyeIcon}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {passwordError !== "" && (
            <Text style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>
              {passwordError}
            </Text>
          )}

          <TouchableOpacity style={styles.signUpBtn} onPress={onSignUpPress}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>

          <Text style={styles.altText}>Or sign up with</Text>

          <View style={authStyles.signRow}>
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

        <View style={authStyles.footer}>
          <Text style={authStyles.footerText} onPress={() => setShowPrivacy(true)} >Privacy Policy</Text>
          <Text style={authStyles.footerText} onPress={() => setShowTerms(true)}>Terms of Service</Text>
          <PrivacyPolicyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
          <TermsOfServiceModal visible={showTerms} onClose={() => setShowTerms(false)} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 30,
    color: '#333',
  },
  verifyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: -20,
    marginBottom: 15,
    color: '#333',
  },
  verifyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
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
