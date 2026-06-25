import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignupScreen } from './src/screens/SignupScreen';
import { BabySetupScreen } from './src/screens/BabySetupScreen';
import { MainTabs } from './src/navigation/MainTabs';

function RootNavigator() {
  const { screen } = useApp();

  if (screen === 'login') return <LoginScreen />;
  if (screen === 'signup') return <SignupScreen />;
  if (screen === 'setup') return <BabySetupScreen />;
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}
