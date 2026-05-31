import { Pressable, Text } from "react-native";

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

/** 선택 가능한 칩 (태그 다중 선택 등) */
export function Chip({ label, active = false, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`self-start rounded-full border px-3.5 py-2 active:opacity-70 ${
        active ? "border-ink bg-ink" : "border-line bg-card"
      }`}
    >
      <Text
        className={`text-[13px] font-medium ${
          active ? "text-white" : "text-ink-soft"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
