import React from "react";
import { Tabs } from "expo-router";
import { TrendingUp, User, Shield } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../utils/ThemeContext";

export default function TabLayout() {
  const { isDark } = useTheme();
  // Edge-to-edge (SDK 54): içerik sistem navigasyon çubuğunun arkasına aktığı
  // için tab bar'a alt güvenli-alan boşluğu eklenir (etiketler kesilmesin).
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#0A0A0B" : "#FFFFFF",
          borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
          borderTopWidth: 1,
          height: 66 + insets.bottom,
          paddingBottom: 10 + insets.bottom,
          paddingTop: 10,
          elevation: 0,
        },
        tabBarActiveTintColor: "#00F0FF",
        tabBarInactiveTintColor: isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,11,0.42)",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <TrendingUp color={color} size={size || 22} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="status"
        options={{
          title: "Durum",
          tabBarIcon: ({ color, size }) => (
            <Shield color={color} size={size || 22} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <User color={color} size={size || 22} strokeWidth={2.5} />
          ),
        }}
      />
    </Tabs>
  );
}
