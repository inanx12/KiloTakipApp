import React from "react";
import { Stack } from "expo-router";
import { SystemBars } from "react-native-edge-to-edge";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "../utils/ThemeContext";
import "../global.css";

function RootApp() {
  const { isDark } = useTheme();
  const bgColor = isDark ? "#0A0A0B" : "#F8F9FA";

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Edge-to-edge (SDK 54): SystemBars hem durum hem navigasyon çubuğu
          ikon rengini yönetir. backgroundColor/translucent edge-to-edge'de
          yok sayıldığı için (uyarı verirdi) kullanılmaz. */}
      <SystemBars style={isDark ? "light" : "dark"} />

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
