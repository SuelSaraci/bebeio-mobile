import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { format } from 'date-fns';
import { Moon, Plus, Brain, Trash2 } from 'lucide-react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useApp } from '../context/AppContext';
import {
  Modal,
  FL,
  TI,
  PBtn,
  EmptyState,
  ConfirmDeleteModal,
  ToggleGroup,
  TimePickerField,
} from '../components/ui';
import { colors } from '../theme/colors';
import { calcDuration, genId, minsToHM, safeFormatTime, todayStr } from '../utils';
import type { SleepType } from '../types';

export function SleepScreen() {
  const { sleepEntries, setSleepEntries } = useApp();
  const [show, setShow] = useState(false);
  const [sleepType, setSleepType] = useState<SleepType>('nap');
  const [startTime, setStartTime] = useState(new Date(Date.now() - 3600000));
  const [endTime, setEndTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const todaySleep = sleepEntries
    .filter((s) => s.start.startsWith(todayStr()) || s.end.startsWith(todayStr()))
    .sort((a, b) => b.start.localeCompare(a.start));

  const nightMins = todaySleep
    .filter((s) => s.type === 'night')
    .reduce((acc, s) => acc + Math.max(0, (new Date(s.end).getTime() - new Date(s.start).getTime()) / 60000), 0);
  const napMins = todaySleep
    .filter((s) => s.type === 'nap')
    .reduce((acc, s) => acc + Math.max(0, (new Date(s.end).getTime() - new Date(s.start).getTime()) / 60000), 0);

  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const day = format(d, 'yyyy-MM-dd');
    const mins = sleepEntries
      .filter((s) => s.start.startsWith(day))
      .reduce((acc, s) => acc + Math.max(0, (new Date(s.end).getTime() - new Date(s.start).getTime()) / 60000), 0);
    return { value: parseFloat((mins / 60).toFixed(1)), label: format(d, 'EEE') };
  });

  const save = () => {
    setError('');
    if (endTime <= startTime) {
      setError('End time must be after start time.');
      return;
    }
    setSleepEntries((p) => [
      { id: genId(), start: startTime.toISOString(), end: endTime.toISOString(), type: sleepType, notes: notes || undefined },
      ...p,
    ]);
    setNotes('');
    setShow(false);
  };

  const chartWidth = Dimensions.get('window').width - 64;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Sleep</Text>
          <Text style={styles.sub}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>
        <TouchableOpacity
          style={styles.logBtn}
          onPress={() => {
            setError('');
            setStartTime(new Date(Date.now() - 3600000));
            setEndTime(new Date());
            setShow(true);
          }}
        >
          <Plus size={15} color={colors.primaryForeground} />
          <Text style={styles.logBtnText}>Log</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        {[
          { value: minsToHM(nightMins), label: 'Night' },
          { value: minsToHM(napMins), label: 'Naps' },
          { value: minsToHM(nightMins + napMins), label: 'Total' },
        ].map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>This Week</Text>
        <BarChart
          data={weekData}
          barWidth={20}
          spacing={16}
          roundedTop
          frontColor={colors.primary}
          yAxisTextStyle={{ color: colors.mutedForeground, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: colors.mutedForeground, fontSize: 11 }}
          noOfSections={4}
          maxValue={18}
          width={chartWidth}
          height={140}
        />
      </View>

      <Text style={styles.sectionLabel}>Today's Sessions</Text>
      {todaySleep.length === 0 ? (
        <EmptyState icon={<Moon size={22} color={colors.mutedForeground} />} title="No sleep logged" desc="Tap 'Log' to record a sleep session." />
      ) : (
        <View style={styles.sessionList}>
          {todaySleep.map((s) => (
            <View key={s.id} style={styles.session}>
              <View style={[styles.sessionIcon, { backgroundColor: s.type === 'night' ? colors.violet100 : colors.blue100 }]}>
                <Moon size={16} color={s.type === 'night' ? colors.violet600 : colors.blue600} />
              </View>
              <View style={styles.sessionBody}>
                <Text style={styles.sessionTitle}>{s.type === 'night' ? 'Night sleep' : 'Nap'}</Text>
                <Text style={styles.sessionSub}>
                  {safeFormatTime(s.start)} → {safeFormatTime(s.end)}{s.notes ? ` · ${s.notes}` : ''}
                </Text>
              </View>
              <Text style={styles.sessionDur}>{calcDuration(s.start, s.end)}</Text>
              <TouchableOpacity onPress={() => setConfirmId(s.id)}>
                <Trash2 size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.tip}>
        <Brain size={17} color={colors.violet500} />
        <Text style={styles.tipText}>
          <Text style={styles.tipBold}>Tip: </Text>
          Newborns need 14–17h, 3–6 month olds need 12–16h total. An early bedtime (7–7:30 PM) helps.
        </Text>
      </View>

      <ConfirmDeleteModal
        visible={!!confirmId}
        message="This sleep session will be permanently removed."
        onConfirm={() => confirmId && setSleepEntries((p) => p.filter((s) => s.id !== confirmId))}
        onClose={() => setConfirmId(null)}
      />

      <Modal title="Log Sleep Session" visible={show} onClose={() => setShow(false)}>
        <FL>Type</FL>
        <ToggleGroup
          options={[
            { value: 'night' as SleepType, label: '🌙 Night' },
            { value: 'nap' as SleepType, label: '😴 Nap' },
          ]}
          value={sleepType}
          onChange={setSleepType}
        />
        <TimePickerField label="Start time" value={startTime} onChange={setStartTime} />
        <TimePickerField label="End time" value={endTime} onChange={setEndTime} />
        <FL>Notes (optional)</FL>
        <TI value={notes} onChangeText={setNotes} placeholder="e.g. restless, woke once…" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PBtn onPress={save}>Save Session</PBtn>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 24, fontWeight: '700', color: colors.foreground },
  sub: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  logBtnText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  statLabel: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  chartCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
  },
  chartTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground, marginBottom: 16 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1 },
  sessionList: { gap: 8 },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
  },
  sessionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sessionBody: { flex: 1 },
  sessionTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  sessionSub: { fontSize: 12, color: colors.mutedForeground },
  sessionDur: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  tip: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.violet50,
    borderWidth: 1,
    borderColor: colors.violet200,
    borderRadius: 16,
    padding: 16,
  },
  tipText: { flex: 1, fontSize: 14, color: colors.violet800, lineHeight: 20 },
  tipBold: { fontWeight: '700', color: colors.violet900 },
  error: { fontSize: 12, color: colors.red500, fontWeight: '500', marginBottom: 8 },
});
