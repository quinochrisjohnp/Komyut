import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TermsAndConditionsModal from '../../components/TermsModal'; // adjust path if needed

export default function AuthLayout() {
  const { isSignedIn } = useAuth();
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const checkTerms = async () => {
      const accepted = await AsyncStorage.getItem('hasAgreedToTerms');
      if (accepted !== 'true') {
        setShowTerms(true);
      }
    };
    checkTerms();
  }, []);

  if (isSignedIn) {
    return <Redirect href="/(root)/index" />;
  }

  return (
    <SafeAreaProvider>
      {showTerms && (
        <TermsAndConditionsModal
          onAgree={async () => {
            await AsyncStorage.setItem('hasAgreedToTerms', 'true');
            setShowTerms(false);
          }}
        />
      )}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 300,
        }}
      />
    </SafeAreaProvider>
  );
}
