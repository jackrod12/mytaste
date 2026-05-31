import "./global.css";

import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import {
  createBottomTabNavigator,
  type BottomTabNavigationOptions,
} from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DashboardScreen } from "@/screens/DashboardScreen";
import { RecordScreen } from "@/screens/RecordScreen";
import { WishlistScreen } from "@/screens/WishlistScreen";
import { SearchScreen } from "@/screens/SearchScreen";
import { COLORS } from "@/constants";
import type { RootTabParamList } from "@/types/navigation";

const Tab = createBottomTabNavigator<RootTabParamList>();

type IoniconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<
  keyof RootTabParamList,
  { active: IoniconName; inactive: IoniconName; label: string }
> = {
  Dashboard: { active: "home", inactive: "home-outline", label: "대시보드" },
  Record: {
    active: "add-circle",
    inactive: "add-circle-outline",
    label: "기록",
  },
  Wishlist: {
    active: "bookmark",
    inactive: "bookmark-outline",
    label: "위시리스트",
  },
  Search: { active: "search", inactive: "search-outline", label: "검색" },
};

function screenOptions({
  route,
}: {
  route: { name: keyof RootTabParamList };
}): BottomTabNavigationOptions {
  const meta = ICONS[route.name];
  return {
    headerShown: false,
    tabBarActiveTintColor: COLORS.ink,
    tabBarInactiveTintColor: COLORS.inkFaint,
    tabBarLabel: meta.label,
    tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
    tabBarStyle: {
      backgroundColor: COLORS.card,
      borderTopColor: COLORS.line,
      height: 88,
      paddingTop: 6,
    },
    tabBarIcon: ({ focused, color, size }) => (
      <Ionicons
        name={focused ? meta.active : meta.inactive}
        size={size}
        color={color}
      />
    ),
  };
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator screenOptions={screenOptions}>
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Record" component={RecordScreen} />
          <Tab.Screen name="Wishlist" component={WishlistScreen} />
          <Tab.Screen name="Search" component={SearchScreen} />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
