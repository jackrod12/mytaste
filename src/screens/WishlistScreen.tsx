import { useState } from "react";
import { Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import {
  Card,
  DrinkName,
  EmptyState,
  Screen,
  ScoreBadge,
  SectionTitle,
  Tag,
} from "@/components/ui";
import { CATEGORY_MAP } from "@/constants";
import { useFocusData } from "@/hooks/useFocusData";
import { setPendingRecordDrink } from "@/lib/handoff";
import { getWishlistWithDrinks } from "@/lib/storage";
import type { Drink, WishlistWithDrink } from "@/types";
import type { TabNavigation } from "@/types/navigation";

import { WishlistDetail } from "./wishlist/WishlistDetail";

export function WishlistScreen() {
  const navigation = useNavigation<TabNavigation>();
  const { data, reload } = useFocusData(getWishlistWithDrinks);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = data ?? [];
  const selected = rows.find((r) => r.item.id === selectedId) ?? null;

  if (selected) {
    return (
      <WishlistDetail
        row={selected}
        onBack={() => {
          setSelectedId(null);
          reload();
        }}
        onRemoved={() => {
          setSelectedId(null);
          reload();
        }}
        onRecord={(drink: Drink) => {
          setPendingRecordDrink(drink);
          setSelectedId(null);
          navigation.navigate("Record");
        }}
      />
    );
  }

  return (
    <Screen>
      <View className="mb-5 mt-2">
        <Text className="text-[13px] font-medium tracking-wide text-ink-faint">
          WISHLIST
        </Text>
        <Text className="mt-0.5 text-[26px] font-extrabold text-ink">
          위시리스트
        </Text>
      </View>

      {rows.length === 0 ? (
        <EmptyState
          emoji="📌"
          title="아직 담아둔 술이 없어요"
          desc="검색에서 마음에 드는 술을 위시리스트에 추가하면 AI 적합도가 분석돼요."
        />
      ) : (
        <>
          <SectionTitle title={`담아둔 술 ${rows.length}`} />
          {rows.map((row) => (
            <WishlistRow
              key={row.item.id}
              row={row}
              onPress={() => setSelectedId(row.item.id)}
            />
          ))}
        </>
      )}
    </Screen>
  );
}

function WishlistRow({
  row,
  onPress,
}: {
  row: WishlistWithDrink;
  onPress: () => void;
}) {
  const { item, drink } = row;
  const meta = CATEGORY_MAP[drink.category];
  return (
    <Card className="mb-2.5" onPress={onPress}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <DrinkName nameKo={drink.name_ko} nameEn={drink.name_en} />
        </View>
        <Text className="text-2xl">{meta.emoji}</Text>
      </View>

      {drink.flavor_tags && drink.flavor_tags.length > 0 ? (
        <View className="mt-2.5 flex-row flex-wrap gap-1.5">
          {drink.flavor_tags.slice(0, 3).map((t) => (
            <Tag key={t} label={t} />
          ))}
        </View>
      ) : null}

      <View className="mt-3">
        {item.match_score != null ? (
          <ScoreBadge score={item.match_score} />
        ) : (
          <Text className="text-[12px] font-medium text-ink-faint">
            적합도 분석 대기 중 · 눌러서 분석하기
          </Text>
        )}
      </View>
    </Card>
  );
}
