import { Platform } from "react-native";

export const C = {
  navy: "#0A2A5E",
  navySoft: "#1E4A8A",
  white: "#FFFFFF",
  tint: "#F4F7FB",
  border: "#E3E9F2",
  muted: "#6B7A90",
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  dangerBorder: "#FECACA",
  success: "#15803D",
  successBg: "#F0FDF4",
  warn: "#B45309",
  warnBg: "#FFFBEB",
} as const;

export const SERIF = Platform.select({ ios: "Georgia", android: "serif" });
