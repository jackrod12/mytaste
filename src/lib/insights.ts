// ============================================================
// 로컬 취향 인사이트 — Phase 1 에서는 AI 대신 기록 기반 휴리스틱으로
// 카테고리별 간단 취향 프로필을 생성한다.
// (Phase 2+ 에서 user_taste_profile + Claude API 로 대체)
// ============================================================

import type { DrinkCategory, RecordWithDrink, TasteTag } from "@/types";
import { categoryLabel } from "@/constants";

const TAG_COLORS = ["#7B2D3A", "#A9682A", "#C99A2E", "#6E8FA3", "#5B7B5E"];

export interface LocalCategoryProfile {
  category: DrinkCategory;
  count: number;
  avgScore: number; // 1~10
  summaryText: string;
  tags: TasteTag[];
}

/** 카테고리별 로컬 취향 프로필 계산 (기록 있는 카테고리만) */
export function buildLocalProfiles(
  rows: RecordWithDrink[],
): LocalCategoryProfile[] {
  const byCat = new Map<DrinkCategory, RecordWithDrink[]>();
  for (const row of rows) {
    const cat = row.drink.category;
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat)!.push(row);
  }

  const profiles: LocalCategoryProfile[] = [];
  for (const [category, items] of byCat) {
    const count = items.length;
    const avgScore =
      items.reduce((sum, i) => sum + i.record.score, 0) / count;

    // 태그 빈도 집계 (기본 모드 record_tags + 술의 flavor_tags)
    const freq = new Map<string, number>();
    for (const { record, drink } of items) {
      for (const t of record.tags) {
        freq.set(t.tag_value, (freq.get(t.tag_value) ?? 0) + 2); // 내 기록 가중치 ↑
      }
      for (const t of drink.flavor_tags ?? []) {
        freq.set(t, (freq.get(t) ?? 0) + 1);
      }
    }
    const topTags = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label], idx) => ({ label, color: TAG_COLORS[idx % TAG_COLORS.length] }));

    profiles.push({
      category,
      count,
      avgScore,
      summaryText: summarize(category, count, avgScore, topTags),
      tags: topTags,
    });
  }

  // 기록 많은 순
  return profiles.sort((a, b) => b.count - a.count);
}

function summarize(
  category: DrinkCategory,
  count: number,
  avgScore: number,
  tags: TasteTag[],
): string {
  const label = categoryLabel(category);
  const moodTag = tags[0]?.label;
  const score = avgScore.toFixed(1);
  if (moodTag) {
    return `${label} ${count}건 기록 · 평균 ${score}점. 특히 '${moodTag}' 풍미를 자주 즐겨요.`;
  }
  return `${label} ${count}건 기록 · 평균 ${score}점.`;
}
