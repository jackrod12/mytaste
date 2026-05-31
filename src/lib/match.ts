// ============================================================
// 위시리스트 적합도 분석 — Phase 1 로컬 휴리스틱.
// 유저의 기록(취향 프로필)과 술의 객관 정보를 비교해
// 0~100 적합도 점수 + 긍정/걱정 이유 + 음식 페어링을 생성한다.
// (Phase 2+ 에서 Claude API 호출로 교체)
// ============================================================

import type {
  Drink,
  DrinkCategory,
  MatchAnalysisItem,
  PairingSuggestion,
  RecordWithDrink,
} from "@/types";
import { categoryLabel } from "@/constants";
import { buildLocalProfiles } from "@/lib/insights";

export interface MatchResult {
  score: number; // 0~100
  analysis: MatchAnalysisItem[];
  pairings: PairingSuggestion[];
}

// ---------- 음식 페어링 (카테고리별 4종) ----------

const PAIRINGS: Record<DrinkCategory, PairingSuggestion[]> = {
  wine: [
    { emoji: "🧀", name: "치즈 플래터", note: "숙성 치즈와 특히 잘 어울려요" },
    { emoji: "🥩", name: "스테이크", note: "레드와인의 타닌과 환상 궁합" },
    { emoji: "🍫", name: "다크 초콜릿", note: "풍미를 한층 깊게" },
    { emoji: "🍝", name: "토마토 파스타", note: "산미가 서로를 살려줘요" },
  ],
  whisky: [
    { emoji: "🍫", name: "다크 초콜릿", note: "달콤쌉쌀함이 어우러져요" },
    { emoji: "🧀", name: "블루치즈", note: "강한 풍미끼리의 대비" },
    { emoji: "🥜", name: "견과류", note: "고소함이 오크향을 보완" },
    { emoji: "🍯", name: "말린 과일", note: "셰리 캐스크와 잘 맞아요" },
  ],
  beer: [
    { emoji: "🍗", name: "프라이드치킨", note: "탄산이 기름기를 씻어줘요" },
    { emoji: "🍕", name: "피자", note: "홉의 쌉쌀함과 균형" },
    { emoji: "🌭", name: "소시지", note: "정통 페어링" },
    { emoji: "🧀", name: "체다치즈", note: "몰트의 단맛과 조화" },
  ],
  sake: [
    { emoji: "🍣", name: "사시미", note: "깔끔한 산미가 비린맛을 잡아줘요" },
    { emoji: "🍤", name: "덴푸라", note: "기름기를 산뜻하게" },
    { emoji: "🫛", name: "에다마메", note: "가벼운 안주로 제격" },
    { emoji: "🍲", name: "나베", note: "감칠맛끼리의 시너지" },
  ],
  makgeolli: [
    { emoji: "🥘", name: "해물파전", note: "막걸리엔 역시 파전" },
    { emoji: "🌶️", name: "김치전", note: "매콤함을 부드럽게" },
    { emoji: "🍢", name: "어묵탕", note: "따뜻한 국물과 잘 맞아요" },
    { emoji: "🧈", name: "두부김치", note: "고소함과 산미의 조화" },
  ],
  etc: [
    { emoji: "🧀", name: "치즈", note: "대부분의 술과 무난해요" },
    { emoji: "🥜", name: "견과류", note: "고소한 안주" },
    { emoji: "🍫", name: "초콜릿", note: "달콤한 마무리" },
    { emoji: "🍓", name: "제철 과일", note: "산뜻한 곁들임" },
  ],
};

// ---------- 강한 풍미 키워드 (걱정 요인 후보) ----------

const STRONG_FLAVORS = ["피트", "스모키", "타닌", "강한", "쓴맛"];

/**
 * 적합도 분석 생성.
 * @param drink  분석 대상 술
 * @param rows   유저의 전체 기록(+술)
 */
export function analyzeMatch(drink: Drink, rows: RecordWithDrink[]): MatchResult {
  const label = categoryLabel(drink.category);
  const profiles = buildLocalProfiles(rows);
  const profile = profiles.find((p) => p.category === drink.category);
  const userTopTags = new Set(
    profiles.flatMap((p) => p.tags.map((t) => t.label)),
  );

  // 풍미 겹침
  const matchedTags = (drink.flavor_tags ?? []).filter((t) =>
    [...userTopTags].some((u) => u.includes(t) || t.includes(u)),
  );

  // ---------- 점수 ----------
  let score = 58;
  if (profile) score += 14; // 익숙한 카테고리
  score += Math.min(matchedTags.length, 3) * 7; // 풍미 매칭
  if (drink.vivino_score != null) score += (drink.vivino_score - 4) * 12; // 평단
  if (profile && profile.avgScore >= 7) score += 5; // 해당 카테고리 만족도 높음
  if (!profile) score -= 6; // 데이터 부족
  if ((drink.abv ?? 0) >= 40) score -= 4; // 고도수
  // 술별 안정적 미세 변동 (-3~+3)
  score += hashJitter(drink.id);
  score = Math.max(35, Math.min(98, Math.round(score)));

  // ---------- 이유 풀 ----------
  const positives: MatchAnalysisItem[] = [];
  const concerns: MatchAnalysisItem[] = [];

  if (profile) {
    positives.push({
      type: "positive",
      title: "익숙한 카테고리",
      desc: `${label}를 ${profile.count}번 기록한, 평소 즐기는 카테고리예요.`,
    });
  }
  for (const t of matchedTags.slice(0, 2)) {
    positives.push({
      type: "positive",
      title: `'${t}' 풍미 선호`,
      desc: `평소 '${t}' 계열 풍미를 즐기는 취향과 잘 맞아요.`,
    });
  }
  if (drink.vivino_score != null && drink.vivino_score >= 4.2) {
    positives.push({
      type: "positive",
      title: "평단의 호평",
      desc: `Vivino ${drink.vivino_score.toFixed(1)}점${
        drink.vivino_count ? ` (${drink.vivino_count.toLocaleString()}명)` : ""
      }으로 검증된 인기 제품이에요.`,
    });
  }
  if (profile && profile.avgScore >= 7) {
    positives.push({
      type: "positive",
      title: "높은 만족도 이력",
      desc: `${label} 평균 별점이 ${profile.avgScore.toFixed(1)}점으로 만족도가 높았어요.`,
    });
  }
  // 보강용 일반 긍정
  positives.push(
    {
      type: "positive",
      title: "균형 잡힌 프로필",
      desc: `${label} 특유의 균형 잡힌 풍미가 무난하게 어울릴 가능성이 높아요.`,
    },
    {
      type: "positive",
      title: "새로운 탐색",
      desc: "취향의 폭을 넓혀줄 만한 흥미로운 선택지예요.",
    },
  );

  // 걱정
  if (!profile) {
    concerns.push({
      type: "concern",
      title: "취향 데이터 부족",
      desc: `아직 ${label} 기록이 없어 적합도 신뢰도가 낮아요.`,
    });
  }
  const strong = (drink.flavor_tags ?? []).find((t) =>
    STRONG_FLAVORS.some((s) => t.includes(s)),
  );
  if (strong) {
    concerns.push({
      type: "concern",
      title: "강한 개성",
      desc: `'${strong}' 풍미가 강해 호불호가 갈릴 수 있어요.`,
    });
  }
  if ((drink.abv ?? 0) >= 40) {
    concerns.push({
      type: "concern",
      title: "높은 도수",
      desc: `도수 ${drink.abv}%로 다소 강하게 느껴질 수 있어요.`,
    });
  }
  if (rows.length < 5) {
    concerns.push({
      type: "concern",
      title: "기록 수 부족",
      desc: "전체 기록이 적어 분석이 더 정교해지려면 시간이 필요해요.",
    });
  }
  // 보강용 일반 걱정
  concerns.push(
    {
      type: "concern",
      title: "가격 고려",
      desc: "프리미엄 라인이라 첫 시도엔 부담일 수 있어요.",
    },
    {
      type: "concern",
      title: "상황 의존",
      desc: "분위기·페어링에 따라 평가가 달라질 수 있어요.",
    },
  );

  // ---------- 점수대별 개수 ----------
  let posN: number;
  let conN: number;
  if (score >= 90) {
    posN = 5;
    conN = 1;
  } else if (score >= 70) {
    posN = 3;
    conN = 3;
  } else {
    posN = 2;
    conN = 4;
  }

  const analysis = [
    ...positives.slice(0, posN),
    ...concerns.slice(0, conN),
  ];

  return {
    score,
    analysis,
    pairings: PAIRINGS[drink.category] ?? PAIRINGS.etc,
  };
}

/** 술 id 기반 -3~+3 결정적 변동 */
function hashJitter(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return (h % 7) - 3;
}
