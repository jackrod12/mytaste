-- ============================================================
-- My Taste — Supabase DB Schema v1.0
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type drink_category as enum (
  'wine', 'whisky', 'beer', 'sake', 'makgeolli', 'etc'
);

create type drink_status as enum (
  'pending', 'approved', 'locked'
);

create type data_source as enum (
  'public_db', 'ai_collected', 'user_contributed'
);

create type palette_mode as enum (
  'basic', 'advanced'
);

create type record_mode as enum (
  'basic', 'advanced'
);

create type tag_type as enum (
  'aroma', 'taste', 'finish'
);

-- ============================================================
-- 1. GLOBAL DRINKS DB
-- ============================================================

create table drinks (
  id              uuid primary key default uuid_generate_v4(),
  name_ko         text not null,
  name_en         text,
  category        drink_category not null,
  sub_category    text,                        -- 레드/화이트/스파클링/싱글몰트 등
  producer        text,
  region          text,
  country         text,
  vintage         int,                         -- null 허용 (빈티지 없는 술)
  abv             float,                       -- 도수
  description     text,
  image_url       text,
  vivino_score    float,
  vivino_count    int,
  data_source     data_source not null default 'ai_collected',
  status          drink_status not null default 'pending',
  approved_by     uuid references auth.users(id),
  approved_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- locked 행은 수정 불가 트리거
create or replace function prevent_locked_update()
returns trigger as $$
begin
  if OLD.status = 'locked' then
    raise exception 'locked 상태의 데이터는 수정할 수 없습니다.';
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger drinks_lock_guard
  before update on drinks
  for each row execute function prevent_locked_update();

-- ============================================================
-- 2. DRINK CHANGE HISTORY
-- ============================================================

create table drink_history (
  id          uuid primary key default uuid_generate_v4(),
  drink_id    uuid not null references drinks(id) on delete cascade,
  changed_by  uuid references auth.users(id),
  changed_at  timestamptz not null default now(),
  field_name  text not null,
  old_value   text,
  new_value   text
);

-- ============================================================
-- 3. PALETTE DEFINITIONS
-- ============================================================

create table palette_definitions (
  id              uuid primary key default uuid_generate_v4(),
  category        drink_category not null,
  sub_category    text,           -- null이면 카테고리 전체 적용, 값 있으면 해당 서브카테고리만
  item_name       text not null,  -- 한글 항목명 (산도, 당도 등)
  item_key        text not null,  -- 영문 키 (acidity, sweetness 등)
  mode            palette_mode not null default 'basic',
  display_order   int not null default 0,
  pole_left       text,           -- 슬라이더 왼쪽 레이블
  pole_right      text            -- 슬라이더 오른쪽 레이블
);

-- 팔레트 기본 데이터 삽입
insert into palette_definitions (category, sub_category, item_name, item_key, mode, display_order, pole_left, pole_right) values
-- 와인 기본 (6항목)
('wine', null, '산도',     'acidity',    'basic',    1, '낮음',    '높음'),
('wine', null, '당도',     'sweetness',  'basic',    2, '드라이',  '스위트'),
('wine', null, '바디감',   'body',       'basic',    3, '라이트',  '풀바디'),
('wine', null, '타닌',     'tannin',     'basic',    4, '부드러움','강한 타닌'),
('wine', null, '오크',     'oak',        'basic',    5, '없음',    '강함'),
('wine', null, '과실향',   'fruit',      'basic',    6, '약함',    '강함'),
-- 와인 고급 (+6항목)
('wine', null, '꽃향',     'floral',     'advanced', 7, '약함',    '강함'),
('wine', null, '미네랄',   'mineral',    'advanced', 8, '약함',    '강함'),
('wine', null, '향신료',   'spice',      'advanced', 9, '약함',    '강함'),
('wine', null, '피니시 길이','finish_length','advanced',10,'짧음',  '김'),
('wine', null, '피니시 복잡도','finish_complexity','advanced',11,'단순','복잡'),
('wine', null, '탁도',     'clarity',    'advanced', 12,'맑음',    '탁함'),
-- 와인 스파클링 한정
('wine', 'sparkling', '탄산감', 'carbonation', 'basic', 3, '약함', '강함'),

-- 위스키 기본 (5항목)
('whisky', null, '피트·스모키', 'peat',       'basic',  1, '없음',   '강함'),
('whisky', null, '달콤함',     'sweetness',  'basic',  2, '드라이',  '스위트'),
('whisky', null, '스파이시',   'spice',      'basic',  3, '약함',    '강함'),
('whisky', null, '바디감',     'body',       'basic',  4, '라이트',  '풀바디'),
('whisky', null, '피니시',     'finish',     'basic',  5, '짧음',    '길고 복잡'),
-- 위스키 고급 (+5항목)
('whisky', null, '과실향',     'fruit',      'advanced',6,'약함',   '강함'),
('whisky', null, '오크',       'oak',        'advanced',7,'약함',   '강함'),
('whisky', null, '알코올 자극','alcohol_heat','advanced',8,'부드러움','강함'),
('whisky', null, '피니시 길이','finish_length','advanced',9,'짧음', '김'),
('whisky', null, '피니시 복잡도','finish_complexity','advanced',10,'단순','복잡'),

-- 맥주 기본 (5항목)
('beer', null, '쓴맛(IBU감)', 'bitterness', 'basic',  1, '약함',   '강함'),
('beer', null, '탄산감',      'carbonation','basic',  2, '약함',   '강함'),
('beer', null, '단맛',        'sweetness',  'basic',  3, '드라이', '스위트'),
('beer', null, '바디감',      'body',       'basic',  4, '라이트', '풀바디'),
('beer', null, '홉향',        'hop_aroma',  'basic',  5, '약함',   '강함'),
-- 맥주 고급 (+5항목)
('beer', null, '몰트향',      'malt',       'advanced',6,'약함',  '강함'),
('beer', null, '효모향',      'yeast',      'advanced',7,'약함',  '강함'),
('beer', null, '산도',        'acidity',    'advanced',8,'낮음',  '높음'),
('beer', null, '로스팅',      'roast',      'advanced',9,'없음',  '강함'),
('beer', null, '피니시',      'finish',     'advanced',10,'짧음', '길고 복잡'),

-- 사케 기본 (5항목)
('sake', null, '단맛',        'sweetness',  'basic',  1, '드라이', '스위트'),
('sake', null, '산도',        'acidity',    'basic',  2, '낮음',   '높음'),
('sake', null, '바디감',      'body',       'basic',  3, '라이트', '풀바디'),
('sake', null, '감칠맛(우마미)','umami',    'basic',  4, '약함',   '강함'),
('sake', null, '향 강도',     'aroma',      'basic',  5, '은은함', '진함'),
-- 사케 고급 (+4항목)
('sake', null, '쌀향',        'rice',       'advanced',6,'약함',  '강함'),
('sake', null, '발효향',      'ferment',    'advanced',7,'약함',  '강함'),
('sake', null, '청량감',      'freshness',  'advanced',8,'낮음',  '높음'),
('sake', null, '피니시',      'finish',     'advanced',9,'짧음',  '길고 복잡'),

-- 막걸리 기본 (5항목)
('makgeolli', null, '단맛',   'sweetness',  'basic',  1, '드라이', '스위트'),
('makgeolli', null, '산도',   'acidity',    'basic',  2, '낮음',   '높음'),
('makgeolli', null, '탄산감', 'carbonation','basic',  3, '약함',   '강함'),
('makgeolli', null, '바디감', 'body',       'basic',  4, '라이트', '풀바디'),
('makgeolli', null, '쌀향',   'rice',       'basic',  5, '약함',   '강함'),
-- 막걸리 고급 (+3항목)
('makgeolli', null, '발효향', 'ferment',    'advanced',6,'약함',  '강함'),
('makgeolli', null, '탁도',   'clarity',    'advanced',7,'맑음',  '탁함'),
('makgeolli', null, '피니시', 'finish',     'advanced',8,'짧음',  '길고 복잡');

-- ============================================================
-- 4. DRINK PALETTE VALUES (글로벌 객관적 팔레트)
-- ============================================================

create table drink_palette (
  id                    uuid primary key default uuid_generate_v4(),
  drink_id              uuid not null references drinks(id) on delete cascade,
  palette_definition_id uuid not null references palette_definitions(id),
  value                 float not null check (value >= 0 and value <= 1),
  unique (drink_id, palette_definition_id)
);

-- ============================================================
-- 5. USER RECORDS (음용 기록)
-- ============================================================

create table user_records (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id),  -- Phase 1: null 허용 (로컬 유저)
  drink_id      uuid not null references drinks(id),
  score         int not null check (score >= 1 and score <= 10),
  recorded_at   date not null default current_date,
  location      text,
  food_pairing  text,
  companions    text,
  one_liner     text,
  is_public     bool not null default false,
  mode          record_mode not null default 'basic',
  created_at    timestamptz not null default now()
);

-- ============================================================
-- 6. RECORD TAGS (기본 모드)
-- ============================================================

create table record_tags (
  id          uuid primary key default uuid_generate_v4(),
  record_id   uuid not null references user_records(id) on delete cascade,
  tag_type    tag_type not null,
  tag_value   text not null
);

-- ============================================================
-- 7. RECORD PALETTE (고급 모드 슬라이더 값)
-- ============================================================

create table record_palette (
  id                    uuid primary key default uuid_generate_v4(),
  record_id             uuid not null references user_records(id) on delete cascade,
  palette_definition_id uuid not null references palette_definitions(id),
  value                 int not null check (value >= 1 and value <= 5),
  unique (record_id, palette_definition_id)
);

-- ============================================================
-- 8. WISHLIST
-- ============================================================

create table wishlist (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid references auth.users(id),  -- Phase 1: null 허용
  drink_id            uuid not null references drinks(id),
  match_score         int check (match_score >= 0 and match_score <= 100),
  match_analysis      jsonb,   -- [{type: 'positive'|'concern', title, desc}]
  pairing_suggestions jsonb,   -- [{emoji, name, note}]
  analyzed_at         timestamptz,
  created_at          timestamptz not null default now(),
  unique (user_id, drink_id)
);

-- ============================================================
-- 9. USER TASTE PROFILE CACHE
-- ============================================================

create table user_taste_profile (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id),  -- Phase 1: null 허용
  category      drink_category not null,
  summary_text  text,
  tags          jsonb,   -- [{label, color}]
  updated_at    timestamptz not null default now(),
  unique (user_id, category)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_drinks_category    on drinks(category);
create index idx_drinks_status      on drinks(status);
create index idx_drinks_name_ko     on drinks using gin(to_tsvector('simple', name_ko));
create index idx_records_user       on user_records(user_id);
create index idx_records_drink      on user_records(drink_id);
create index idx_wishlist_user      on wishlist(user_id);
create index idx_palette_def_cat    on palette_definitions(category, mode);

-- ============================================================
-- ROW LEVEL SECURITY (Phase 2 이후 활성화)
-- ============================================================

-- alter table user_records enable row level security;
-- alter table wishlist enable row level security;
-- alter table user_taste_profile enable row level security;
