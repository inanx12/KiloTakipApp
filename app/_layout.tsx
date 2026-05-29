import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Text } from "react-native";
import { ThemeProvider, useTheme } from "../utils/ThemeContext";
import "../global.css";

function RootApp() {
  const { isDark } = useTheme();
  const bgColor = isDark ? "#08080C" : "#F8F9FA";

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: bgColor }}>
      <StatusBar style={isDark ? "light" : "dark"} backgroundColor={bgColor} translucent={false} />
      
      {/* NATIVEWIND TEST KUTUSU */}
      <View className="bg-red-500 h-40 items-center justify-center">
        <Text className="text-white font-bold">NATIVEWIND TEST</Text>
      </View>
      
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
