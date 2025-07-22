import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function AuthRoutesLayout() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href="/(root)" />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="welcome"
        options={{
          title: '', // Hides the default title
          headerShown: false, // Hide top bar for welcome
        }}
      />
    </Stack>
  );
}
