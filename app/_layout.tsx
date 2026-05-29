import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "../utils/ThemeContext";
import "../global.css";

function RootApp() {
  const { isDark } = useTheme();
  const bgColor = isDark ? "#08080C" : "#F8F9FA";

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={bgColor} translucent={false} />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: bgColor },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootApp />
    </ThemeProvider>
  );
}
