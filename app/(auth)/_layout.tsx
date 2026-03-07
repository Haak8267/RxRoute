import { Stack } from "expo-router";
import React from "react";

const _AuthLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="Profile" options={{ headerShown: false }} />
      <Stack.Screen name="Order" options={{ headerShown: false }} />
      <Stack.Screen name="Login" options={{ headerShown: false }} />
      <Stack.Screen name="Signup" options={{ headerShown: false }} />
      <Stack.Screen name="Welcome" options={{ headerShown: false }} />
    </Stack>
  );
};

export default _AuthLayout;
