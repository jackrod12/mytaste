import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { COLORS, SCORE_MAX } from "@/constants";

interface StarRatingProps {
  /** 현재 점수 1~10 (0 = 미선택) */
  value: number;
  onChange: (value: number) => void;
}

/** 별점 1~10 선택기 */
export function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <View>
      <View className="flex-row justify-between">
        {Array.from({ length: SCORE_MAX }, (_, i) => {
          const n = i + 1;
          const filled = n <= value;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              hitSlop={4}
              className="active:opacity-60"
            >
              <Ionicons
                name={filled ? "star" : "star-outline"}
                size={26}
                color={filled ? "#E0A52B" : COLORS.line}
              />
            </Pressable>
          );
        })}
      </View>
      <Text className="mt-2 text-center text-[14px] font-semibold text-ink">
        {value > 0 ? `${value} / ${SCORE_MAX}점` : "별점을 선택하세요"}
      </Text>
    </View>
  );
}
