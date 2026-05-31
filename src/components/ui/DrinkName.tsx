import { Text, View } from "react-native";

interface DrinkNameProps {
  nameKo: string;
  nameEn?: string | null;
  /** 'lg' 카드 헤더용, 'md' 리스트용 */
  size?: "lg" | "md";
}

/** 디자인 원칙: 제품명은 한글 크게, 영문 작게 아래 */
export function DrinkName({ nameKo, nameEn, size = "md" }: DrinkNameProps) {
  const koClass = size === "lg" ? "text-[22px]" : "text-[17px]";
  return (
    <View>
      <Text className={`font-bold text-ink ${koClass}`}>{nameKo}</Text>
      {nameEn ? (
        <Text className="mt-0.5 text-[13px] text-ink-faint">{nameEn}</Text>
      ) : null}
    </View>
  );
}
