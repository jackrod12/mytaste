import { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenProps {
  children: ReactNode;
  /** 스크롤 가능한 화면이면 true (기본 true) */
  scroll?: boolean;
  /** 내부 패딩 적용 (기본 true) */
  padded?: boolean;
}

/** 앱 공통 화면 래퍼 — 배경색 + 세이프에어리어 + 선택적 스크롤 */
export function Screen({ children, scroll = true, padded = true }: ScreenProps) {
  const padding = padded ? "px-5" : "";
  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={`${padding} pb-10 pt-2`}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View className={`flex-1 ${padding} pt-2`}>{children}</View>
      )}
    </SafeAreaView>
  );
}
