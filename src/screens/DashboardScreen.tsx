import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import {
  Button,
  Card,
  DrinkName,
  Screen,
  SectionTitle,
  Tag,
} from "@/components/ui";
import { RatioBar } from "@/components/charts/RatioBar";
import { CATEGORY_MAP } from "@/constants";
import { useFocusData } from "@/hooks/useFocusData";
import {
  buildLocalProfiles,
  type LocalCategoryProfile,
} from "@/lib/insights";
import {
  getDashboardStats,
  getDrinks,
  getRecordsWithDrinks,
  incrementVisitCount,
} from "@/lib/storage";
import type {
  DashboardStats,
  Drink,
  RecordWithDrink,
} from "@/types";
import type { TabNavigation } from "@/types/navigation";

interface WeeklyPick {
  drink: Drink;
  reasons: { layer: string; emoji: string; text: string }[];
}

interface DashboardData {
  stats: DashboardStats;
  profiles: LocalCategoryProfile[];
  pick: WeeklyPick | null;
}

async function loadDashboard(): Promise<DashboardData> {
  const [stats, rows, drinks] = await Promise.all([
    getDashboardStats(),
    getRecordsWithDrinks(),
    getDrinks(),
  ]);
  const profiles = buildLocalProfiles(rows);
  return { stats, profiles, pick: buildWeeklyPick(rows, drinks, profiles) };
}

/** 이번 주 추천 (Phase 1 로컬 휴리스틱 샘플) — 취향/날씨/이벤트 3레이어 이유 */
function buildWeeklyPick(
  rows: RecordWithDrink[],
  drinks: Drink[],
  profiles: LocalCategoryProfile[],
): WeeklyPick | null {
  if (drinks.length === 0) return null;
  const recordedIds = new Set(rows.map((r) => r.drink.id));
  const topCat = profiles[0]?.category ?? "wine";

  // 아직 기록하지 않은 술 중, 선호 카테고리 우선 → 평점 높은 순
  const candidates = drinks
    .filter((d) => !recordedIds.has(d.id))
    .sort((a, b) => {
      const ca = a.category === topCat ? 0 : 1;
      const cb = b.category === topCat ? 0 : 1;
      if (ca !== cb) return ca - cb;
      return (b.vivino_score ?? 0) - (a.vivino_score ?? 0);
    });
  const drink = candidates[0] ?? drinks[0];
  const moodTag = profiles[0]?.tags[0]?.label;

  return {
    drink,
    reasons: [
      {
        layer: "날씨",
        emoji: "🌤️",
        text: "선선한 초여름 저녁, 가볍게 곁들이기 좋은 한 잔이에요.",
      },
      {
        layer: "취향 매칭",
        emoji: "🎯",
        text: moodTag
          ? `'${moodTag}' 풍미를 즐기는 취향과 잘 맞아요.`
          : "기록을 더 쌓으면 취향 매칭 정확도가 올라가요.",
      },
      {
        layer: "이벤트",
        emoji: "🏷️",
        text: `${drink.producer ?? "추천"} 시즌 추천 제품이에요.`,
      },
    ],
  };
}

export function DashboardScreen() {
  const navigation = useNavigation<TabNavigation>();
  const { data, reload } = useFocusData(loadDashboard);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  // 앱 진입 1회 접속 횟수 증가 후 갱신
  useEffect(() => {
    incrementVisitCount().then(reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = data?.stats;
  const profiles = data?.profiles ?? [];
  const totalRecords = stats?.totalRecords ?? 0;

  const activeCat =
    selectedCat ?? profiles[0]?.category ?? null;
  const activeProfile = profiles.find((p) => p.category === activeCat) ?? null;

  return (
    <Screen>
      {/* 헤더 */}
      <View className="mb-5 mt-2">
        <Text className="text-[13px] font-medium tracking-wide text-ink-faint">
          MY TASTE
        </Text>
        <Text className="mt-0.5 text-[26px] font-extrabold text-ink">
          나의 취향 대시보드
        </Text>
      </View>

      {/* 통계 3종 */}
      <View className="mb-6 flex-row gap-3">
        <StatCard label="총 기록" value={totalRecords} />
        <StatCard label="접속" value={stats?.visitCount ?? 0} />
        <StatCard label="위시리스트" value={stats?.wishlistCount ?? 0} />
      </View>

      {/* 액션 버튼 */}
      <View className="mb-7 flex-row gap-3">
        <View className="flex-1">
          <Button
            label="기록하기"
            leading="✍️"
            onPress={() => navigation.navigate("Record")}
          />
        </View>
        <View className="flex-1">
          <Button
            label="위시리스트"
            variant="secondary"
            onPress={() => navigation.navigate("Wishlist")}
          />
        </View>
        <View className="flex-1">
          <Button
            label="검색"
            variant="secondary"
            onPress={() => navigation.navigate("Search")}
          />
        </View>
      </View>

      {/* 취향 프로필 */}
      <View className="mb-7">
        <SectionTitle title="나의 취향 프로필" />
        {profiles.length === 0 ? (
          <Card>
            <Text className="text-[14px] leading-6 text-ink-soft">
              아직 기록이 없어요. 첫 술을 기록하면 카테고리별 취향 프로필이
              만들어집니다. 기록이 쌓일수록 분석이 정교해져요.
            </Text>
          </Card>
        ) : (
          <>
            {/* 카테고리 탭 */}
            <View className="mb-3 flex-row flex-wrap gap-2">
              {profiles.map((p) => {
                const meta = CATEGORY_MAP[p.category];
                const isActive = p.category === activeCat;
                return (
                  <Text
                    key={p.category}
                    onPress={() => setSelectedCat(p.category)}
                    className={`overflow-hidden rounded-full px-3.5 py-2 text-[13px] font-semibold ${
                      isActive
                        ? "bg-ink text-white"
                        : "bg-card text-ink-soft"
                    }`}
                  >
                    {meta.emoji} {meta.label}
                  </Text>
                );
              })}
            </View>
            {activeProfile ? (
              <Card>
                <Text className="text-[15px] leading-6 text-ink">
                  {activeProfile.summaryText}
                </Text>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {activeProfile.tags.map((t) => (
                    <Tag key={t.label} label={t.label} dotColor={t.color} />
                  ))}
                </View>
              </Card>
            ) : null}
          </>
        )}
      </View>

      {/* 카테고리별 경험 */}
      {stats && stats.byCategory.length > 0 ? (
        <View className="mb-7">
          <SectionTitle title="카테고리별 경험" />
          <Card>
            {stats.byCategory.map((c) => {
              const meta = CATEGORY_MAP[c.category];
              return (
                <RatioBar
                  key={c.category}
                  label={meta.label}
                  emoji={meta.emoji}
                  count={c.count}
                  total={totalRecords}
                  color={meta.color}
                />
              );
            })}
          </Card>
        </View>
      ) : null}

      {/* 이번 주 추천 */}
      {data?.pick ? (
        <View className="mb-2">
          <SectionTitle title="이번 주 추천" />
          <Card>
            <View className="mb-3 flex-row items-center justify-between">
              <DrinkName
                nameKo={data.pick.drink.name_ko}
                nameEn={data.pick.drink.name_en}
              />
              <Text className="text-2xl">
                {CATEGORY_MAP[data.pick.drink.category].emoji}
              </Text>
            </View>
            <View className="gap-2.5">
              {data.pick.reasons.map((r) => (
                <View key={r.layer} className="flex-row">
                  <Text className="mr-2 text-[15px]">{r.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-[12px] font-semibold text-ink-faint">
                      {r.layer}
                    </Text>
                    <Text className="text-[14px] leading-5 text-ink-soft">
                      {r.text}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            <Text className="mt-3 text-[11px] text-ink-faint">
              ※ Phase 1 샘플 추천 — 추후 날씨·AI 분석으로 고도화됩니다.
            </Text>
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 items-center rounded-2xl border border-line bg-card py-4">
      <Text className="text-[24px] font-extrabold text-ink">{value}</Text>
      <Text className="mt-1 text-[12px] text-ink-faint">{label}</Text>
    </View>
  );
}
