import React from "react";
import { View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  /** Vurgulu (bir kademe açık) yüzey */
  elevated?: boolean;
}

/**
 * Katmanlı yüzey kartı. Dark'ta gölge yok; ince 1px kenarlık.
 * Varsayılan iç boşluk 16px (p-4), köşe rounded-2xl.
 */
export function Card({ children, className = "", elevated = false, ...props }: CardProps) {
  const surface = elevated
    ? "bg-light-elevated dark:bg-dark-elevated"
    : "bg-light-card dark:bg-dark-card";

  return (
    <View
      className={`${surface} border border-light-border dark:border-dark-border rounded-2xl p-4 ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
