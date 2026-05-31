import { useCallback, useState } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { categoryLabel } from "@/constants";
import { takePendingRecordDrink } from "@/lib/handoff";
import { addRecord, getRecordsWithDrinks } from "@/lib/storage";
import type { TabNavigation } from "@/types/navigation";

import { CategoryStep } from "./record/CategoryStep";
import { SearchStep } from "./record/SearchStep";
import { DetailStep } from "./record/DetailStep";
import { TastingStep } from "./record/TastingStep";
import { DiaryStep } from "./record/DiaryStep";
import { DoneStep } from "./record/DoneStep";
import {
  emptyDraft,
  type RecordDraft,
  type RecordStep,
  type StepProps,
} from "./record/types";

const FLOW: RecordStep[] = [
  "category",
  "search",
  "detail",
  "tasting",
  "diary",
];

export function RecordScreen() {
  const navigation = useNavigation<TabNavigation>();
  const [step, setStep] = useState<RecordStep>("category");
  const [draft, setDraft] = useState<RecordDraft>(emptyDraft);
  const [comment, setComment] = useState("");

  const update = useCallback(
    (patch: Partial<RecordDraft>) => setDraft((prev) => ({ ...prev, ...patch })),
    [],
  );

  const reset = useCallback(() => {
    setDraft(emptyDraft());
    setComment("");
    setStep("category");
  }, []);

  // 포커스 시: 위시리스트 "마셨어요"로 넘어온 술이 있으면 상세 단계부터 시작.
  // 떠날 때: 완료 상태였다면 다음 진입을 위해 처음으로 리셋.
  useFocusEffect(
    useCallback(() => {
      const pending = takePendingRecordDrink();
      if (pending) {
        setDraft({ ...emptyDraft(), category: pending.category, drink: pending });
        setComment("");
        setStep("detail");
      }
      return () => {
        setStep((s) => (s === "done" ? "category" : s));
      };
    }, []),
  );

  const save = useCallback(async () => {
    if (!draft.drink) return;
    await addRecord({
      drink_id: draft.drink.id,
      score: draft.score,
      recorded_at: draft.recorded_at,
      location: draft.location.trim() || null,
      food_pairing: draft.food_pairing.trim() || null,
      companions: draft.companions.trim() || null,
      one_liner: draft.one_liner.trim() || null,
      is_public: draft.is_public,
      mode: draft.mode,
      tags: draft.mode === "basic" ? draft.tags : [],
      palette: draft.mode === "advanced" ? draft.palette : [],
    });
    // 카테고리 누적 개수로 AI 분석 코멘트 생성 (Phase 1 로컬)
    const rows = await getRecordsWithDrinks();
    const catCount = rows.filter(
      (r) => r.drink.category === draft.drink!.category,
    ).length;
    setComment(buildComment(draft, catCount));
    setStep("done");
  }, [draft]);

  const goNext = useCallback(() => {
    const idx = FLOW.indexOf(step);
    if (step === "diary") {
      void save();
      return;
    }
    if (idx >= 0 && idx < FLOW.length - 1) {
      setStep(FLOW[idx + 1]);
    }
  }, [step, save]);

  const goBack = useCallback(() => {
    const idx = FLOW.indexOf(step);
    if (idx > 0) setStep(FLOW[idx - 1]);
  }, [step]);

  const stepProps: StepProps = { draft, update, onNext: goNext, onBack: goBack };

  switch (step) {
    case "category":
      return <CategoryStep {...stepProps} />;
    case "search":
      return <SearchStep {...stepProps} />;
    case "detail":
      return <DetailStep {...stepProps} />;
    case "tasting":
      return <TastingStep {...stepProps} />;
    case "diary":
      return <DiaryStep {...stepProps} />;
    case "done":
      return draft.drink ? (
        <DoneStep
          drink={draft.drink}
          comment={comment}
          onRestart={reset}
          onGoDashboard={() => {
            reset();
            navigation.navigate("Dashboard");
          }}
        />
      ) : null;
  }
}

function buildComment(draft: RecordDraft, catCount: number): string {
  const label = categoryLabel(draft.drink!.category);
  const remainder = catCount % 5;
  if (remainder === 0) {
    return `${label} 기록이 ${catCount}개가 되었어요. 취향 프로필을 새로 분석했어요 — 대시보드에서 확인해 보세요!`;
  }
  const need = 5 - remainder;
  const moodTag = draft.tags[0]?.tag_value;
  const moodLine = moodTag
    ? `이번엔 '${moodTag}' 풍미가 인상적이었네요. `
    : "";
  return `${moodLine}${label} 기록이 ${catCount}개 쌓였어요. ${need}개 더 기록하면 취향 프로필이 업데이트돼요.`;
}
