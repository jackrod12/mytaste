// ============================================================
// My Taste — 상수 / 메타데이터
// ============================================================

import type { DrinkCategory, PaletteDefinition } from "@/types";

// ---------- 디자인 색상 (tailwind.config.js 와 동기화) ----------

export const COLORS = {
  bg: "#F5F4F0",
  card: "#FFFFFF",
  ink: "#1A1917",
  inkSoft: "#6B6862",
  inkFaint: "#A6A29A",
  line: "#E5E2DB",
  match: {
    high: "#0F6E56", // 90+
    mid: "#BA7517", // 70~89
    low: "#A32D2D", // <70
  },
} as const;

// ---------- 적합도 점수 ----------

export const MATCH_THRESHOLDS = {
  high: 90, // 이상 → 초록
  mid: 70, // 이상 → 주황, 미만 → 빨강
} as const;

/** 적합도 점수에 대응하는 색상 반환 */
export function matchColor(score: number): string {
  if (score >= MATCH_THRESHOLDS.high) return COLORS.match.high;
  if (score >= MATCH_THRESHOLDS.mid) return COLORS.match.mid;
  return COLORS.match.low;
}

// ---------- 카테고리 메타데이터 ----------

export interface CategoryMeta {
  key: DrinkCategory;
  label: string; // 한글
  labelEn: string;
  emoji: string;
  color: string; // 카테고리 대표 색
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "wine", label: "와인", labelEn: "Wine", emoji: "🍷", color: "#7B2D3A" },
  { key: "whisky", label: "위스키", labelEn: "Whisky", emoji: "🥃", color: "#A9682A" },
  { key: "beer", label: "맥주", labelEn: "Beer", emoji: "🍺", color: "#C99A2E" },
  { key: "sake", label: "사케", labelEn: "Sake", emoji: "🍶", color: "#6E8FA3" },
  { key: "makgeolli", label: "막걸리", labelEn: "Makgeolli", emoji: "🍶", color: "#B7AE97" },
  { key: "etc", label: "기타", labelEn: "Etc", emoji: "🍸", color: "#8A8A8A" },
];

export const CATEGORY_MAP: Record<DrinkCategory, CategoryMeta> =
  CATEGORIES.reduce(
    (acc, c) => {
      acc[c.key] = c;
      return acc;
    },
    {} as Record<DrinkCategory, CategoryMeta>,
  );

export function categoryLabel(key: DrinkCategory): string {
  return CATEGORY_MAP[key]?.label ?? key;
}

// ---------- 별점 ----------

export const SCORE_MIN = 1;
export const SCORE_MAX = 10;

// ---------- 빈티지 (와인) ----------

/** 2026 ~ 1970 + '알 수 없음'(null) */
export const VINTAGE_YEARS: number[] = Array.from(
  { length: 2026 - 1970 + 1 },
  (_, i) => 2026 - i,
);

// ---------- 테이스팅 팔레트 정의 (schema.sql 시드 미러) ----------
// id = `${category}_${item_key}` 로 로컬에서 안정적으로 식별.
// 스파클링 한정 항목은 id 충돌을 피해 접미사 부여.

function def(
  category: DrinkCategory,
  item_name: string,
  item_key: string,
  mode: "basic" | "advanced",
  display_order: number,
  pole_left: string,
  pole_right: string,
  sub_category: string | null = null,
  idOverride?: string,
): PaletteDefinition {
  return {
    id: idOverride ?? `${category}_${item_key}`,
    category,
    sub_category,
    item_name,
    item_key,
    mode,
    display_order,
    pole_left,
    pole_right,
  };
}

export const PALETTE_DEFINITIONS: PaletteDefinition[] = [
  // ---- 와인 기본 (6) ----
  def("wine", "산도", "acidity", "basic", 1, "낮음", "높음"),
  def("wine", "당도", "sweetness", "basic", 2, "드라이", "스위트"),
  def("wine", "바디감", "body", "basic", 3, "라이트", "풀바디"),
  def("wine", "타닌", "tannin", "basic", 4, "부드러움", "강한 타닌"),
  def("wine", "오크", "oak", "basic", 5, "없음", "강함"),
  def("wine", "과실향", "fruit", "basic", 6, "약함", "강함"),
  // ---- 와인 고급 (+6) ----
  def("wine", "꽃향", "floral", "advanced", 7, "약함", "강함"),
  def("wine", "미네랄", "mineral", "advanced", 8, "약함", "강함"),
  def("wine", "향신료", "spice", "advanced", 9, "약함", "강함"),
  def("wine", "피니시 길이", "finish_length", "advanced", 10, "짧음", "김"),
  def("wine", "피니시 복잡도", "finish_complexity", "advanced", 11, "단순", "복잡"),
  def("wine", "탁도", "clarity", "advanced", 12, "맑음", "탁함"),
  // ---- 와인 스파클링 한정 ----
  def("wine", "탄산감", "carbonation", "basic", 3, "약함", "강함", "sparkling", "wine_carbonation_sparkling"),

  // ---- 위스키 기본 (5) ----
  def("whisky", "피트·스모키", "peat", "basic", 1, "없음", "강함"),
  def("whisky", "달콤함", "sweetness", "basic", 2, "드라이", "스위트"),
  def("whisky", "스파이시", "spice", "basic", 3, "약함", "강함"),
  def("whisky", "바디감", "body", "basic", 4, "라이트", "풀바디"),
  def("whisky", "피니시", "finish", "basic", 5, "짧음", "길고 복잡"),
  // ---- 위스키 고급 (+5) ----
  def("whisky", "과실향", "fruit", "advanced", 6, "약함", "강함"),
  def("whisky", "오크", "oak", "advanced", 7, "약함", "강함"),
  def("whisky", "알코올 자극", "alcohol_heat", "advanced", 8, "부드러움", "강함"),
  def("whisky", "피니시 길이", "finish_length", "advanced", 9, "짧음", "김"),
  def("whisky", "피니시 복잡도", "finish_complexity", "advanced", 10, "단순", "복잡"),

  // ---- 맥주 기본 (5) ----
  def("beer", "쓴맛(IBU감)", "bitterness", "basic", 1, "약함", "강함"),
  def("beer", "탄산감", "carbonation", "basic", 2, "약함", "강함"),
  def("beer", "단맛", "sweetness", "basic", 3, "드라이", "스위트"),
  def("beer", "바디감", "body", "basic", 4, "라이트", "풀바디"),
  def("beer", "홉향", "hop_aroma", "basic", 5, "약함", "강함"),
  // ---- 맥주 고급 (+5) ----
  def("beer", "몰트향", "malt", "advanced", 6, "약함", "강함"),
  def("beer", "효모향", "yeast", "advanced", 7, "약함", "강함"),
  def("beer", "산도", "acidity", "advanced", 8, "낮음", "높음"),
  def("beer", "로스팅", "roast", "advanced", 9, "없음", "강함"),
  def("beer", "피니시", "finish", "advanced", 10, "짧음", "길고 복잡"),

  // ---- 사케 기본 (5) ----
  def("sake", "단맛", "sweetness", "basic", 1, "드라이", "스위트"),
  def("sake", "산도", "acidity", "basic", 2, "낮음", "높음"),
  def("sake", "바디감", "body", "basic", 3, "라이트", "풀바디"),
  def("sake", "감칠맛(우마미)", "umami", "basic", 4, "약함", "강함"),
  def("sake", "향 강도", "aroma", "basic", 5, "은은함", "진함"),
  // ---- 사케 고급 (+4) ----
  def("sake", "쌀향", "rice", "advanced", 6, "약함", "강함"),
  def("sake", "발효향", "ferment", "advanced", 7, "약함", "강함"),
  def("sake", "청량감", "freshness", "advanced", 8, "낮음", "높음"),
  def("sake", "피니시", "finish", "advanced", 9, "짧음", "길고 복잡"),

  // ---- 막걸리 기본 (5) ----
  def("makgeolli", "단맛", "sweetness", "basic", 1, "드라이", "스위트"),
  def("makgeolli", "산도", "acidity", "basic", 2, "낮음", "높음"),
  def("makgeolli", "탄산감", "carbonation", "basic", 3, "약함", "강함"),
  def("makgeolli", "바디감", "body", "basic", 4, "라이트", "풀바디"),
  def("makgeolli", "쌀향", "rice", "basic", 5, "약함", "강함"),
  // ---- 막걸리 고급 (+3) ----
  def("makgeolli", "발효향", "ferment", "advanced", 6, "약함", "강함"),
  def("makgeolli", "탁도", "clarity", "advanced", 7, "맑음", "탁함"),
  def("makgeolli", "피니시", "finish", "advanced", 8, "짧음", "길고 복잡"),
];

/** 특정 카테고리(+서브카테고리)의 팔레트 항목을 mode 필터해 반환 */
export function getPaletteDefs(
  category: DrinkCategory,
  opts?: { mode?: "basic" | "advanced"; subCategory?: string | null },
): PaletteDefinition[] {
  const sub = opts?.subCategory ?? null;
  return PALETTE_DEFINITIONS.filter((d) => {
    if (d.category !== category) return false;
    if (opts?.mode && d.mode !== opts.mode) return false;
    // sub_category 가 null 이면 전체 적용, 값이 있으면 일치할 때만
    if (d.sub_category && d.sub_category !== sub) return false;
    return true;
  }).sort((a, b) => a.display_order - b.display_order);
}

// ---------- 기본 모드 테이스팅 태그 (aroma / taste / finish) ----------
// record_tags 의 tag_value 후보. 카테고리별 향 + 공통 맛/피니시.

export const AROMA_TAGS: Record<DrinkCategory, string[]> = {
  wine: ["과실향", "꽃향", "오크/바닐라", "흙내음", "향신료", "베리류", "시트러스"],
  whisky: ["피트/스모키", "바닐라", "꿀", "건과일", "오크", "시트러스", "초콜릿"],
  beer: ["홉향", "몰트", "시트러스", "캐러멜", "커피/로스팅", "과일", "꽃향"],
  sake: ["쌀향", "꽃향", "과일향", "곡물", "흙내음", "허브"],
  makgeolli: ["쌀향", "누룩향", "과일향", "곡물", "단내"],
  etc: ["과일향", "꽃향", "허브", "향신료", "단내"],
};

export const TASTE_TAGS: string[] = [
  "상큼함",
  "달콤함",
  "쌉쌀함",
  "드라이함",
  "묵직함",
  "가벼움",
  "부드러움",
  "산뜻함",
  "진함",
];

export const FINISH_TAGS: string[] = [
  "깔끔한 피니시",
  "긴 여운",
  "짧은 피니시",
  "스파이시한 끝맛",
  "달콤한 여운",
  "쌉쌀한 끝맛",
];
