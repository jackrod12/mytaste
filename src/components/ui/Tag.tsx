import { Text, View } from "react-native";

interface TagProps {
  label: string;
  /** 선택 가능한 칩으로 쓸 때 활성 상태 */
  active?: boolean;
  /** 커스텀 점 색상 (카테고리 색 등) */
  dotColor?: string;
}

/** 풍미/특성 태그 pill */
export function Tag({ label, active = false, dotColor }: TagProps) {
  return (
    <View
      className={`flex-row items-center self-start rounded-full border px-3 py-1.5 ${
        active ? "border-ink bg-ink" : "border-line bg-bg"
      }`}
    >
      {dotColor ? (
        <View
          className="mr-1.5 h-2 w-2 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      ) : null}
      <Text
        className={`text-[13px] ${active ? "text-white" : "text-ink-soft"}`}
      >
        {label}
      </Text>
    </View>
  );
}
