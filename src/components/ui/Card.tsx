import { ReactNode } from "react";
import { Pressable, View } from "react-native";

interface CardProps {
  children: ReactNode;
  className?: string;
  onPress?: () => void;
}

/** 흰색 카드 컨테이너 (디자인 원칙: 카드 흰색, 부드러운 테두리) */
export function Card({ children, className = "", onPress }: CardProps) {
  const base = "bg-card rounded-2xl border border-line p-4";
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${base} active:opacity-80 ${className}`}
      >
        {children}
      </Pressable>
    );
  }
  return <View className={`${base} ${className}`}>{children}</View>;
}
