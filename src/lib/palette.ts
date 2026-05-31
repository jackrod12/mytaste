// ============================================================
// 팔레트 값 ↔ 레이더 차트 변환 헬퍼
// Phase 1: 글로벌 drink_palette 데이터가 없으므로 술 id 기반
// 결정적(deterministic) 추정값을 생성해 레이더 차트를 채운다.
// (Phase 2+ 에서 실제 drink_palette 값으로 교체)
// ============================================================

import type { Drink, PaletteDefinition, RecordPaletteValue } from "@/types";
import { getPaletteDefs } from "@/constants";

export interface RadarAxis {
  key: string;
  label: string;
  value: number; // 0~1
}

/** 문자열 → 0~1 결정적 해시 */
function hash01(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // 0~1 정규화 (0.15~0.95 범위로 압축해 너무 0/1 에 붙지 않게)
  const n = ((h >>> 0) % 1000) / 1000;
  return 0.15 + n * 0.8;
}

/** 술의 객관적 팔레트(기본 항목) 추정값 → 레이더 축 */
export function estimateDrinkRadar(drink: Drink): RadarAxis[] {
  const defs = getPaletteDefs(drink.category, {
    mode: "basic",
    subCategory: drink.sub_category ?? null,
  });
  return defs.map((d) => ({
    key: d.item_key,
    label: d.item_name,
    value: hash01(`${drink.id}:${d.item_key}`),
  }));
}

/** 유저 기록 팔레트(1~5) → 레이더 축 (0~1 정규화) */
export function recordPaletteToRadar(
  defs: PaletteDefinition[],
  values: RecordPaletteValue[],
): RadarAxis[] {
  const valueMap = new Map(values.map((v) => [v.palette_definition_id, v.value]));
  return defs.map((d) => ({
    key: d.item_key,
    label: d.item_name,
    value: (valueMap.get(d.id) ?? 3) / 5, // 1~5 → 0.2~1.0
  }));
}
