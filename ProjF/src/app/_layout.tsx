import React from 'react';
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen 
          name="index"
          options={{
            headerShown: false,
            title: 'Home'
          }}
        />
        <Stack.Screen 
          name="(auth)/signup/page"
          options={{
            headerShown: false,
            title: 'Sign Up'
          }}
        />
        <Stack.Screen 
          name="(panel)/profile/page"
          options={{
            headerShown: false,
            title: 'Profile'
          }}
        />
      </Stack>
    </>
  );
}