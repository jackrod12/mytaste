import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  Card,
  DrinkName,
  Screen,
  StepHeader,
  TextField,
} from "@/components/ui";
import { COLORS, VINTAGE_YEARS } from "@/constants";
import { addDrink, searchDrinks } from "@/lib/storage";
import type { Drink } from "@/types";
import type { StepProps } from "./types";

/** 2단계: 제품 검색 (+ 와인 빈티지 선택, 라벨 스캔 UI, 직접 추가) */
export function SearchStep({ draft, update, onNext, onBack }: StepProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Drink[]>([]);
  const isWine = draft.category === "wine";

  useEffect(() => {
    let active = true;
    if (!draft.category) return;
    searchDrinks(query, { category: draft.category }).then((r) => {
      if (active) setResults(r);
    });
    return () => {
      active = false;
    };
  }, [query, draft.category]);

  const select = (drink: Drink) => {
    update({ drink });
    onNext();
  };

  const handleDirectAdd = async () => {
    const name = query.trim();
    if (!name || !draft.category) return;
    const drink = await addDrink({
      name_ko: name,
      category: draft.category,
      vintage: isWine ? draft.vintage : null,
    });
    select(drink);
  };

  return (
    <Screen>
      <StepHeader title="제품 검색" step={2} total={6} onBack={onBack} />

      {/* 검색 입력 + 라벨 스캔 */}
      <View className="mb-3 flex-row items-end gap-2">
        <View className="flex-1">
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder="제품명을 한글로 검색"
          />
        </View>
        <Pressable
          onPress={() =>
            Alert.alert("라벨 스캔", "라벨 스캔(Google Vision)은 추후 연동됩니다.")
          }
          className="mb-4 h-[46px] w-[46px] items-center justify-center rounded-xl border border-line bg-card active:opacity-70"
        >
          <Ionicons name="scan-outline" size={22} color={COLORS.ink} />
        </Pressable>
      </View>

      {/* 와인 빈티지 선택 */}
      {isWine ? (
        <View className="mb-4">
          <Text className="mb-1.5 text-[13px] font-semibold text-ink-soft">
            빈티지
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 pr-2"
          >
            <VintageChip
              label="알 수 없음"
              active={draft.vintage === null}
              onPress={() => update({ vintage: null })}
            />
            {VINTAGE_YEARS.map((y) => (
              <VintageChip
                key={y}
                label={String(y)}
                active={draft.vintage === y}
                onPress={() => update({ vintage: y })}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* 결과 목록 */}
      {results.map((d) => (
        <Card key={d.id} className="mb-2.5" onPress={() => select(d)}>
          <View className="flex-row items-center justify-between">
            <DrinkName nameKo={d.name_ko} nameEn={d.name_en} />
            <Ionicons name="chevron-forward" size={20} color={COLORS.inkFaint} />
          </View>
          {d.producer || d.region ? (
            <Text className="mt-1 text-[12px] text-ink-faint">
              {[d.producer, d.region, d.country].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
        </Card>
      ))}

      {/* 직접 추가하기 */}
      {query.trim().length > 0 ? (
        <Pressable
          onPress={handleDirectAdd}
          className="mt-2 flex-row items-center justify-center rounded-xl border border-dashed border-ink-faint py-4 active:opacity-70"
        >
          <Ionicons name="add" size={20} color={COLORS.ink} />
          <Text className="ml-1 text-[15px] font-semibold text-ink">
            '{query.trim()}' 직접 추가하기
          </Text>
        </Pressable>
      ) : results.length === 0 ? (
        <Text className="mt-6 text-center text-[14px] text-ink-faint">
          검색어를 입력하거나 목록에서 선택하세요.
        </Text>
      ) : null}
    </Screen>
  );
}

function VintageChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-4 py-2 active:opacity-70 ${
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
