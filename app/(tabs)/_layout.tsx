import React from "react";
import { Tabs } from "expo-router";
import { LineChart, User } from "lucide-react-native";
import { usePalette } from "../../utils/colors";

export default function TabLayout() {
  const palette = usePalette();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.border,
          borderTopWidth: 1,
          height: 66,
          paddingBottom: 10,
          paddingTop: 9,
          elevation: 0,
        },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.muted,
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
          title: "Panel",
          tabBarIcon: ({ color }) => <LineChart color={color} size={22} strokeWidth={2.4} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => <User color={color} size={22} strokeWidth={2.4} />,
        }}
      />
    </Tabs>
  );
}
