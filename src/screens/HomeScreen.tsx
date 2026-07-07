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
  Baby,
  TrendingUp,
  Activity,
  Syringe,
  Trash2,
  FileDown,
  Plus,
  Check,
  Clock,
} from 'lucide-react-native';
import { BabyReportExportModal } from '../components/BabyReportExportModal';
import { DiaperTypeIcon } from '../components/ActivityIcons';
import { BottleIcon } from '../components/BottleIcon';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useApp } from '../context/AppContext';
import { useFeatureGate } from '../hooks/useFeatureGate';
import {
  ConfirmDeleteModal,
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
  getBabyAge,
  minsToHM,
  safeDate,
  safeFormatTime,
  todayDiapers,
  todayFeedings,
  todaySleepMins,
  isLocalToday,
  isFutureTimestamp,
} from '../utils';
import type { DiaperType, FeedingEntry, SleepEntry, DiaperEntry } from '../types';
import type { MainTabParamList } from '../navigation/types';

type TodayActivity =
  | { kind: 'feeding'; data: FeedingEntry }
  | { kind: 'sleep'; data: SleepEntry }
  | { kind: 'diaper'; data: DiaperEntry };

export function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const {
    baby,
    feedings,
    sleepEntries,
    diapers,
    addDiaper,
    deleteFeeding,
    deleteSleep,
    deleteDiaper,
    growth,
    vaccinations,
    mutating,
  } = useApp();
  const { gateAdd, handleAddSaveResult } = useFeatureGate();
  const [showDiaper, setShowDiaper] = useState(false);
  const [diaperType, setDiaperType] = useState<DiaperType>('wet');
  const [diaperTime, setDiaperTime] = useState(new Date());
  const [confirmDelete, setConfirmDelete] = useState<TodayActivity | null>(null);
  const [showReport, setShowReport] = useState(false);

  if (!baby) return null;

  const todayFeed = todayFeedings(feedings);
  const todayDiap = todayDiapers(diapers);
  const sleepMins = todaySleepMins(sleepEntries);
  const lastFeed = [...feedings].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];
  const latestGrowth = [...growth].sort((a, b) => b.date.localeCompare(a.date))[0];
  const nextVax = vaccinations.find((v) => !v.done);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const allToday: TodayActivity[] = [
    ...todayFeed.map((data) => ({ kind: 'feeding' as const, data })),
    ...sleepEntries
      .filter((s) => isLocalToday(s.start))
      .map((data) => ({ kind: 'sleep' as const, data })),
    ...todayDiap.map((data) => ({ kind: 'diaper' as const, data })),
  ]
    .sort((a, b) => {
      const ts = (x: TodayActivity) => x.data.timestamp || ('start' in x.data ? x.data.start : '') || '';
      return ts(b).localeCompare(ts(a));
    })
    .slice(0, 6);

  const logDiaper = async () => {
    if (mutating) return;
    const ok = await addDiaper({ timestamp: diaperTime.toISOString(), type: diaperType });
    handleAddSaveResult(ok, 'diaper', () => setShowDiaper(false), () => setShowDiaper(false));
  };

  const deleteActivity = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.kind === 'feeding') await deleteFeeding(confirmDelete.data.id);
    else if (confirmDelete.kind === 'sleep') await deleteSleep(confirmDelete.data.id);
    else await deleteDiaper(confirmDelete.data.id);
  };

  const deleteMessage = (item: TodayActivity) => {
    if (item.kind === 'feeding') return "This feeding entry will be permanently removed from today's activity.";
    if (item.kind === 'sleep') return 'This sleep session will be permanently removed from today\'s activity.';
    return 'This diaper change will be permanently removed from today\'s activity.';
  };

  const activityLabel = (item: TodayActivity) => {
    const { data } = item;
    if (item.kind === 'sleep') return data.type === 'night' ? 'Night sleep' : 'Nap';
    if (item.kind === 'diaper') return 'Diaper change';
    if (data.type === 'breast') return 'Breastfeed';
    if (data.type === 'bottle') return 'Bottle';
    if (data.type === 'solid') return 'Solid food';
    return 'Entry';
  };

  const activityDetail = (item: TodayActivity) => {
    const { data } = item;
    if (item.kind === 'sleep') return calcDuration(data.start, data.end);
    if (item.kind === 'diaper') {
      if (data.type === 'wet') return 'Wet';
      if (data.type === 'dirty') return 'Dirty';
      return 'Wet & dirty';
    }
    if (data.type === 'breast') return `${data.side || ''} · ${data.duration ?? '?'}m`.trim();
    if (data.type === 'bottle') return `${data.amount ?? '?'}ml`;
    return '';
  };

  const activityTime = (item: TodayActivity) => {
    const ts = item.kind === 'sleep' ? item.data.start : item.data.timestamp;
    return safeFormatTime(ts);
  };

  const activityTimestamp = (item: TodayActivity) =>
    item.kind === 'sleep' ? item.data.start : item.data.timestamp;

  const isActivityPending = (item: TodayActivity) => isFutureTimestamp(activityTimestamp(item));

  const activityKey = (item: TodayActivity) => `${item.kind}-${item.data.id}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&h=260&fit=crop&auto=format' }}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay}>
          <Text style={styles.heroDate}>{format(new Date(), 'EEEE, MMMM d')}</Text>
          <Text style={styles.heroTitle}>{greeting}</Text>
          <Text style={styles.heroSub}>
            {baby.name} is {getBabyAge(baby.birthDate)} — you're doing great!
          </Text>
          <View style={styles.chips}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {lastFeed
                  ? `Fed ${formatDistanceToNow(parseISO(lastFeed.timestamp), { addSuffix: true })}`
                  : 'No feedings yet'}
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
          icon={<BottleIcon />}
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

      <Text style={styles.sectionLabel}>Export</Text>
      <TouchableOpacity style={styles.exportCard} onPress={() => setShowReport(true)} activeOpacity={0.9}>
        <View style={styles.exportIcon}>
          <FileDown size={20} color={colors.primary} />
        </View>
        <View style={styles.exportBody}>
          <Text style={styles.exportTitle}>Export Health Report</Text>
          <Text style={styles.exportSub}>Preview & download a PDF with all of {baby.name}&apos;s data</Text>
        </View>
        <Text style={styles.exportCta}>Open →</Text>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>Quick Add</Text>
      <TouchableOpacity
        style={styles.diaperQuickCard}
        onPress={() => gateAdd(diapers.length, 'diaper', () => { if (!mutating) { setDiaperTime(new Date()); setShowDiaper(true); } })}
        disabled={mutating}
        activeOpacity={0.9}
      >
        <View style={styles.diaperQuickIcon}>
          <Baby size={22} color={colors.amber600} />
        </View>
        <View style={styles.diaperQuickBody}>
          <Text style={styles.diaperQuickTitle}>Log Diaper Change</Text>
          <Text style={styles.diaperQuickSub}>
            {todayDiap.length > 0
              ? `${todayDiap.length} logged today · wet, dirty, or both`
              : 'Track wet, dirty, or both'}
          </Text>
        </View>
        <View style={styles.diaperQuickAction}>
          <Plus size={18} color={colors.primaryForeground} />
        </View>
      </TouchableOpacity>

      {nextVax && (
        <>
          <Text style={styles.sectionLabel}>Upcoming Vaccines</Text>
          <View style={styles.alert}>
            <View style={styles.vaxIcon}>
              <Syringe size={18} color={colors.rose600} />
            </View>
            <View style={styles.alertBody}>
              <Text style={styles.alertTitle} numberOfLines={1}>{nextVax.name}</Text>
              <Text style={styles.alertSub}>{safeDate(nextVax.scheduledDate)}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Health')}>
              <Text style={styles.alertLink}>View →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={styles.sectionLabel}>Today's Activity</Text>
      {allToday.length === 0 ? (
        <EmptyState icon={<Activity size={22} color={colors.mutedForeground} />} title="No activity yet" desc="Log a diaper change above or use the tabs to track feedings and sleep." />
      ) : (
        <View style={styles.list}>
          {allToday.map((item, i) => {
            const pending = isActivityPending(item);
            return (
              <View key={activityKey(item)} style={[styles.listItem, i > 0 && styles.listBorder]}>
                <View style={[styles.listIcon, pending ? styles.listIconPending : styles.listIconCompleted]}>
                  {pending ? (
                    <Clock size={15} color={colors.amber600} />
                  ) : (
                    <Check size={15} color={colors.green600} />
                  )}
                </View>
                <View style={styles.listBody}>
                  <Text style={[styles.listTitle, !pending && styles.listTitleCompleted]}>{activityLabel(item)}</Text>
                  <Text style={styles.listSub}>{activityDetail(item)}</Text>
                </View>
                <View style={styles.listMeta}>
                  <Text style={styles.listTime}>{activityTime(item)}</Text>
                  <View style={[styles.statusBadge, pending ? styles.statusPending : styles.statusCompleted]}>
                    <Text style={[styles.statusText, pending ? styles.statusTextPending : styles.statusTextCompleted]}>
                      {pending ? 'Pending' : 'Completed'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setConfirmDelete(item)} disabled={mutating}>
                  <Trash2 size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      <ConfirmDeleteModal
        visible={!!confirmDelete}
        message={confirmDelete ? deleteMessage(confirmDelete) : ''}
        onConfirm={deleteActivity}
        onClose={() => setConfirmDelete(null)}
        loading={mutating}
      />

      <Modal title="Add Diaper Change" visible={showDiaper} onClose={() => setShowDiaper(false)} disableClose={mutating}>
        <FL>Type</FL>
        <View style={styles.diaperRow}>
          {(
            [
              { type: 'wet' as const, label: 'Wet' },
              { type: 'dirty' as const, label: 'Dirty' },
              { type: 'both' as const, label: 'Both' },
            ] as const
          ).map(({ type, label }) => {
            const active = diaperType === type;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setDiaperType(type)}
                style={[styles.diaperBtn, active && styles.diaperActive]}
              >
                <DiaperTypeIcon
                  type={type}
                  size={16}
                  color={active ? colors.primary : colors.mutedForeground}
                />
                <Text style={[styles.diaperText, active && styles.diaperTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TimePickerField label="Time" value={diaperTime} onChange={setDiaperTime} />
        <PBtn onPress={logDiaper} loading={mutating} disabled={mutating}>Add Diaper Change</PBtn>
      </Modal>

      <BabyReportExportModal visible={showReport} onClose={() => setShowReport(false)} />
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
  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
  },
  exportIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBody: { flex: 1 },
  exportTitle: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  exportSub: { fontSize: 12, color: colors.mutedForeground, marginTop: 3, lineHeight: 17 },
  exportCta: { fontSize: 13, fontWeight: '700', color: colors.primary },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1 },
  diaperQuickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.amber200,
    borderRadius: 18,
    padding: 16,
  },
  diaperQuickIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.amber100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diaperQuickBody: { flex: 1 },
  diaperQuickTitle: { fontSize: 15, fontWeight: '700', color: colors.foreground },
  diaperQuickSub: { fontSize: 12, color: colors.mutedForeground, marginTop: 3, lineHeight: 17 },
  diaperQuickAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  vaxIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.rose100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '700', color: colors.rose900 },
  alertSub: { fontSize: 12, color: colors.rose700 },
  alertLink: { fontSize: 12, fontWeight: '700', color: colors.rose600 },
  list: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  listBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  listIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listIconCompleted: { backgroundColor: colors.green100 },
  listIconPending: { backgroundColor: colors.amber100 },
  listBody: { flex: 1 },
  listTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  listTitleCompleted: { color: colors.mutedForeground },
  listSub: { fontSize: 12, color: colors.mutedForeground },
  listMeta: { alignItems: 'flex-end', gap: 4 },
  listTime: { fontSize: 12, color: colors.mutedForeground, fontVariant: ['tabular-nums'] },
  statusBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  statusCompleted: { backgroundColor: colors.green100 },
  statusPending: { backgroundColor: colors.amber100 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  statusTextCompleted: { color: colors.green700 },
  statusTextPending: { color: colors.amber800 },
  diaperRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  diaperBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  diaperActive: { borderColor: colors.primary, backgroundColor: colors.secondary },
  diaperText: { fontSize: 13, fontWeight: '700', color: colors.mutedForeground },
  diaperTextActive: { color: colors.primary },
});
