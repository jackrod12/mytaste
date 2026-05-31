import { ReactNode } from "react";
import { Text, View } from "react-native";

interface SectionTitleProps {
  title: string;
  /** 우측 액션 (예: 더보기) */
  right?: ReactNode;
  className?: string;
}

export function SectionTitle({ title, right, className = "" }: SectionTitleProps) {
  return (
    <View className={`mb-3 flex-row items-center justify-between ${className}`}>
      <Text className="text-[17px] font-bold text-ink">{title}</Text>
      {right}
    </View>
  );
}
