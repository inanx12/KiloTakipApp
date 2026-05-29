import React from "react";
import { View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Modern, glossy card with subtle borders supporting both Light and Dark modes
 */
export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <View
      className={`bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-5 shadow-soft dark:shadow-soft-dark ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
