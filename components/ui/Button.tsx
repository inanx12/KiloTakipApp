import React from "react";
import { Pressable, Text, PressableProps, ActivityIndicator, View } from "react-native";

interface ButtonProps extends PressableProps {
  title: string;
  variant?: "primary" | "subtle" | "danger" | "outline";
  loading?: boolean;
  className?: string;
  textClassName?: string;
  icon?: React.ReactNode;
}

/**
 * Tek vurgu rengini AZ kullanan buton seti.
 * - primary: #00F0FF dolgu + koyu metin (birincil aksiyon)
 * - subtle: nötr yüzey + ince kenarlık (ikincil)
 * - outline: şeffaf + ince kenarlık
 * - danger: kırmızı, sadece soluk dolgu
 */
export function Button({
  title,
  variant = "primary",
  loading = false,
  className = "",
  textClassName = "",
  icon,
  ...props
}: ButtonProps) {
  let surface = "bg-accent-blue active:opacity-80";
  let textStyles = "text-[#06181A]";

  if (variant === "subtle") {
    surface =
      "bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border active:opacity-70";
    textStyles = "text-light-text dark:text-dark-text";
  } else if (variant === "danger") {
    surface = "bg-accent-red/10 border border-accent-red/25 active:bg-accent-red/20";
    textStyles = "text-accent-red";
  } else if (variant === "outline") {
    surface =
      "bg-transparent border border-light-border dark:border-dark-border active:bg-accent-blue/10";
    textStyles = "text-light-text dark:text-dark-text";
  }

  const disabled = (props.disabled || loading) as boolean;

  return (
    <Pressable
      className={`h-12 flex-row justify-center items-center rounded-2xl px-5 ${surface} ${
        disabled ? "opacity-40" : ""
      } ${className}`}
      disabled={disabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#06181A" : "#00F0FF"} />
      ) : (
        <View className="flex-row items-center">
          {icon ? <View className="mr-2">{icon}</View> : null}
          <Text className={`text-[13px] font-extrabold tracking-wide ${textStyles} ${textClassName}`}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
