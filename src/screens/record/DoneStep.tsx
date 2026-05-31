import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Button, Card, DrinkName, Screen } from "@/components/ui";
import { COLORS } from "@/constants";
import type { Drink } from "@/types";

interface DoneStepProps {
  drink: Drink;
  /** AI 취향 분석 코멘트 (Phase 1: 로컬 생성) */
  comment: string;
  onRestart: () => void;
  onGoDashboard: () => void;
}

/** 6단계: 완료 — AI 취향 분석 업데이트 코멘트 */
export function DoneStep({
  drink,
  comment,
  onRestart,
  onGoDashboard,
}: DoneStepProps) {
  return (
    <Screen>
      <View className="items-center pt-12">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-ink">
          <Ionicons name="checkmark" size={44} color="#FFFFFF" />
        </View>
        <Text className="mt-5 text-[22px] font-extrabold text-ink">
          기록 완료!
        </Text>
        <Text className="mt-1 text-[14px] text-ink-faint">
          {drink.name_ko} 기록이 저장되었어요.
        </Text>
      </View>

      <Card className="mt-8">
        <View className="mb-2 flex-row items-center">
          <Ionicons name="sparkles" size={16} color={COLORS.ink} />
          <Text className="ml-1.5 text-[14px] font-bold text-ink">
            AI 취향 분석
          </Text>
        </View>
        <Text className="text-[15px] leading-6 text-ink-soft">{comment}</Text>
      </Card>

      <View className="mt-8 gap-3">
        <Button label="또 기록하기" onPress={onRestart} />
        <Button
          label="대시보드로"
          variant="secondary"
          onPress={onGoDashboard}
        />
      </View>
    </Screen>
  );
}
