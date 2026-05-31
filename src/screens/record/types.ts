import type {
  Drink,
  DrinkCategory,
  RecordMode,
  RecordPaletteValue,
  RecordTag,
} from "@/types";

/** 기록 위저드 단계 */
export type RecordStep =
  | "category"
  | "search"
  | "detail"
  | "tasting"
  | "diary"
  | "done";

export const STEP_ORDER: RecordStep[] = [
  "category",
  "search",
  "detail",
  "tasting",
  "diary",
  "done",
];

/** 위저드가 수집하는 임시 기록 데이터 */
export interface RecordDraft {
  category: DrinkCategory | null;
  vintage: number | null; // 와인 빈티지 (null = 알 수 없음)
  drink: Drink | null;
  mode: RecordMode;
  score: number; // 1~10 (0 = 미선택)
  tags: RecordTag[]; // 기본 모드
  palette: RecordPaletteValue[]; // 고급 모드
  recorded_at: string; // YYYY-MM-DD
  location: string;
  food_pairing: string;
  companions: string;
  one_liner: string;
  is_public: boolean;
}

export function emptyDraft(): RecordDraft {
  return {
    category: null,
    vintage: null,
    drink: null,
    mode: "basic",
    score: 0,
    tags: [],
    palette: [],
    recorded_at: new Date().toISOString().slice(0, 10),
    location: "",
    food_pairing: "",
    companions: "",
    one_liner: "",
    is_public: false,
  };
}

export interface StepProps {
  draft: RecordDraft;
  update: (patch: Partial<RecordDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}
