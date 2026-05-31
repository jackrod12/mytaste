/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // 배경 / 표면
        bg: "#F5F4F0", // 앱 전체 배경
        card: "#FFFFFF", // 카드 배경
        // 텍스트
        ink: "#1A1917", // 기본 텍스트 / primary 버튼
        "ink-soft": "#6B6862", // 보조 텍스트
        "ink-faint": "#A6A29A", // 흐린 텍스트 / placeholder
        // 테두리
        line: "#E5E2DB",
        // 적합도 점수 색상
        match: {
          high: "#0F6E56", // 90+ 초록
          mid: "#BA7517", // 70~89 주황
          low: "#A32D2D", // <70 빨강
        },
      },
      fontSize: {
        // 제품명 한글 크게 / 영문 작게
        "name-ko": ["20px", { lineHeight: "26px", fontWeight: "700" }],
        "name-en": ["13px", { lineHeight: "17px" }],
      },
    },
  },
  plugins: [],
};
