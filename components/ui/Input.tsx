import React from "react";
import { View, TextInput, Text, TextInputProps, Platform } from "react-native";
import { useTheme } from "../../utils/ThemeContext";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  className?: string;
}

/**
 * İki temayı destekleyen giriş alanı. Vurgulu katman zemini + hairline kenarlık.
 */
export function Input({
  label,
  error,
  containerClassName = "",
  className = "",
  ...props
}: InputProps) {
  const { isDark } = useTheme();
  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Text className="text-light-muted dark:text-dark-muted text-[11px] font-bold uppercase tracking-wider mb-2 ml-0.5">
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={isDark ? "rgba(255,255,255,0.30)" : "rgba(10,10,11,0.30)"}
        className={`h-12 bg-light-bg dark:bg-dark-elevated border rounded-2xl px-4 text-light-text dark:text-white text-[16px] ${
          error
            ? "border-accent-red"
            : "border-light-border dark:border-dark-border"
        } ${className}`}
        // @ts-ignore - web'de odak halkasını kaldır
        style={Platform.OS === "web" ? { outline: "none" } : undefined}
        {...props}
      />
      {error && (
        <Text className="text-accent-red text-xs mt-1.5 ml-0.5 font-semibold">{error}</Text>
      )}
    </View>
  );
}
