// src/theme/colors.ts

export const colors = {
  primary: "#2563EB",
  primaryDark: "#1E40AF",
  primaryLight: "#DBEAFE",
  secondary: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  background: "#F9FAFB",
  card: "#FFFFFF",
  text: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  white: "#FFFFFF",
} as const;

export const statusColors: Record<string, string> = {
  pending: "#F59E0B",
  serving: "#2563EB",
  completed: "#10B981",
  cancelled: "#EF4444",
};

export const departmentColors: Record<
  "dean" | "cashier" | "registrar",
  { bg: string; text: string }
> = {
  dean: { bg: "#EDE9FE", text: "#6D28D9" },
  cashier: { bg: "#FEF3C7", text: "#B45309" },
  registrar: { bg: "#DBEAFE", text: "#1D4ED8" },
};
