import React from "react";
import { View, TextInput, Text, TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  className?: string;
}

/**
 * Reusable dual mode input field with focus borders and error states
 */
export function Input({
  label,
  error,
  containerClassName = "",
  className = "",
  ...props
}: InputProps) {
  return (
    <View className={`mb-4 w-full ${containerClassName}`}>
      {label && (
        <Text className="text-light-subtext dark:text-dark-subtext text-xs font-bold uppercase tracking-wider mb-2 ml-1">
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor="#888899"
        className={`h-14 bg-light-card dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-2xl px-5 text-light-text dark:text-white text-[16px] focus:border-accent-blue/80 dark:focus:border-accent-blue/80 ${
          error ? "border-accent-red dark:border-accent-red" : ""
        } ${className}`}
        {...props}
      />
      {error && (
        <Text className="text-accent-red text-xs mt-1.5 ml-1 font-semibold">{error}</Text>
      )}
    </View>
  );
}
