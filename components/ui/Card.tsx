import React from "react";
import { View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  /** Vurgulu katman (#1F1F25) — iç içe yüzeyler için */
  elevated?: boolean;
  className?: string;
}

/**
 * Katmanlı yüzey kartı.
 * Dark'ta gölge yok; 1px hairline kenarlık. Light'ta yumuşak gölge.
 * Köşeler rounded-2xl, iç boşluk 16px (p-4).
 */
export function Card({ children, elevated = false, className = "", ...props }: CardProps) {
  const surface = elevated
    ? "bg-light-elevated dark:bg-dark-elevated"
    : "bg-light-card dark:bg-dark-card";
  return (
    <View
      className={`${surface} border border-light-border dark:border-dark-border rounded-2xl p-4 shadow-soft dark:shadow-none ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
