import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from "react-native";
import {
  createBottomTabNavigator,
  BottomTabBarHeightCallbackContext,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Baby,
  Home,
  Moon,
  TrendingUp,
  Heart,
  Brain,
  ChevronLeft,
  UserRound,
} from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { BottleIcon } from "../components/BottleIcon";
import { colors } from "../theme/colors";
import type { MainTabParamList } from "./types";
import { HomeScreen } from "../screens/HomeScreen";
import { FeedingScreen } from "../screens/FeedingScreen";
import { SleepScreen } from "../screens/SleepScreen";
import { GrowthScreen } from "../screens/GrowthScreen";
import { HealthScreen } from "../screens/HealthScreen";
import { AIScreen } from "../screens/AIScreen";
import { UserDetailsScreen } from "../screens/UserDetailsScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICON_SIZE = 20;
const TAB_BAR_BODY = 48;
const TAB_BAR_MIN_BOTTOM_PADDING = 8;
const TAB_BAR_MAX_BOTTOM_PADDING = 14;

function getTabBarBottomPadding(insetBottom: number) {
  if (insetBottom <= 0) return TAB_BAR_MIN_BOTTOM_PADDING;
  return Math.min(insetBottom, TAB_BAR_MAX_BOTTOM_PADDING);
}

function TabIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
      {children}
    </View>
  );
}

function renderTabIcon(
  routeName: keyof MainTabParamList,
  color: string,
  focused: boolean,
) {
  const iconProps = { color, size: TAB_ICON_SIZE };
  switch (routeName) {
    case "Home":
      return <Home {...iconProps} strokeWidth={focused ? 2.25 : 1.75} />;
    case "Feeding":
      return <BottleIcon size={TAB_ICON_SIZE} color={color} />;
    case "Sleep":
      return <Moon {...iconProps} strokeWidth={focused ? 2.25 : 1.75} />;
    case "Growth":
      return <TrendingUp {...iconProps} strokeWidth={focused ? 2.25 : 1.75} />;
    case "Health":
      return <Heart {...iconProps} strokeWidth={focused ? 2.25 : 1.75} />;
    case "AI":
      return <Brain {...iconProps} strokeWidth={focused ? 2.25 : 1.75} />;
    default:
      return <Home {...iconProps} />;
  }
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const onHeightChange = useContext(BottomTabBarHeightCallbackContext);
  const bottomInset = getTabBarBottomPadding(insets.bottom);
  const totalHeight = TAB_BAR_BODY + bottomInset;

  useEffect(() => {
    onHeightChange?.(totalHeight);
  }, [onHeightChange, totalHeight]);

  return (
    <View pointerEvents="box-none" style={styles.tabBarDock}>
      <View
        style={[
          styles.tabBar,
          {
            height: totalHeight,
            paddingBottom: bottomInset,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const color = focused ? colors.primary : colors.mutedForeground;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
            >
              <TabIcon focused={focused}>
                {renderTabIcon(
                  route.name as keyof MainTabParamList,
                  color,
                  focused,
                )}
              </TabIcon>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function AppHeader({
  isUserDetailsOpen,
  onOpenUserDetails,
  onCloseUserDetails,
}: {
  isUserDetailsOpen: boolean;
  onOpenUserDetails: () => void;
  onCloseUserDetails: () => void;
}) {
  const { baby } = useApp();
  const action = isUserDetailsOpen ? onCloseUserDetails : onOpenUserDetails;
  const icon = isUserDetailsOpen ? (
    <ChevronLeft size={18} color={colors.mutedForeground} />
  ) : (
    <UserRound size={18} color={colors.mutedForeground} />
  );
  const actionLabel = isUserDetailsOpen ? "Back" : "User details";

  if (!baby) return null;

  return (
    <SafeAreaView edges={["top"]} style={styles.headerSafe}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logo}>
            <Baby size={16} color={colors.primaryForeground} />
          </View>
          <Text style={styles.brand}>Bebio</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={action}
            style={styles.logout}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={actionLabel}
          >
            {icon}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export function MainTabs() {
  const [showUserDetails, setShowUserDetails] = useState(false);
  const insets = useSafeAreaInsets();
  const bottomInset = getTabBarBottomPadding(insets.bottom);
  const tabBarHeight = TAB_BAR_BODY + bottomInset;

  return (
    <View style={styles.root}>
      <AppHeader
        isUserDetailsOpen={showUserDetails}
        onOpenUserDetails={() => setShowUserDetails(true)}
        onCloseUserDetails={() => setShowUserDetails(false)}
      />
      {showUserDetails ? (
        <UserDetailsScreen />
      ) : (
        <Tab.Navigator
          safeAreaInsets={{ bottom: 0, top: 0, left: 0, right: 0 }}
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            sceneStyle: { paddingBottom: tabBarHeight },
          }}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Feeding" component={FeedingScreen} />
          <Tab.Screen name="Sleep" component={SleepScreen} />
          <Tab.Screen name="Growth" component={GrowthScreen} />
          <Tab.Screen name="Health" component={HealthScreen} />
          <Tab.Screen name="AI" component={AIScreen} />
        </Tab.Navigator>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerSafe: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 16,
    paddingRight: 12,
    paddingVertical: 10,
    minHeight: 52,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  logo: {
    width: 32,
    height: 32,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 18, fontWeight: "700", color: colors.foreground },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  logout: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  tabBarDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconWrap: {
    width: 36,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  tabIconWrapActive: {
    backgroundColor: colors.secondary,
  },
});
