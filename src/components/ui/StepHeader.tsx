import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/constants";

interface StepHeaderProps {
  title: string;
  step: number; // 1-based
  total: number;
  onBack?: () => void;
}

/** 기록 위저드 공통 헤더 — 뒤로가기 + 제목 + 진행 표시 */
export function StepHeader({ title, step, total, onBack }: StepHeaderProps) {
  return (
    <View className="mb-5 mt-2">
      <View className="flex-row items-center">
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={8} className="mr-2 active:opacity-60">
            <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
          </Pressable>
        ) : null}
        <Text className="text-[13px] font-semibold text-ink-faint">
          {step} / {total}
        </Text>
      </View>
      <Text className="mt-1 text-[24px] font-extrabold text-ink">{title}</Text>
      {/* 진행 바 */}
      <View className="mt-3 h-1.5 flex-row gap-1">
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            className="h-full flex-1 rounded-full"
            style={{ backgroundColor: i < step ? COLORS.ink : COLORS.line }}
          />
        ))}
      </View>
    </View>
  );
}
