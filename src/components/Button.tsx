// src/components/Button.tsx

import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

type Variant = "primary" | "outline" | "danger";

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  className?: string;
}

export default function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
  className = "",
}: Props) {
  const base =
    "py-4 px-5 rounded-xl items-center justify-center flex-row gap-2";

  const variants: Record<Variant, string> = {
    primary: "bg-primary",
    outline: "bg-transparent border-2 border-primary",
    danger: "bg-danger",
  };

  const textVariants: Record<Variant, string> = {
    primary: "text-white",
    outline: "text-primary",
    danger: "text-white",
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={`${base} ${variants[variant]} ${
        isDisabled ? "opacity-60" : ""
      } ${className}`}
      style={style}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? "#2563EB" : "#FFFFFF"}
        />
      ) : (
        <Text className={`font-bold text-base ${textVariants[variant]}`}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
