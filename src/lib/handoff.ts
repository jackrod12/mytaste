// ============================================================
// 탭 간 핸드오프 — 위시리스트/검색에서 "마셨어요"를 누르면
// 선택한 술을 기록 플로우(Record 탭)로 넘긴다.
// 바텀 탭은 화면 간 파라미터 전달이 번거로워 모듈 레벨 1칸 버퍼 사용.
// ============================================================

import type { Drink } from "@/types";

let pendingRecordDrink: Drink | null = null;

export function setPendingRecordDrink(drink: Drink): void {
  pendingRecordDrink = drink;
}

/** 보류 중인 술을 꺼내며 비운다 (한 번만 소비) */
export function takePendingRecordDrink(): Drink | null {
  const d = pendingRecordDrink;
  pendingRecordDrink = null;
  return d;
}
