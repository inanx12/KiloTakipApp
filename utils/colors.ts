import { useTheme } from "./ThemeContext";

/**
 * Tasarım token'larının JS tarafı karşılığı (ikon, StatusBar, tab bar, grafik).
 * Tailwind tailwind.config.js ile birebir uyumlu tutulmalıdır.
 */
export interface Palette {
  bg: string;
  card: string;
  elevated: string;
  border: string;
  text: string;
  subtext: string;
  muted: string;
  // vurgular / durum renkleri
  accent: string;
  purple: string;
  green: string;
  red: string;
  flame: string;
}

export const darkPalette: Palette = {
  bg: "#0A0A0B",
  card: "#16161A",
  elevated: "#1F1F25",
  border: "rgba(255,255,255,0.06)",
  text: "#FFFFFF",
  subtext: "rgba(255,255,255,0.60)",
  muted: "rgba(255,255,255,0.40)",
  accent: "#00F0FF",
  purple: "#BF55EC",
  green: "#22D17E",
  red: "#FF5C5C",
  flame: "#FF8C00",
};

export const lightPalette: Palette = {
  bg: "#F2F3F5",
  card: "#FFFFFF",
  elevated: "#FFFFFF",
  border: "rgba(10,10,11,0.08)",
  text: "#0A0A0B",
  subtext: "rgba(10,10,11,0.55)",
  muted: "rgba(10,10,11,0.40)",
  accent: "#00B8C4",
  purple: "#9B3FD4",
  green: "#16A968",
  red: "#E23B3B",
  flame: "#F2760A",
};

export function usePalette(): Palette {
  const { isDark } = useTheme();
  return isDark ? darkPalette : lightPalette;
}
