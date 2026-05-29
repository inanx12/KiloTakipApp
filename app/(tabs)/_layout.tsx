import React from "react";
import { Tabs } from "expo-router";
import { TrendingUp, User } from "lucide-react-native";
import { useTheme } from "../../utils/ThemeContext";

export default function TabLayout() {
  const { isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#15151F" : "#FFFFFF",
          borderTopColor: isDark ? "#232335" : "#E9ECEF",
          borderTopWidth: 1.5,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#00F0FF",
        tabBarInactiveTintColor: isDark ? "#6C6C85" : "#A0A0A0",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
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
