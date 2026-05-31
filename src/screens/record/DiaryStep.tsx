import { Switch, Text, View } from "react-native";

import {
  Button,
  Card,
  Screen,
  StepHeader,
  TextField,
} from "@/components/ui";
import { COLORS } from "@/constants";
import type { StepProps } from "./types";

/** 5단계: 음용 기록 (날짜/장소/음식/동반자/한줄평) */
export function DiaryStep({ draft, update, onNext, onBack }: StepProps) {
  return (
    <Screen>
      <StepHeader title="음용 기록" step={5} total={6} onBack={onBack} />

      <TextField
        label="마신 날짜"
        value={draft.recorded_at}
        onChangeText={(v) => update({ recorded_at: v })}
        placeholder="YYYY-MM-DD"
      />
      <TextField
        label="장소"
        value={draft.location}
        onChangeText={(v) => update({ location: v })}
        placeholder="예: 집, 강남 와인바"
      />
      <TextField
        label="함께 먹은 음식"
        value={draft.food_pairing}
        onChangeText={(v) => update({ food_pairing: v })}
        placeholder="예: 스테이크, 치즈"
      />
      <TextField
        label="누구와"
        value={draft.companions}
        onChangeText={(v) => update({ companions: v })}
        placeholder="예: 혼자, 친구와"
      />
      <TextField
        label="한줄평"
        value={draft.one_liner}
        onChangeText={(v) => update({ one_liner: v })}
        placeholder="기억하고 싶은 한 줄"
        multiline
        maxLength={140}
      />

      {/* 공개 여부 */}
      <Card className="mb-6 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-[15px] font-semibold text-ink">한줄평 공개</Text>
          <Text className="mt-0.5 text-[12px] text-ink-faint">
            공개하면 추후 피드에 노출될 수 있어요.
          </Text>
        </View>
        <Switch
          value={draft.is_public}
          onValueChange={(v) => update({ is_public: v })}
          trackColor={{ false: COLORS.line, true: COLORS.ink }}
          thumbColor="#FFFFFF"
        />
      </Card>

      <Button label="기록 완료" onPress={onNext} />
    </Screen>
  );
}
