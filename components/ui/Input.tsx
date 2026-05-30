import React, { useState } from "react";
import { View, TextInput, Text, TextInputProps, Platform } from "react-native";
import { useTheme } from "../../utils/ThemeContext";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  className?: string;
}

/**
 * Çift tema giriş alanı. Odakta ince #00F0FF kenarlık.
 */
export function Input({
  label,
  error,
  containerClassName = "",
  className = "",
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const { isDark } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? "#FF5A5F"
    : focused
    ? "#00F0FF"
    : isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(0,0,0,0.08)";

  return (
    <View className={`w-full ${containerClassName}`}>
      {label ? (
        <Text className="text-light-subtext dark:text-dark-subtext text-[11px] font-bold uppercase tracking-wider mb-2 ml-0.5">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={isDark ? "rgba(255,255,255,0.30)" : "rgba(10,10,11,0.30)"}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={{ borderColor, borderWidth: 1 }}
        className={`h-12 bg-light-elevated dark:bg-dark-elevated rounded-2xl px-4 text-light-text dark:text-dark-text text-[16px] ${
          Platform.OS === "web" ? "outline-none" : ""
        } ${className}`}
        {...props}
      />
      {error ? (
        <Text className="text-accent-red text-xs mt-1.5 ml-0.5 font-semibold">{error}</Text>
      ) : null}
    </View>
  );
}
