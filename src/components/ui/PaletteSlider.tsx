import { Text, View } from "react-native";
import Slider from "@react-native-community/slider";

import { COLORS } from "@/constants";

interface PaletteSliderProps {
  itemName: string;
  poleLeft?: string | null;
  poleRight?: string | null;
  /** 1~5 */
  value: number;
  onChange: (value: number) => void;
}

/** 테이스팅 팔레트 슬라이더 (1~5 정수) */
export function PaletteSlider({
  itemName,
  poleLeft,
  poleRight,
  value,
  onChange,
}: PaletteSliderProps) {
  return (
    <View className="mb-4">
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-[14px] font-semibold text-ink">{itemName}</Text>
        <Text className="text-[13px] font-bold text-ink">{value}</Text>
      </View>
      <Slider
        minimumValue={1}
        maximumValue={5}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={COLORS.ink}
        maximumTrackTintColor={COLORS.line}
        thumbTintColor={COLORS.ink}
      />
      <View className="flex-row justify-between">
        <Text className="text-[11px] text-ink-faint">{poleLeft ?? ""}</Text>
        <Text className="text-[11px] text-ink-faint">{poleRight ?? ""}</Text>
      </View>
    </View>
  );
}
