import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

/** 바텀 탭 파라미터 목록 (App.tsx 의 Tab.Navigator 와 일치) */
export type RootTabParamList = {
  Dashboard: undefined;
  Record: undefined;
  Wishlist: undefined;
  Search: undefined;
};

export type TabNavigation = BottomTabNavigationProp<RootTabParamList>;
