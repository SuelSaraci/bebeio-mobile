import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import {
  Moon,
  Droplets,
  Baby,
  TrendingUp,
  Brain,
  Activity,
  AlertCircle,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useApp } from '../context/AppContext';
import {
  Modal,
  FL,
  PBtn,
  EmptyState,
  StatCard,
  ToggleGroup,
  TimePickerField,
} from '../components/ui';
import { colors } from '../theme/colors';
import {
  calcDuration,
  genId,
  getBabyAge,
  minsToHM,
  safeFormatTime,
  todayDiapers,
  todayFeedings,
  todaySleepMins,
  todayStr,
} from '../utils';
import type { DiaperType } from '../types';
import type { MainTabParamList } from '../navigation/types';

export function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { baby, feedings, sleepEntries, diapers, setDiapers, growth, vaccinations } = useApp();
  const [showDiaper, setShowDiaper] = useState(false);
  const [diaperType, setDiaperType] = useState<DiaperType>('wet');
  const [diaperTime, setDiaperTime] = useState(new Date());

  if (!baby) return null;

  const todayFeed = todayFeedings(feedings);
  const todayDiap = todayDiapers(diapers);
  const sleepMins = todaySleepMins(sleepEntries);
  const lastFeed = [...feedings].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  const latestGrowth = [...growth].sort((a, b) => b.date.localeCompare(a.date))[0];
  const nextVax = vaccinations.find((v) => !v.done);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const allToday = ([
    ...todayFeed,
    ...sleepEntries.filter((s) => s.start.startsWith(todayStr())),
    ...todayDiap,
  ] as Array<{ timestamp?: string; start?: string; type?: string; side?: string; duration?: number; amount?: number; end?: string }>)
    .sort((a, b) => {
      const ts = (x: typeof a) => x.timestamp || x.start || '';
      return ts(b).localeCompare(ts(a));
    })
    .slice(0, 6);

  const logDiaper = () => {
    setDiapers((p) => [
      { id: genId(), timestamp: diaperTime.toISOString(), type: diaperType },
      ...p,
    ]);
    setShowDiaper(false);
  };

  const activityIcon = (item: (typeof allToday)[0]) => {
    if (item.start) return '😴';
    if (item.type === 'wet') return '💧';
    if (item.type === 'dirty') return '💩';
    if (item.type === 'both') return '🔄';
    if (item.type === 'breast') return '🤱';
    if (item.type === 'bottle') return '🍼';
    if (item.type === 'solid') return '🥣';
    return '📋';
  };

  const activityLabel = (item: (typeof allToday)[0]) => {
    if (item.start) return item.type === 'night' ? 'Night sleep' : 'Nap';
    if (item.type === 'wet' || item.type === 'dirty' || item.type === 'both') return 'Diaper change';
    if (item.type === 'breast') return 'Breastfeed';
    if (item.type === 'bottle') return 'Bottle';
    if (item.type === 'solid') return 'Solid food';
    return 'Entry';
  };

  const activityDetail = (item: (typeof allToday)[0]) => {
    if (item.start && item.end) return calcDuration(item.start, item.end);
    if (item.type === 'wet') return 'Wet';
    if (item.type === 'dirty') return 'Dirty';
    if (item.type === 'both') return 'Wet & dirty';
    if (item.type === 'breast') return `${item.side || ''} · ${item.duration ?? '?'}m`.trim();
    if (item.type === 'bottle') return `${item.amount ?? '?'}ml`;
    return '';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=260&fit=crop&auto=format' }}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay}>
          <Text style={styles.heroDate}>{format(new Date(), 'EEEE, MMMM d')}</Text>
          <Text style={styles.heroTitle}>{greeting} 👋</Text>
          <Text style={styles.heroSub}>
            {baby.name} is {getBabyAge(baby.birthDate)} — you're doing great!
          </Text>
          <View style={styles.chips}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {lastFeed
                  ? `Fed ${formatDistanceToNow(parseISO(lastFeed.timestamp), { addSuffix: true })}`
                  : 'No feedings logged'}
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{todayDiap.length} diapers today</Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.statsRow}>
        <StatCard icon={<Moon />} label="Sleep" value={minsToHM(sleepMins)} sub="Today's total" iconBg={colors.violet100} iconColor={colors.violet500} />
        <StatCard
          icon={<Droplets />}
          label="Feedings"
          value={`${todayFeed.length}×`}
          sub={lastFeed ? `Last ${formatDistanceToNow(parseISO(lastFeed.timestamp), { addSuffix: true })}` : 'None today'}
          iconBg={colors.rose100}
          iconColor={colors.rose500}
        />
      </View>
      <View style={styles.statsRow}>
        <StatCard icon={<Baby />} label="Diapers" value={String(todayDiap.length)} sub="Today" iconBg={colors.amber100} iconColor={colors.amber500} />
        <StatCard icon={<TrendingUp />} label="Weight" value={latestGrowth?.weight ? `${latestGrowth.weight} kg` : '—'} sub="Latest measurement" iconBg={colors.teal100} iconColor={colors.teal500} />
      </View>

      <Text style={styles.sectionLabel}>Quick Log</Text>
      <View style={styles.quickRow}>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => navigation.navigate('Feeding')}
        >
          <View style={[styles.quickIcon, { backgroundColor: colors.rose100 }]}>
            <Droplets size={18} color={colors.rose600} />
          </View>
          <Text style={styles.quickLabel}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => navigation.navigate('Sleep')}
        >
          <View style={[styles.quickIcon, { backgroundColor: colors.violet100 }]}>
            <Moon size={18} color={colors.violet600} />
          </View>
          <Text style={styles.quickLabel}>Sleep</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => { setDiaperTime(new Date()); setShowDiaper(true); }}
        >
          <View style={[styles.quickIcon, { backgroundColor: colors.amber100 }]}>
            <Baby size={18} color={colors.amber600} />
          </View>
          <Text style={styles.quickLabel}>Diaper</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => navigation.navigate('AI')}
        >
          <View style={[styles.quickIcon, { backgroundColor: colors.blue100 }]}>
            <Brain size={18} color={colors.blue600} />
          </View>
          <Text style={styles.quickLabel}>Ask AI</Text>
        </TouchableOpacity>
      </View>

      {nextVax && (
        <View style={styles.alert}>
          <AlertCircle size={16} color={colors.rose500} />
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle} numberOfLines={1}>{nextVax.name}</Text>
            <Text style={styles.alertSub}>{format(parseISO(nextVax.scheduledDate), 'MMM d, yyyy')}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Health')}>
            <Text style={styles.alertLink}>View →</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionLabel}>Today's Activity</Text>
      {allToday.length === 0 ? (
        <EmptyState icon={<Activity size={22} color={colors.mutedForeground} />} title="No activity yet" desc="Tap Quick Log above to start tracking today." />
      ) : (
        <View style={styles.list}>
          {allToday.map((item, i) => (
            <View key={i} style={[styles.listItem, i > 0 && styles.listBorder]}>
              <Text style={styles.listEmoji}>{activityIcon(item)}</Text>
              <View style={styles.listBody}>
                <Text style={styles.listTitle}>{activityLabel(item)}</Text>
                <Text style={styles.listSub}>{activityDetail(item)}</Text>
              </View>
              <Text style={styles.listTime}>{safeFormatTime(item.timestamp || item.start || '')}</Text>
            </View>
          ))}
        </View>
      )}

      <Modal title="Log Diaper Change" visible={showDiaper} onClose={() => setShowDiaper(false)}>
        <FL>Type</FL>
        <View style={styles.diaperRow}>
          {([['wet', '💧 Wet'], ['dirty', '💩 Dirty'], ['both', '🔄 Both']] as const).map(([t, label]) => (
            <TouchableOpacity
              key={t}
              onPress={() => setDiaperType(t)}
              style={[styles.diaperBtn, diaperType === t && styles.diaperActive]}
            >
              <Text style={[styles.diaperText, diaperType === t && styles.diaperTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TimePickerField label="Time" value={diaperTime} onChange={setDiaperTime} />
        <PBtn onPress={logDiaper}>Log Diaper Change</PBtn>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  hero: { borderRadius: 24, overflow: 'hidden', backgroundColor: colors.primary },
  heroImage: { opacity: 0.2 },
  heroOverlay: { padding: 24, backgroundColor: 'rgba(217, 92, 116, 0.85)' },
  heroDate: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  heroTitle: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1 },
  quickRow: { flexDirection: 'row', gap: 8 },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '700', color: colors.foreground },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.rose50,
    borderWidth: 1,
    borderColor: colors.rose200,
    borderRadius: 16,
    padding: 16,
  },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: colors.rose900 },
  alertSub: { fontSize: 12, color: colors.rose700 },
  alertLink: { fontSize: 12, fontWeight: '700', color: colors.rose600 },
  list: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  listBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  listEmoji: { fontSize: 18 },
  listBody: { flex: 1 },
  listTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  listSub: { fontSize: 12, color: colors.mutedForeground },
  listTime: { fontSize: 12, color: colors.mutedForeground },
  diaperRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  diaperBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  diaperActive: { borderColor: colors.primary, backgroundColor: colors.secondary },
  diaperText: { fontSize: 13, fontWeight: '700', color: colors.mutedForeground },
  diaperTextActive: { color: colors.primary },
});
