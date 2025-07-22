import { View, Text, Button } from 'react-native';
import { Link, useRouter } from 'expo-router';
import React from 'react';

const Welcome = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>KOMYUT LOGO</Text>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Let's get started!</Text>

      <Link href="/(auth)/log-in" asChild>
        <Button title="Log In" />
      </Link>

      <View style={{ height: 10 }} />

      <Link href="/(auth)/sign-up" asChild>
        <Button title="Sign Up" />
      </Link>
    </View>
  );
};

export default Welcome;
