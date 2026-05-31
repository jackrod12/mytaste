import { Pressable, Text } from "react-native";

type Variant = "primary" | "secondary";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  className?: string;
  /** 라벨 앞 아이콘/이모지 등 */
  leading?: string;
}

/**
 * primary: 다크(#1A1917) 배경 + 흰 글씨
 * secondary: 흰 배경 + 테두리 + 다크 글씨
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  className = "",
  leading,
}: ButtonProps) {
  const isPrimary = variant === "primary";
  const container = isPrimary
    ? "bg-ink border border-ink"
    : "bg-card border border-line";
  const textColor = isPrimary ? "text-white" : "text-ink";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`flex-row items-center justify-center rounded-xl px-4 py-3.5 active:opacity-80 ${container} ${
        disabled ? "opacity-40" : ""
      } ${className}`}
    >
      <Text className={`text-[15px] font-semibold ${textColor}`}>
        {leading ? `${leading}  ` : ""}
        {label}
      </Text>
    </Pressable>
  );
}
