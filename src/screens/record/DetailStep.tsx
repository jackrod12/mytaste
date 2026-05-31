import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  Button,
  Card,
  DrinkName,
  Screen,
  SectionTitle,
  StepHeader,
  Tag,
} from "@/components/ui";
import { RadarChart } from "@/components/charts/RadarChart";
import { CATEGORY_MAP, categoryLabel } from "@/constants";
import { estimateDrinkRadar } from "@/lib/palette";
import type { StepProps } from "./types";

/** 3단계: 제품 상세 */
export function DetailStep({ draft, onNext, onBack }: StepProps) {
  const drink = draft.drink;
  if (!drink) return null;

  const meta = CATEGORY_MAP[drink.category];
  const vintage =
    draft.vintage ?? drink.vintage ?? null;
  const info = [
    drink.producer && { label: "생산자", value: drink.producer },
    drink.region && { label: "지역", value: drink.region },
    drink.country && { label: "나라", value: drink.country },
    vintage != null && { label: "빈티지", value: String(vintage) },
    drink.abv != null && { label: "도수", value: `${drink.abv}%` },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <Screen>
      <StepHeader title="제품 상세" step={3} total={6} onBack={onBack} />

      {/* 헤더 카드 */}
      <Card className="mb-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <DrinkName nameKo={drink.name_ko} nameEn={drink.name_en} size="lg" />
            <Text className="mt-1.5 text-[13px] text-ink-faint">
              {categoryLabel(drink.category)}
              {drink.sub_category ? ` · ${drink.sub_category}` : ""}
            </Text>
          </View>
          <Text className="text-3xl">{meta.emoji}</Text>
        </View>

        {/* Vivino 점수 */}
        {drink.vivino_score != null ? (
          <View className="mt-3 flex-row items-center">
            <Ionicons name="star" size={16} color="#E0A52B" />
            <Text className="ml-1 text-[15px] font-bold text-ink">
              {drink.vivino_score.toFixed(1)}
            </Text>
            {drink.vivino_count != null ? (
              <Text className="ml-1 text-[12px] text-ink-faint">
                Vivino · {drink.vivino_count.toLocaleString()}명 평가
              </Text>
            ) : null}
          </View>
        ) : null}

        {drink.description ? (
          <Text className="mt-3 text-[14px] leading-6 text-ink-soft">
            {drink.description}
          </Text>
        ) : null}
      </Card>

      {/* 풍미 태그 */}
      {drink.flavor_tags && drink.flavor_tags.length > 0 ? (
        <View className="mb-5">
          <SectionTitle title="풍미 태그" />
          <View className="flex-row flex-wrap gap-2">
            {drink.flavor_tags.map((t) => (
              <Tag key={t} label={t} />
            ))}
          </View>
        </View>
      ) : null}

      {/* 테이스팅 팔레트 레이더 */}
      <View className="mb-5">
        <SectionTitle title="테이스팅 팔레트" />
        <Card>
          <RadarChart axes={estimateDrinkRadar(drink)} color={meta.color} />
          <Text className="mt-1 text-center text-[11px] text-ink-faint">
            ※ Phase 1 추정값 — 실제 데이터로 교체 예정
          </Text>
        </Card>
      </View>

      {/* 자세히 알아보기 */}
      {info.length > 0 ? (
        <View className="mb-6">
          <SectionTitle title="자세히 알아보기" />
          <Card>
            {info.map((row, i) => (
              <View
                key={row.label}
                className={`flex-row justify-between py-2 ${
                  i < info.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <Text className="text-[14px] text-ink-faint">{row.label}</Text>
                <Text className="text-[14px] font-medium text-ink">
                  {row.value}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      <Button label="이 술로 기록하기" onPress={onNext} />
    </Screen>
  );
}
