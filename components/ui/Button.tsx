import React from "react";
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "danger" | "outline";
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

/**
 * Reusable premium button component with neon color schemes and interaction styles
 */
export function Button({
  title,
  variant = "primary",
  loading = false,
  className = "",
  textClassName = "",
  ...props
}: ButtonProps) {
  let variantStyles = "bg-accent-blue active:opacity-80";
  let textStyles = "text-light-bg dark:text-dark-bg font-extrabold";

  if (variant === "secondary") {
    variantStyles = "bg-accent-purple active:opacity-85";
    textStyles = "text-white font-extrabold";
  } else if (variant === "danger") {
    variantStyles = "bg-accent-red active:opacity-85";
    textStyles = "text-white font-bold";
  } else if (variant === "outline") {
    variantStyles = "bg-transparent border border-accent-blue/40 active:bg-accent-blue/10";
    textStyles = "text-accent-blue font-bold";
  }

  return (
    <TouchableOpacity
      className={`h-14 flex-row justify-center items-center rounded-2xl px-5 ${variantStyles} ${
        props.disabled || loading ? "opacity-40" : ""
      } ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "outline" ? "#00F0FF" : "#FFFFFF"} />
      ) : (
        <Text className={`text-[15px] tracking-wider uppercase ${textStyles} ${textClassName}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
