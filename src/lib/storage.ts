// ============================================================
// My Taste — Supabase 스토리지 레이어
// Phase 1: 로그인 없이 단일 유저로 동작 (user_id = null).
// visits_count만 AsyncStorage 유지 (DB 테이블 없음).
// ============================================================

import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  DashboardStats,
  Drink,
  DrinkCategory,
  RecordWithDrink,
  UserRecord,
  UserTasteProfile,
  WishlistItem,
  WishlistWithDrink,
} from "@/types";
import { CATEGORIES } from "@/constants";
import { SEED_DRINKS } from "@/lib/seed";
import { analyzeMatch } from "@/lib/match";
import { supabase } from "@/lib/supabase";
import { uuid } from "@/lib/uuid";

// ---------- 상수 ----------

const SEEDED_KEY = "@mytaste/supabase_seeded_v1";
const VISIT_COUNT_KEY = "@mytaste/visit_count";

// ---------- 헬퍼 ----------

function nowISO(): string {
  return new Date().toISOString();
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDrink(row: any): Drink {
  return {
    id: row.id as string,
    name_ko: row.name_ko as string,
    name_en: (row.name_en as string | null) ?? null,
    category: row.category as DrinkCategory,
    sub_category: (row.sub_category as string | null) ?? null,
    producer: (row.producer as string | null) ?? null,
    region: (row.region as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    vintage: (row.vintage as number | null) ?? null,
    abv: (row.abv as number | null) ?? null,
    description: (row.description as string | null) ?? null,
    image_url: (row.image_url as string | null) ?? null,
    vivino_score: (row.vivino_score as number | null) ?? null,
    vivino_count: (row.vivino_count as number | null) ?? null,
    data_source: row.data_source as Drink["data_source"],
    status: row.status as Drink["status"],
    flavor_tags: [],
    created_at: row.created_at as string,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRecord(row: any): UserRecord {
  return {
    id: row.id as string,
    drink_id: row.drink_id as string,
    score: row.score as number,
    recorded_at: row.recorded_at as string,
    location: (row.location as string | null) ?? null,
    food_pairing: (row.food_pairing as string | null) ?? null,
    companions: (row.companions as string | null) ?? null,
    one_liner: (row.one_liner as string | null) ?? null,
    is_public: row.is_public as boolean,
    mode: row.mode as UserRecord["mode"],
    tags: ((row.record_tags ?? []) as Array<{ tag_type: string; tag_value: string }>).map(
      (t) => ({
        tag_type: t.tag_type as UserRecord["tags"][number]["tag_type"],
        tag_value: t.tag_value,
      }),
    ),
    palette: (
      (row.record_palette ?? []) as Array<{
        palette_definition_id: string;
        value: number;
      }>
    ).map((p) => ({
      palette_definition_id: p.palette_definition_id,
      value: p.value,
    })),
    created_at: row.created_at as string,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapWishlist(row: any): WishlistItem {
  return {
    id: row.id as string,
    drink_id: row.drink_id as string,
    match_score: (row.match_score as number | null) ?? null,
    match_analysis: row.match_analysis ?? null,
    pairing_suggestions: row.pairing_suggestions ?? null,
    analyzed_at: (row.analyzed_at as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfile(row: any): UserTasteProfile {
  return {
    id: row.id as string,
    category: row.category as DrinkCategory,
    summary_text: (row.summary_text as string | null) ?? null,
    tags: row.tags ?? [],
    updated_at: row.updated_at as string,
  };
}

function buildDrinkRow(d: Drink) {
  return {
    name_ko: d.name_ko,
    name_en: d.name_en ?? null,
    category: d.category,
    sub_category: d.sub_category ?? null,
    producer: d.producer ?? null,
    region: d.region ?? null,
    country: d.country ?? null,
    vintage: d.vintage ?? null,
    abv: d.abv ?? null,
    description: d.description ?? null,
    image_url: d.image_url ?? null,
    vivino_score: d.vivino_score ?? null,
    vivino_count: d.vivino_count ?? null,
    data_source: d.data_source,
    status: d.status,
  };
}

// ---------- 초기화 (시드 주입) ----------

export async function ensureSeeded(): Promise<void> {
  const seeded = await AsyncStorage.getItem(SEEDED_KEY);
  if (seeded) return;

  const { count } = await supabase
    .from("drinks")
    .select("*", { count: "exact", head: true })
    .eq("data_source", "public_db");

  if ((count ?? 0) === 0) {
    const rows = SEED_DRINKS.map(buildDrinkRow);
    const { error } = await supabase.from("drinks").insert(rows);
    if (error) {
      console.warn("[storage] 시드 주입 실패:", error.message);
      return;
    }
  }

  await AsyncStorage.setItem(SEEDED_KEY, "1");
}

// ---------- 주류 카탈로그 (drinks) ----------

export async function getDrinks(): Promise<Drink[]> {
  await ensureSeeded();
  const { data, error } = await supabase
    .from("drinks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[storage] getDrinks 실패:", error.message);
    return [];
  }
  return (data ?? []).map(mapDrink);
}

export async function getDrinkById(id: string): Promise<Drink | undefined> {
  const { data, error } = await supabase
    .from("drinks")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return undefined;
  return mapDrink(data);
}

export async function getDrinksMap(): Promise<Record<string, Drink>> {
  const drinks = await getDrinks();
  return drinks.reduce<Record<string, Drink>>((acc, d) => {
    acc[d.id] = d;
    return acc;
  }, {});
}

export async function addDrink(
  input: Partial<Drink> & Pick<Drink, "name_ko" | "category">,
): Promise<Drink> {
  const drinkId = uuid();
  const row = {
    id: drinkId,
    name_ko: input.name_ko,
    name_en: input.name_en ?? null,
    category: input.category,
    sub_category: input.sub_category ?? null,
    producer: input.producer ?? null,
    region: input.region ?? null,
    country: input.country ?? null,
    vintage: input.vintage ?? null,
    abv: input.abv ?? null,
    description: input.description ?? null,
    image_url: input.image_url ?? null,
    vivino_score: input.vivino_score ?? null,
    vivino_count: input.vivino_count ?? null,
    data_source: "user_contributed" as const,
    status: "approved" as const,
  };
  const { data, error } = await supabase.from("drinks").insert(row).select().single();
  if (error) throw new Error(error.message);
  return mapDrink(data);
}

export async function searchDrinks(
  query: string,
  filters?: { category?: DrinkCategory | null; country?: string | null },
): Promise<Drink[]> {
  await ensureSeeded();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = supabase.from("drinks").select("*");

  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.country) q = q.eq("country", filters.country);

  const term = query.trim();
  if (term) {
    q = q.or(
      `name_ko.ilike.%${term}%,name_en.ilike.%${term}%,producer.ilike.%${term}%,region.ilike.%${term}%,country.ilike.%${term}%`,
    );
  }

  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) {
    console.warn("[storage] searchDrinks 실패:", error.message);
    return [];
  }
  return (data ?? []).map(mapDrink);
}

// ---------- 음용 기록 (user_records) ----------

export async function getRecords(): Promise<UserRecord[]> {
  const { data, error } = await supabase
    .from("user_records")
    .select("*, record_tags(*), record_palette(*)")
    .is("user_id", null)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[storage] getRecords 실패:", error.message);
    return [];
  }
  return (data ?? []).map(mapRecord);
}

export async function getRecordsWithDrinks(): Promise<RecordWithDrink[]> {
  const [records, map] = await Promise.all([getRecords(), getDrinksMap()]);
  return records
    .map((record) => {
      const drink = map[record.drink_id];
      return drink ? { record, drink } : null;
    })
    .filter((x): x is RecordWithDrink => x !== null);
}

export type NewRecordInput = Omit<UserRecord, "id" | "created_at"> &
  Partial<Pick<UserRecord, "recorded_at">>;

export async function addRecord(input: NewRecordInput): Promise<UserRecord> {
  const { tags, palette, ...base } = input;
  const recordId = uuid();
  const recordedAt = base.recorded_at ?? todayDate();

  const { data, error } = await supabase
    .from("user_records")
    .insert({
      id: recordId,
      user_id: null,
      drink_id: base.drink_id,
      score: base.score,
      recorded_at: recordedAt,
      location: base.location ?? null,
      food_pairing: base.food_pairing ?? null,
      companions: base.companions ?? null,
      one_liner: base.one_liner ?? null,
      is_public: base.is_public,
      mode: base.mode,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  if (tags.length > 0) {
    const { error: tagErr } = await supabase.from("record_tags").insert(
      tags.map((t) => ({
        record_id: recordId,
        tag_type: t.tag_type,
        tag_value: t.tag_value,
      })),
    );
    if (tagErr) console.warn("[storage] record_tags 삽입 실패:", tagErr.message);
  }

  if (palette.length > 0) {
    const { error: palErr } = await supabase.from("record_palette").insert(
      palette.map((p) => ({
        record_id: recordId,
        palette_definition_id: p.palette_definition_id,
        value: p.value,
      })),
    );
    if (palErr) console.warn("[storage] record_palette 삽입 실패:", palErr.message);
  }

  return {
    ...base,
    id: recordId,
    recorded_at: (data.recorded_at as string) ?? recordedAt,
    tags,
    palette,
    created_at: (data.created_at as string) ?? nowISO(),
  };
}

export async function deleteRecord(id: string): Promise<void> {
  const { error } = await supabase.from("user_records").delete().eq("id", id);
  if (error) console.warn("[storage] deleteRecord 실패:", error.message);
}

// ---------- 위시리스트 (wishlist) ----------

export async function getWishlist(): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from("wishlist")
    .select("*")
    .is("user_id", null)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[storage] getWishlist 실패:", error.message);
    return [];
  }
  return (data ?? []).map(mapWishlist);
}

export async function getWishlistWithDrinks(): Promise<WishlistWithDrink[]> {
  const [items, map] = await Promise.all([getWishlist(), getDrinksMap()]);
  return items
    .map((item) => {
      const drink = map[item.drink_id];
      return drink ? { item, drink } : null;
    })
    .filter((x): x is WishlistWithDrink => x !== null);
}

export async function isInWishlist(drinkId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from("wishlist")
    .select("*", { count: "exact", head: true })
    .is("user_id", null)
    .eq("drink_id", drinkId);
  if (error) return false;
  return (count ?? 0) > 0;
}

export async function addToWishlist(
  drinkId: string,
  analysis?: Pick<
    WishlistItem,
    "match_score" | "match_analysis" | "pairing_suggestions"
  >,
): Promise<WishlistItem> {
  const { data: existing } = await supabase
    .from("wishlist")
    .select("*")
    .is("user_id", null)
    .eq("drink_id", drinkId)
    .maybeSingle();
  if (existing) return mapWishlist(existing);

  const { data, error } = await supabase
    .from("wishlist")
    .insert({
      id: uuid(),
      user_id: null,
      drink_id: drinkId,
      match_score: analysis?.match_score ?? null,
      match_analysis: analysis?.match_analysis ?? null,
      pairing_suggestions: analysis?.pairing_suggestions ?? null,
      analyzed_at: analysis ? nowISO() : null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapWishlist(data);
}

export async function removeFromWishlist(drinkId: string): Promise<void> {
  const { error } = await supabase
    .from("wishlist")
    .delete()
    .is("user_id", null)
    .eq("drink_id", drinkId);
  if (error) console.warn("[storage] removeFromWishlist 실패:", error.message);
}

export async function addToWishlistWithAnalysis(drink: Drink): Promise<WishlistItem> {
  const rows = await getRecordsWithDrinks();
  const result = analyzeMatch(drink, rows);
  const payload = {
    match_score: result.score,
    match_analysis: result.analysis,
    pairing_suggestions: result.pairings,
  };

  const { data: existing } = await supabase
    .from("wishlist")
    .select("*")
    .is("user_id", null)
    .eq("drink_id", drink.id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("wishlist")
      .update({
        match_score: payload.match_score,
        match_analysis: payload.match_analysis,
        pairing_suggestions: payload.pairing_suggestions,
        analyzed_at: nowISO(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapWishlist(data);
  }

  return addToWishlist(drink.id, payload);
}

// ---------- 취향 프로필 (user_taste_profile) ----------

export async function getTasteProfiles(): Promise<UserTasteProfile[]> {
  const { data, error } = await supabase
    .from("user_taste_profile")
    .select("*")
    .is("user_id", null);
  if (error) {
    console.warn("[storage] getTasteProfiles 실패:", error.message);
    return [];
  }
  return (data ?? []).map(mapProfile);
}

export async function saveTasteProfile(
  profile: Omit<UserTasteProfile, "id" | "updated_at"> & { id?: string },
): Promise<UserTasteProfile> {
  // user_id IS NULL끼리는 unique 제약이 동작하지 않으므로 delete-then-insert
  await supabase
    .from("user_taste_profile")
    .delete()
    .is("user_id", null)
    .eq("category", profile.category);

  const { data, error } = await supabase
    .from("user_taste_profile")
    .insert({
      id: profile.id ?? uuid(),
      user_id: null,
      category: profile.category,
      summary_text: profile.summary_text ?? null,
      tags: profile.tags ?? [],
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapProfile(data);
}

// ---------- 접속 횟수 (visit_count) — DB 테이블 없어서 AsyncStorage 유지 ----------

export async function getVisitCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(VISIT_COUNT_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export async function incrementVisitCount(): Promise<number> {
  const count = (await getVisitCount()) + 1;
  await AsyncStorage.setItem(VISIT_COUNT_KEY, String(count));
  return count;
}

// ---------- 대시보드 통계 ----------

export async function getDashboardStats(): Promise<DashboardStats> {
  const [records, wishlist, visitCount, map] = await Promise.all([
    getRecords(),
    getWishlist(),
    getVisitCount(),
    getDrinksMap(),
  ]);

  const counts: Record<string, number> = {};
  for (const r of records) {
    const drink = map[r.drink_id];
    if (!drink) continue;
    counts[drink.category] = (counts[drink.category] ?? 0) + 1;
  }

  const byCategory = CATEGORIES.map((c) => ({
    category: c.key,
    count: counts[c.key] ?? 0,
  })).filter((c) => c.count > 0);

  return {
    totalRecords: records.length,
    visitCount,
    wishlistCount: wishlist.length,
    byCategory,
  };
}

// ---------- 개발용: 전체 초기화 ----------

export async function resetAll(): Promise<void> {
  await Promise.all([
    supabase.from("user_records").delete().is("user_id", null),
    supabase.from("wishlist").delete().is("user_id", null),
    supabase.from("user_taste_profile").delete().is("user_id", null),
    AsyncStorage.multiRemove([SEEDED_KEY, VISIT_COUNT_KEY]),
  ]);
}
