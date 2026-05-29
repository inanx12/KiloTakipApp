import React from "react";
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from "react-native";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost";
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

/**
 * Birincil eylem butonu. Tek vurgu rengi (accent) AZ kullanılır:
 * yalnızca primary varyantta dolu accent zemin.
 */
export function Button({
  title,
  variant = "primary",
  loading = false,
  className = "",
  textClassName = "",
  ...props
}: ButtonProps) {
  let variantStyles = "bg-accent-blue active:opacity-85";
  let textStyles = "text-[#0A0A0B] font-extrabold";

  if (variant === "secondary") {
    variantStyles = "bg-accent-purple active:opacity-85";
    textStyles = "text-white font-extrabold";
  } else if (variant === "danger") {
    variantStyles = "bg-accent-red/15 border border-accent-red/30 active:bg-accent-red/25";
    textStyles = "text-accent-red font-bold";
  } else if (variant === "outline") {
    variantStyles =
      "bg-transparent border border-light-border dark:border-dark-border active:bg-light-bg dark:active:bg-dark-elevated";
    textStyles = "text-light-text dark:text-white font-bold";
  } else if (variant === "ghost") {
    variantStyles = "bg-light-bg dark:bg-dark-elevated active:opacity-80";
    textStyles = "text-light-text dark:text-white font-bold";
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      className={`h-12 flex-row justify-center items-center rounded-2xl px-5 ${variantStyles} ${
        props.disabled || loading ? "opacity-40" : ""
      } ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#0A0A0B" : "#00F0FF"} />
      ) : (
        <Text className={`text-[14px] tracking-wide ${textStyles} ${textClassName}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
