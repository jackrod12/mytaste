import { Text, View } from "react-native";

import { matchColor } from "@/constants";

interface ScoreBadgeProps {
  /** 0~100 적합도 점수 */
  score: number;
  size?: "sm" | "lg";
}

/** AI 적합도 점수 배지. 90+ 초록 / 70~89 주황 / 70 미만 빨강 */
export function ScoreBadge({ score, size = "sm" }: ScoreBadgeProps) {
  const color = matchColor(score);
  const isLg = size === "lg";
  return (
    <View
      className={`flex-row items-baseline self-start rounded-full ${
        isLg ? "px-3.5 py-1.5" : "px-2.5 py-1"
      }`}
      style={{ backgroundColor: `${color}1A` }} // 10% 투명 배경
    >
      <Text
        className={`font-extrabold ${isLg ? "text-[20px]" : "text-[14px]"}`}
        style={{ color }}
      >
        {score}
      </Text>
      <Text
        className={`ml-0.5 font-semibold ${isLg ? "text-[12px]" : "text-[10px]"}`}
        style={{ color }}
      >
        적합
      </Text>
    </View>
  );
}
