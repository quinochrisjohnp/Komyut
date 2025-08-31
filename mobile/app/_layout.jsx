import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// (--------> changes here: import for loading context + overlay)
import { LoadingProvider } from '../components/LoadingContext';
import LoadingOverlay from '../components/LoadingOverlay';

export default function RootLayout() {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <SafeAreaProvider>
        {/* (--------> changes here: wrap everything with LoadingProvider) */}
        <LoadingProvider>
          <Slot />
          {/* (--------> changes here: global loading overlay, always available) */}
          <LoadingOverlay />
        </LoadingProvider>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
