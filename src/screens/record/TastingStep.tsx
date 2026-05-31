import { useMemo } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import {
  Button,
  Card,
  Chip,
  Screen,
  SectionTitle,
  StarRating,
  StepHeader,
  PaletteSlider,
} from "@/components/ui";
import { RadarChart } from "@/components/charts/RadarChart";
import {
  AROMA_TAGS,
  CATEGORY_MAP,
  FINISH_TAGS,
  TASTE_TAGS,
  getPaletteDefs,
} from "@/constants";
import { recordPaletteToRadar } from "@/lib/palette";
import type { RecordPaletteValue, RecordTag, TagType } from "@/types";
import type { StepProps } from "./types";

/** 4단계: 테이스팅 노트 (기본 별점+태그 / 고급 팔레트 슬라이더) */
export function TastingStep({ draft, update, onNext, onBack }: StepProps) {
  const category = draft.category!;
  const meta = CATEGORY_MAP[category];

  const paletteDefs = useMemo(
    () => getPaletteDefs(category, { subCategory: draft.drink?.sub_category }),
    [category, draft.drink?.sub_category],
  );
  const basicDefs = useMemo(
    () => paletteDefs.filter((d) => d.mode === "basic"),
    [paletteDefs],
  );

  const valueFor = (defId: string) =>
    draft.palette.find((p) => p.palette_definition_id === defId)?.value ?? 3;

  const setPalette = (defId: string, value: number) => {
    const others = draft.palette.filter(
      (p) => p.palette_definition_id !== defId,
    );
    const next: RecordPaletteValue[] = [
      ...others,
      { palette_definition_id: defId, value },
    ];
    update({ palette: next });
  };

  const hasTag = (type: TagType, value: string) =>
    draft.tags.some((t) => t.tag_type === type && t.tag_value === value);

  const toggleTag = (type: TagType, value: string) => {
    const exists = hasTag(type, value);
    const next: RecordTag[] = exists
      ? draft.tags.filter(
          (t) => !(t.tag_type === type && t.tag_value === value),
        )
      : [...draft.tags, { tag_type: type, tag_value: value }];
    update({ tags: next });
  };

  const goNext = () => {
    if (draft.score < 1) {
      Alert.alert("별점 필요", "별점을 먼저 선택해 주세요.");
      return;
    }
    onNext();
  };

  return (
    <Screen>
      <StepHeader title="테이스팅 노트" step={4} total={6} onBack={onBack} />

      {/* 모드 토글 */}
      <View className="mb-5 flex-row rounded-xl bg-line p-1">
        {(["basic", "advanced"] as const).map((m) => {
          const active = draft.mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => update({ mode: m })}
              className={`flex-1 items-center rounded-lg py-2.5 ${
                active ? "bg-card" : ""
              }`}
            >
              <Text
                className={`text-[14px] font-semibold ${
                  active ? "text-ink" : "text-ink-faint"
                }`}
              >
                {m === "basic" ? "기본" : "고급"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 별점 (공통) */}
      <View className="mb-6">
        <SectionTitle title="별점" />
        <Card>
          <StarRating
            value={draft.score}
            onChange={(v) => update({ score: v })}
          />
        </Card>
      </View>

      {draft.mode === "basic" ? (
        <>
          <TagGroup
            title="향 (아로마)"
            type="aroma"
            options={AROMA_TAGS[category]}
            hasTag={hasTag}
            toggle={toggleTag}
          />
          <TagGroup
            title="맛"
            type="taste"
            options={TASTE_TAGS}
            hasTag={hasTag}
            toggle={toggleTag}
          />
          <TagGroup
            title="피니시"
            type="finish"
            options={FINISH_TAGS}
            hasTag={hasTag}
            toggle={toggleTag}
          />
        </>
      ) : (
        <>
          <View className="mb-5">
            <SectionTitle title="팔레트 미리보기" />
            <Card>
              <RadarChart
                axes={recordPaletteToRadar(basicDefs, draft.palette)}
                color={meta.color}
              />
            </Card>
          </View>
          <View className="mb-6">
            <SectionTitle title="테이스팅 팔레트" />
            <Card>
              {paletteDefs.map((d) => (
                <PaletteSlider
                  key={d.id}
                  itemName={d.item_name}
                  poleLeft={d.pole_left}
                  poleRight={d.pole_right}
                  value={valueFor(d.id)}
                  onChange={(v) => setPalette(d.id, v)}
                />
              ))}
            </Card>
          </View>
        </>
      )}

      <Button label="다음" onPress={goNext} />
    </Screen>
  );
}

function TagGroup({
  title,
  type,
  options,
  hasTag,
  toggle,
}: {
  title: string;
  type: TagType;
  options: string[];
  hasTag: (type: TagType, value: string) => boolean;
  toggle: (type: TagType, value: string) => void;
}) {
  return (
    <View className="mb-5">
      <SectionTitle title={title} />
      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            active={hasTag(type, opt)}
            onPress={() => toggle(type, opt)}
          />
        ))}
      </View>
    </View>
  );
}
