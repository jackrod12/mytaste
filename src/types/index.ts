// ============================================================
// My Taste — TypeScript 타입 정의
// docs/schema.sql 의 테이블 구조를 Phase 1 로컬(AsyncStorage)용으로 매핑.
// 모든 id 는 로컬에서 생성한 uuid 문자열, 모든 시각은 ISO 문자열.
// ============================================================

// ---------- ENUM 류 ----------

export type DrinkCategory =
  | "wine"
  | "whisky"
  | "beer"
  | "sake"
  | "makgeolli"
  | "etc";

export type DrinkStatus = "pending" | "approved" | "locked";

export type DataSource = "public_db" | "ai_collected" | "user_contributed";

export type PaletteMode = "basic" | "advanced";

export type RecordMode = "basic" | "advanced";

export type TagType = "aroma" | "taste" | "finish";

// ---------- 글로벌 주류 DB ----------

/** drinks 테이블 */
export interface Drink {
  id: string;
  name_ko: string;
  name_en?: string | null;
  category: DrinkCategory;
  sub_category?: string | null; // 레드/화이트/스파클링/싱글몰트 등
  producer?: string | null;
  region?: string | null;
  country?: string | null;
  vintage?: number | null;
  abv?: number | null;
  description?: string | null;
  image_url?: string | null;
  vivino_score?: number | null;
  vivino_count?: number | null;
  data_source: DataSource;
  status: DrinkStatus;
  /** 풍미/특성 태그 (검색·카드 표시용) */
  flavor_tags?: string[];
  created_at: string;
}

/** palette_definitions 테이블 — 카테고리별 테이스팅 팔레트 항목 정의 */
export interface PaletteDefinition {
  id: string;
  category: DrinkCategory;
  sub_category?: string | null; // null=카테고리 전체, 값=해당 서브카테고리만
  item_name: string; // 한글 항목명 (산도 등)
  item_key: string; // 영문 키 (acidity 등)
  mode: PaletteMode;
  display_order: number;
  pole_left?: string | null; // 슬라이더 왼쪽 레이블
  pole_right?: string | null; // 슬라이더 오른쪽 레이블
}

/** drink_palette — 글로벌 객관적 팔레트 값 (0~1) */
export interface DrinkPaletteValue {
  palette_definition_id: string;
  value: number; // 0~1
}

// ---------- 유저 개인 DB ----------

/** record_tags — 기본 모드 태그 */
export interface RecordTag {
  tag_type: TagType;
  tag_value: string; // 시트러스 / 상큼함 등
}

/** record_palette — 고급 모드 슬라이더 값 (1~5) */
export interface RecordPaletteValue {
  palette_definition_id: string;
  value: number; // 1~5
}

/**
 * user_records — 음용 기록.
 * Phase 1 로컬 저장이므로 record_tags / record_palette 를 중첩으로 포함.
 */
export interface UserRecord {
  id: string;
  drink_id: string;
  score: number; // 1~10
  recorded_at: string; // YYYY-MM-DD
  location?: string | null;
  food_pairing?: string | null;
  companions?: string | null;
  one_liner?: string | null;
  is_public: boolean;
  mode: RecordMode;
  tags: RecordTag[]; // 기본 모드
  palette: RecordPaletteValue[]; // 고급 모드
  created_at: string;
}

// ---------- 위시리스트 ----------

/** match_analysis 배열 항목 */
export interface MatchAnalysisItem {
  type: "positive" | "concern";
  title: string;
  desc: string;
}

/** pairing_suggestions 배열 항목 */
export interface PairingSuggestion {
  emoji: string;
  name: string;
  note?: string;
}

/** wishlist 테이블 */
export interface WishlistItem {
  id: string;
  drink_id: string;
  match_score?: number | null; // 0~100
  match_analysis?: MatchAnalysisItem[] | null;
  pairing_suggestions?: PairingSuggestion[] | null;
  analyzed_at?: string | null;
  created_at: string;
}

// ---------- 취향 프로필 캐시 ----------

export interface TasteTag {
  label: string;
  color: string;
}

/** user_taste_profile 테이블 */
export interface UserTasteProfile {
  id: string;
  category: DrinkCategory;
  summary_text?: string | null;
  tags: TasteTag[];
  updated_at: string;
}

// ---------- 화면 표시용 파생 타입 ----------

/** 기록 + 술 정보를 합친 화면용 뷰모델 */
export interface RecordWithDrink {
  record: UserRecord;
  drink: Drink;
}

/** 위시리스트 항목 + 술 정보 */
export interface WishlistWithDrink {
  item: WishlistItem;
  drink: Drink;
}

/** 대시보드 통계 */
export interface DashboardStats {
  totalRecords: number;
  visitCount: number;
  wishlistCount: number;
  /** 카테고리별 경험 횟수 */
  byCategory: { category: DrinkCategory; count: number }[];
}
