import { Pressable, Text, View } from "react-native";

import { Screen, StepHeader } from "@/components/ui";
import { CATEGORIES } from "@/constants";
import type { StepProps } from "./types";

/** 1단계: 카테고리 선택 */
export function CategoryStep({ draft, update, onNext }: StepProps) {
  return (
    <Screen>
      <StepHeader title="무엇을 마셨나요?" step={1} total={6} />
      <View className="flex-row flex-wrap justify-between">
        {CATEGORIES.map((c) => {
          const active = draft.category === c.key;
          return (
            <Pressable
              key={c.key}
              onPress={() => {
                update({ category: c.key });
                onNext();
              }}
              className={`mb-3 w-[48%] items-center rounded-2xl border py-7 active:opacity-80 ${
                active ? "border-ink bg-ink" : "border-line bg-card"
              }`}
            >
              <Text className="text-4xl">{c.emoji}</Text>
              <Text
                className={`mt-2 text-[16px] font-bold ${
                  active ? "text-white" : "text-ink"
                }`}
              >
                {c.label}
              </Text>
              <Text
                className={`text-[12px] ${
                  active ? "text-white/70" : "text-ink-faint"
                }`}
              >
                {c.labelEn}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
