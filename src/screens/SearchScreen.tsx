import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  Card,
  Chip,
  DrinkName,
  EmptyState,
  Screen,
  ScoreBadge,
  Tag,
  TextField,
} from "@/components/ui";
import { CATEGORIES, CATEGORY_MAP, COLORS } from "@/constants";
import { useFocusData } from "@/hooks/useFocusData";
import { analyzeMatch } from "@/lib/match";
import {
  addDrink,
  addToWishlistWithAnalysis,
  getDrinks,
  getRecordsWithDrinks,
  getWishlist,
} from "@/lib/storage";
import type { Drink, DrinkCategory, RecordWithDrink } from "@/types";

const MATCH_GATE = 5; // 기록 5개 이상일 때만 적합도 표시

const ABV_RANGES: { key: string; label: string; test: (a: number | null | undefined) => boolean }[] = [
  { key: "all", label: "전체", test: () => true },
  { key: "low", label: "~10%", test: (a) => a != null && a < 10 },
  { key: "mid", label: "10~20%", test: (a) => a != null && a >= 10 && a < 20 },
  { key: "high", label: "20%+", test: (a) => a != null && a >= 20 },
];

interface SearchData {
  drinks: Drink[];
  rows: RecordWithDrink[];
  wishlistIds: string[];
}

async function loadSearch(): Promise<SearchData> {
  const [drinks, rows, wl] = await Promise.all([
    getDrinks(),
    getRecordsWithDrinks(),
    getWishlist(),
  ]);
  return { drinks, rows, wishlistIds: wl.map((w) => w.drink_id) };
}

type AddState = "idle" | "loading" | "added";

export function SearchScreen() {
  const { data, reload } = useFocusData(loadSearch);

  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState<DrinkCategory | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [abvKey, setAbvKey] = useState("all");
  const [addStates, setAddStates] = useState<Record<string, AddState>>({});

  const drinks = data?.drinks ?? [];
  const rows = data?.rows ?? [];
  const recordCount = rows.length;
  const showMatch = recordCount >= MATCH_GATE;

  // 위시리스트 담긴 항목 초기 표시
  useEffect(() => {
    if (!data) return;
    setAddStates((prev) => {
      const next = { ...prev };
      for (const id of data.wishlistIds) {
        if (next[id] !== "loading") next[id] = "added";
      }
      return next;
    });
  }, [data]);

  // 나라 필터 옵션
  const countries = useMemo(
    () => Array.from(new Set(drinks.map((d) => d.country).filter(Boolean))) as string[],
    [drinks],
  );

  // 필터링된 결과
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const abv = ABV_RANGES.find((r) => r.key === abvKey)!;
    return drinks.filter((d) => {
      if (catFilter && d.category !== catFilter) return false;
      if (countryFilter && d.country !== countryFilter) return false;
      if (!abv.test(d.abv)) return false;
      if (q) {
        const hay = [d.name_ko, d.name_en, d.producer, d.region, d.country]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [drinks, query, catFilter, countryFilter, abvKey]);

  // 적합도 점수 (게이트 통과 시)
  const scoreFor = useMemo(() => {
    const map: Record<string, number> = {};
    if (showMatch) {
      for (const d of results) map[d.id] = analyzeMatch(d, rows).score;
    }
    return map;
  }, [results, rows, showMatch]);

  const addToWishlist = async (drink: Drink) => {
    setAddStates((s) => ({ ...s, [drink.id]: "loading" }));
    await addToWishlistWithAnalysis(drink);
    setAddStates((s) => ({ ...s, [drink.id]: "added" }));
  };

  const handleDirectAdd = async () => {
    const name = query.trim();
    if (!name) return;
    await addDrink({
      name_ko: name,
      category: catFilter ?? "etc",
    });
    setQuery(name); // 결과에 노출되도록 유지
    reload();
  };

  return (
    <Screen scroll={false} padded={false}>
      <View className="px-5">
        <View className="mb-4 mt-2">
          <Text className="text-[13px] font-medium tracking-wide text-ink-faint">
            SEARCH
          </Text>
          <Text className="mt-0.5 text-[26px] font-extrabold text-ink">검색</Text>
        </View>

        {/* 검색창 + 라벨 스캔 */}
        <View className="flex-row items-end gap-2">
          <View className="flex-1">
            <TextField
              value={query}
              onChangeText={setQuery}
              placeholder="제품명을 한글로 검색"
            />
          </View>
          <View className="mb-4 h-[46px] w-[46px] items-center justify-center rounded-xl border border-line bg-card">
            <Ionicons name="scan-outline" size={22} color={COLORS.ink} />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pb-10"
      >
        {/* 필터: 카테고리 */}
        <FilterRow label="카테고리">
          <Chip
            label="전체"
            active={catFilter === null}
            onPress={() => setCatFilter(null)}
          />
          {CATEGORIES.map((c) => (
            <Chip
              key={c.key}
              label={`${c.emoji} ${c.label}`}
              active={catFilter === c.key}
              onPress={() => setCatFilter(c.key)}
            />
          ))}
        </FilterRow>

        {/* 필터: 나라 */}
        {countries.length > 0 ? (
          <FilterRow label="나라">
            <Chip
              label="전체"
              active={countryFilter === null}
              onPress={() => setCountryFilter(null)}
            />
            {countries.map((c) => (
              <Chip
                key={c}
                label={c}
                active={countryFilter === c}
                onPress={() => setCountryFilter(c)}
              />
            ))}
          </FilterRow>
        ) : null}

        {/* 필터: 도수 */}
        <FilterRow label="도수">
          {ABV_RANGES.map((r) => (
            <Chip
              key={r.key}
              label={r.label}
              active={abvKey === r.key}
              onPress={() => setAbvKey(r.key)}
            />
          ))}
        </FilterRow>

        {/* 적합도 안내 */}
        {!showMatch ? (
          <View className="mb-4 flex-row items-center rounded-xl bg-card px-3.5 py-2.5">
            <Ionicons name="information-circle-outline" size={16} color={COLORS.inkFaint} />
            <Text className="ml-1.5 text-[12px] text-ink-faint">
              기록 {MATCH_GATE}개 이상이면 검색 결과에 취향 적합도가 표시돼요. (현재 {recordCount}개)
            </Text>
          </View>
        ) : null}

        {/* 결과 */}
        <Text className="mb-3 text-[14px] font-semibold text-ink-soft">
          검색 결과 {results.length}
        </Text>

        {results.map((d) => (
          <ResultCard
            key={d.id}
            drink={d}
            score={showMatch ? scoreFor[d.id] : undefined}
            addState={addStates[d.id] ?? "idle"}
            onAdd={() => addToWishlist(d)}
          />
        ))}

        {/* 직접 추가하기 / 빈 결과 */}
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
          <EmptyState
            emoji="🔍"
            title="결과가 없어요"
            desc="검색어나 필터를 바꿔보세요."
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-[12px] font-semibold text-ink-faint">
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 pr-4"
      >
        {children}
      </ScrollView>
    </View>
  );
}

function ResultCard({
  drink,
  score,
  addState,
  onAdd,
}: {
  drink: Drink;
  score?: number;
  addState: AddState;
  onAdd: () => void;
}) {
  const meta = CATEGORY_MAP[drink.category];
  return (
    <Card className="mb-2.5">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <View className="flex-row items-center">
            <Text className="mr-1.5 text-lg">{meta.emoji}</Text>
            <View className="flex-1">
              <DrinkName nameKo={drink.name_ko} nameEn={drink.name_en} />
            </View>
          </View>
          {drink.producer || drink.region || drink.country ? (
            <Text className="mt-1.5 text-[12px] text-ink-faint">
              {[drink.producer, drink.region, drink.country]
                .filter(Boolean)
                .join(" · ")}
              {drink.abv != null ? ` · ${drink.abv}%` : ""}
            </Text>
          ) : null}
        </View>

        {/* 위시리스트 추가 버튼 */}
        <AddButton state={addState} onAdd={onAdd} />
      </View>

      {drink.flavor_tags && drink.flavor_tags.length > 0 ? (
        <View className="mt-2.5 flex-row flex-wrap gap-1.5">
          {drink.flavor_tags.slice(0, 3).map((t) => (
            <Tag key={t} label={t} />
          ))}
        </View>
      ) : null}

      {score != null ? (
        <View className="mt-3">
          <ScoreBadge score={score} />
        </View>
      ) : null}
    </Card>
  );
}

function AddButton({ state, onAdd }: { state: AddState; onAdd: () => void }) {
  if (state === "loading") {
    return (
      <View className="h-9 w-9 items-center justify-center">
        <ActivityIndicator size="small" color={COLORS.ink} />
      </View>
    );
  }
  const added = state === "added";
  return (
    <Pressable
      onPress={added ? undefined : onAdd}
      hitSlop={6}
      className={`h-9 w-9 items-center justify-center rounded-full border active:opacity-70 ${
        added ? "border-ink bg-ink" : "border-line bg-card"
      }`}
    >
      <Ionicons
        name={added ? "bookmark" : "bookmark-outline"}
        size={18}
        color={added ? "#FFFFFF" : COLORS.ink}
      />
    </Pressable>
  );
}
