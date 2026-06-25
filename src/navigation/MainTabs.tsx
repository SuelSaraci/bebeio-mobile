import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Baby,
  Home,
  Droplets,
  Moon,
  TrendingUp,
  Heart,
  Brain,
  LogOut,
} from 'lucide-react-native';
import { useApp } from '../context/AppContext';
import { getBabyAge } from '../utils';
import { colors } from '../theme/colors';
import type { MainTabParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { FeedingScreen } from '../screens/FeedingScreen';
import { SleepScreen } from '../screens/SleepScreen';
import { GrowthScreen } from '../screens/GrowthScreen';
import { HealthScreen } from '../screens/HealthScreen';
import { AIScreen } from '../screens/AIScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

function AppHeader() {
  const { baby, logout } = useApp();
  if (!baby) return null;

  const genderEmoji = baby.gender === 'girl' ? '👧' : '👦';

  return (
    <SafeAreaView edges={['top']} style={styles.headerSafe}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logo}>
            <Baby size={16} color={colors.primaryForeground} />
          </View>
          <Text style={styles.brand}>Bebio</Text>
        </View>
        <View style={styles.babyChip}>
          <Text style={styles.babyEmoji}>{genderEmoji}</Text>
          <View>
            <Text style={styles.babyName}>{baby.name}</Text>
            <Text style={styles.babyAge}>{getBabyAge(baby.birthDate)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logout}>
          <LogOut size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export function MainTabs() {
  return (
    <View style={styles.root}>
      <AppHeader />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ color, size }) => {
            const iconProps = { color, size: size - 2 };
            switch (route.name) {
              case 'Home':
                return <Home {...iconProps} />;
              case 'Feeding':
                return <Droplets {...iconProps} />;
              case 'Sleep':
                return <Moon {...iconProps} />;
              case 'Growth':
                return <TrendingUp {...iconProps} />;
              case 'Health':
                return <Heart {...iconProps} />;
              case 'AI':
                return <Brain {...iconProps} />;
              default:
                return <Home {...iconProps} />;
            }
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
        <Tab.Screen name="Feeding" component={FeedingScreen} options={{ tabBarLabel: 'Feed' }} />
        <Tab.Screen name="Sleep" component={SleepScreen} />
        <Tab.Screen name="Growth" component={GrowthScreen} />
        <Tab.Screen name="Health" component={HealthScreen} />
        <Tab.Screen name="AI" component={AIScreen} options={{ tabBarLabel: 'AI' }} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerSafe: { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: {
    width: 32,
    height: 32,
    backgroundColor: colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  babyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  babyEmoji: { fontSize: 16 },
  babyName: { fontSize: 12, fontWeight: '700', color: colors.foreground },
  babyAge: { fontSize: 10, color: colors.mutedForeground },
  logout: { padding: 8 },
  tabBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 4,
    height: 64,
  },
  tabLabel: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
});
