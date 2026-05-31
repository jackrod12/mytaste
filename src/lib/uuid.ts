/**
 * 로컬용 간단 UUID v4 생성기.
 * RN 환경에 crypto.randomUUID 가 없을 수 있어 직접 구현.
 */
export function uuid(): string {
  // RFC4122 v4 형태 (암호학적 강도는 불필요한 로컬 식별용)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
