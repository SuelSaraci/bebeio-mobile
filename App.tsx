import { StatusBar } from "expo-status-bar";
import "./src/lib/notifications";
import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { AppProvider, useApp } from "./src/context/AppContext";
import { ToastProvider } from "./src/components/Toast";
import { NotificationBootstrap } from "./src/components/NotificationBootstrap";
import { LoginScreen } from "./src/screens/LoginScreen";
import { SignupScreen } from "./src/screens/SignupScreen";
import { BabySetupScreen } from "./src/screens/BabySetupScreen";
import { MainTabs } from "./src/navigation/MainTabs";
import { colors } from "./src/theme/colors";
import { warmUpUpgradeBrowser } from "./src/lib/upgradeWeb";
import { useEffect } from "react";

function RootNavigator() {
  const { screen, authLoading, loading } = useApp();
  const navigationRef =
    useNavigationContainerRef<
      import("./src/navigation/types").MainTabParamList
    >();

  if (authLoading || loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (screen === "login") return <LoginScreen />;
  if (screen === "signup") return <SignupScreen />;
  if (screen === "setup") return <BabySetupScreen />;
  return (
    <NavigationContainer ref={navigationRef}>
      <NotificationBootstrap navigationRef={navigationRef} />
      <MainTabs />
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    warmUpUpgradeBrowser();
  }, []);

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AppProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
