import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  Button,
  Card,
  DrinkName,
  Screen,
  ScoreBadge,
  SectionTitle,
  Tag,
} from "@/components/ui";
import { CATEGORY_MAP, COLORS, matchColor } from "@/constants";
import { addToWishlistWithAnalysis, getDrinks, removeFromWishlist } from "@/lib/storage";
import type { Drink, WishlistItem, WishlistWithDrink } from "@/types";

interface Props {
  row: WishlistWithDrink;
  onBack: () => void;
  onRemoved: () => void;
  onRecord: (drink: Drink) => void;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function WishlistDetail({ row, onBack, onRemoved, onRecord }: Props) {
  const { drink } = row;
  const meta = CATEGORY_MAP[drink.category];
  const [item, setItem] = useState<WishlistItem>(row.item);
  const [analyzing, setAnalyzing] = useState(item.match_score == null);
  const [similar, setSimilar] = useState<Drink[]>([]);

  // 분석값이 없으면 AI(로컬) 분석 실행 (로딩 표시)
  useEffect(() => {
    if (item.match_score != null) return;
    let active = true;
    setAnalyzing(true);
    (async () => {
      await delay(900); // 분석 로딩 연출
      const updated = await addToWishlistWithAnalysis(drink);
      if (active) {
        setItem(updated);
        setAnalyzing(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 비슷한 대안
  useEffect(() => {
    let active = true;
    getDrinks().then((all) => {
      if (!active) return;
      setSimilar(
        all
          .filter((d) => d.category === drink.category && d.id !== drink.id)
          .sort((a, b) => (b.vivino_score ?? 0) - (a.vivino_score ?? 0))
          .slice(0, 6),
      );
    });
    return () => {
      active = false;
    };
  }, [drink.id, drink.category]);

  const remove = async () => {
    await removeFromWishlist(drink.id);
    onRemoved();
  };

  const positives = item.match_analysis?.filter((a) => a.type === "positive") ?? [];
  const concerns = item.match_analysis?.filter((a) => a.type === "concern") ?? [];

  return (
    <Screen>
      {/* 헤더 */}
      <View className="mb-4 mt-2 flex-row items-center">
        <Pressable onPress={onBack} hitSlop={8} className="mr-2 active:opacity-60">
          <Ionicons name="chevron-back" size={26} color={COLORS.ink} />
        </Pressable>
        <Text className="text-[13px] font-semibold text-ink-faint">위시리스트</Text>
      </View>

      {/* 제품 헤더 */}
      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <DrinkName nameKo={drink.name_ko} nameEn={drink.name_en} size="lg" />
          <Text className="mt-1.5 text-[13px] text-ink-faint">
            {meta.label}
            {drink.sub_category ? ` · ${drink.sub_category}` : ""}
          </Text>
        </View>
        <Text className="text-3xl">{meta.emoji}</Text>
      </View>

      {/* 풍미 태그 */}
      {drink.flavor_tags && drink.flavor_tags.length > 0 ? (
        <View className="mb-5 flex-row flex-wrap gap-2">
          {drink.flavor_tags.map((t) => (
            <Tag key={t} label={t} />
          ))}
        </View>
      ) : null}

      {/* AI 적합도 */}
      <View className="mb-6">
        <SectionTitle title="AI 적합도 분석" />
        {analyzing ? (
          <Card className="items-center py-8">
            <ActivityIndicator color={COLORS.ink} />
            <Text className="mt-3 text-[14px] text-ink-soft">
              AI가 내 취향과 얼마나 맞는지 분석하고 있어요…
            </Text>
          </Card>
        ) : (
          <Card>
            <ScoreRing score={item.match_score ?? 0} />
            <View className="mt-4 gap-3">
              {positives.map((a, i) => (
                <ReasonRow key={`p-${i}`} item={a} />
              ))}
              {concerns.map((a, i) => (
                <ReasonRow key={`c-${i}`} item={a} />
              ))}
            </View>
          </Card>
        )}
      </View>

      {/* 음식 페어링 */}
      {item.pairing_suggestions && item.pairing_suggestions.length > 0 ? (
        <View className="mb-6">
          <SectionTitle title="음식 페어링" />
          <View className="flex-row flex-wrap justify-between">
            {item.pairing_suggestions.map((p) => (
              <Card key={p.name} className="mb-3 w-[48%] flex-row items-center">
                <Text className="mr-2 text-2xl">{p.emoji}</Text>
                <View className="flex-1">
                  <Text className="text-[14px] font-semibold text-ink">
                    {p.name}
                  </Text>
                  {p.note ? (
                    <Text className="text-[11px] leading-4 text-ink-faint">
                      {p.note}
                    </Text>
                  ) : null}
                </View>
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {/* 비슷한 대안 */}
      {similar.length > 0 ? (
        <View className="mb-6">
          <SectionTitle title="비슷한 대안" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3 pr-4"
          >
            {similar.map((d) => (
              <Card key={d.id} className="w-44">
                <Text className="text-xl">{CATEGORY_MAP[d.category].emoji}</Text>
                <Text className="mt-1.5 text-[14px] font-bold text-ink" numberOfLines={1}>
                  {d.name_ko}
                </Text>
                {d.name_en ? (
                  <Text className="text-[11px] text-ink-faint" numberOfLines={1}>
                    {d.name_en}
                  </Text>
                ) : null}
                {d.vivino_score != null ? (
                  <View className="mt-2 flex-row items-center">
                    <Ionicons name="star" size={12} color="#E0A52B" />
                    <Text className="ml-1 text-[12px] text-ink-soft">
                      {d.vivino_score.toFixed(1)}
                    </Text>
                  </View>
                ) : null}
              </Card>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* 액션 */}
      <View className="gap-3">
        <Button
          label="마셨어요 — 기록하기"
          leading="🍷"
          onPress={() => onRecord(drink)}
        />
        <Pressable
          onPress={remove}
          className="items-center py-3 active:opacity-60"
        >
          <Text className="text-[14px] font-semibold text-match-low">
            위시리스트에서 제거
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = matchColor(score);
  const label = score >= 90 ? "아주 잘 맞아요" : score >= 70 ? "잘 맞는 편이에요" : "취향과 거리가 있어요";
  return (
    <View className="flex-row items-center">
      <View
        className="h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}1A` }}
      >
        <Text className="text-[22px] font-extrabold" style={{ color }}>
          {score}
        </Text>
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-[16px] font-bold" style={{ color }}>
          {label}
        </Text>
        <Text className="mt-0.5 text-[12px] text-ink-faint">
          적합도 점수 (100점 만점)
        </Text>
      </View>
    </View>
  );
}

function ReasonRow({
  item,
}: {
  item: { type: "positive" | "concern"; title: string; desc: string };
}) {
  const positive = item.type === "positive";
  return (
    <View className="flex-row">
      <Ionicons
        name={positive ? "checkmark-circle" : "alert-circle"}
        size={18}
        color={positive ? COLORS.match.high : COLORS.match.mid}
      />
      <View className="ml-2 flex-1">
        <Text className="text-[14px] font-semibold text-ink">{item.title}</Text>
        <Text className="mt-0.5 text-[13px] leading-5 text-ink-soft">
          {item.desc}
        </Text>
      </View>
    </View>
  );
}
