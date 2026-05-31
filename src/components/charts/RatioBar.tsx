import { Text, View } from "react-native";

interface RatioBarProps {
  label: string;
  emoji?: string;
  count: number;
  total: number;
  color: string;
}

/** 카테고리별 경험 횟수 + 비율 바 */
export function RatioBar({ label, emoji, count, total, color }: RatioBarProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <View className="mb-3">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="text-[14px] font-medium text-ink">
          {emoji ? `${emoji} ` : ""}
          {label}
        </Text>
        <Text className="text-[13px] text-ink-faint">
          {count}건 · {pct}%
        </Text>
      </View>
      <View className="h-2.5 overflow-hidden rounded-full bg-line">
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}
