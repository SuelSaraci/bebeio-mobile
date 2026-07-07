import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { format, parseISO } from 'date-fns';
import { Plus, TrendingUp, Star, Check, Clock, Trash2 } from 'lucide-react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useApp } from '../context/AppContext';
import { useFeatureGate } from '../hooks/useFeatureGate';
import { useToast } from '../components/Toast';
import { parseDecimalInput } from '../lib/validation';
import {
  Modal,
  FL,
  TI,
  PBtn,
  EmptyState,
  ConfirmDeleteModal,
  DatePickerField,
} from '../components/ui';
import { colors } from '../theme/colors';
import { getBabyAge, safeDate, todayStr } from '../utils';

export function GrowthScreen() {
  const {
    baby,
    growth,
    milestones,
    addGrowth,
    deleteGrowth,
    addMilestone,
    toggleMilestone,
    deleteMilestone,
    userMilestoneCount,
    mutating,
  } = useApp();
  const { gateAdd, handleAddSaveResult } = useFeatureGate();
  const { showError } = useToast();
  const [showMeas, setShowMeas] = useState(false);
  const [showMs, setShowMs] = useState(false);
  const [date, setDate] = useState(new Date());
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [head, setHead] = useState('');
  const [msTitle, setMsTitle] = useState('');
  const [msExp, setMsExp] = useState('');
  const [confirmGrowth, setConfirmGrowth] = useState<string | null>(null);
  const [confirmMs, setConfirmMs] = useState<string | null>(null);

  if (!baby) return null;

  const sorted = [...growth].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];

  const chartData = sorted
    .filter((g) => g.weight)
    .map((g) => ({
      value: g.weight!,
      label: (() => {
        try {
          return format(parseISO(g.date), 'MMM d');
        } catch {
          return g.date;
        }
      })(),
    }));

  const saveMeas = async () => {
    if (mutating) return;
    const ok = await addGrowth({
      date: format(date, 'yyyy-MM-dd'),
      weight: parseDecimalInput(weight),
      height: parseDecimalInput(height),
      headCirc: parseDecimalInput(head),
    });
    handleAddSaveResult(ok, 'growth', () => setShowMeas(false), () => {
      setWeight('');
      setHeight('');
      setHead('');
      setDate(new Date());
      setShowMeas(false);
    });
  };

  const saveMs = async () => {
    if (mutating || !msTitle.trim()) return;
    try {
      const ok = await addMilestone({ title: msTitle.trim(), expectedWeeks: msExp.trim() || '—', done: false });
      handleAddSaveResult(ok, 'milestone', () => setShowMs(false), () => {
        setMsTitle('');
        setMsExp('');
        setShowMs(false);
      });
    } catch {
      showError('Could not add milestone. Please try again.');
    }
  };

  const toggleMs = async (id: string) => {
    if (mutating) return;
    const m = milestones.find((x) => x.id === id);
    if (!m) return;
    try {
      if (m.done) {
        await toggleMilestone(id, false);
      } else {
        await toggleMilestone(id, true, format(new Date(), 'yyyy-MM-dd'));
      }
    } catch {
      showError('Could not update milestone. Please try again.');
    }
  };

  const chartWidth = Dimensions.get('window').width - 64;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Growth</Text>
          <Text style={styles.sub}>{baby.name} · {getBabyAge(baby.birthDate)}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          disabled={mutating}
          onPress={() => gateAdd(growth.length, 'growth', () => { setDate(new Date()); setShowMeas(true); })}
        >
          <Plus size={15} color={colors.primaryForeground} />
          <Text style={styles.addBtnText}>Measure</Text>
        </TouchableOpacity>
      </View>

      {latest && (
        <View style={styles.metricsRow}>
          {[
            { label: 'Weight', value: latest.weight ? `${latest.weight} kg` : '—', bg: colors.rose50, border: colors.rose200 },
            { label: 'Height', value: latest.height ? `${latest.height} cm` : '—', bg: colors.teal50, border: colors.teal200 },
            { label: 'Head', value: latest.headCirc ? `${latest.headCirc} cm` : '—', bg: colors.amber50, border: colors.amber200 },
          ].map((m) => (
            <View key={m.label} style={[styles.metric, { backgroundColor: m.bg, borderColor: m.border }]}>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricTag}>Latest</Text>
            </View>
          ))}
        </View>
      )}

      {chartData.length > 1 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weight Trend</Text>
          <LineChart
            data={chartData}
            color={colors.primary}
            thickness={2.5}
            areaChart
            startFillColor={colors.primary}
            endFillColor={colors.primary}
            startOpacity={0.15}
            endOpacity={0}
            dataPointsColor={colors.primary}
            dataPointsRadius={3}
            width={chartWidth}
            height={170}
            xAxisLabelTextStyle={{ color: colors.mutedForeground, fontSize: 10 }}
            yAxisTextStyle={{ color: colors.mutedForeground, fontSize: 10 }}
          />
        </View>
      )}

      <Text style={styles.sectionLabel}>Measurement History</Text>
      {sorted.length === 0 ? (
        <EmptyState icon={<TrendingUp size={22} color={colors.mutedForeground} />} title="No measurements yet" desc="Tap 'Measure' to add the first entry." />
      ) : (
        <View style={styles.list}>
          {[...sorted].reverse().map((g, i) => (
            <View key={g.id} style={[styles.listItem, i > 0 && styles.listBorder]}>
              <View style={styles.listBody}>
                <Text style={styles.listTitle}>{safeDate(g.date)}</Text>
                <Text style={styles.listSub}>
                  {[g.weight && `${g.weight} kg`, g.height && `${g.height} cm`, g.headCirc && `HC ${g.headCirc} cm`]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setConfirmGrowth(g.id)} disabled={mutating}>
                <Trash2 size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.msHeader}>
        <Text style={styles.sectionLabel}>Milestones</Text>
        <TouchableOpacity onPress={() => gateAdd(userMilestoneCount, 'milestone', () => setShowMs(true))} disabled={mutating}>
          <Text style={styles.addLink}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {milestones.length === 0 ? (
        <EmptyState icon={<Star size={22} color={colors.mutedForeground} />} title="No milestones" desc="Add milestones to track development." />
      ) : (
        <View style={styles.msList}>
          {milestones.map((m) => (
            <View key={m.id} style={styles.msItem}>
              <TouchableOpacity
                style={styles.msRow}
                onPress={() => toggleMs(m.id)}
                disabled={mutating}
                activeOpacity={0.7}
              >
                <View style={[styles.msCheck, m.done && styles.msCheckDone]}>
                  {m.done ? <Check size={14} color={colors.green600} /> : <Clock size={13} color={colors.mutedForeground} />}
                </View>
                <View style={styles.msBody}>
                  <Text style={[styles.msTitle, m.done && styles.msTitleDone]}>{m.title}</Text>
                  <Text style={styles.msSub}>
                    {m.done
                      ? `Achieved ${m.achievedDate ? safeDate(m.achievedDate) : 'today'}`
                      : `Expected ${m.expectedWeeks}`}
                  </Text>
                </View>
                <View style={[styles.msBadge, m.done ? styles.msBadgeDone : styles.msBadgePending]}>
                  <Text style={[styles.msBadgeText, m.done ? styles.msBadgeTextDone : styles.msBadgeTextPending]}>
                    {m.done ? 'Undo' : 'Mark done'}
                  </Text>
                </View>
              </TouchableOpacity>
              {m.done && <Star size={13} color={colors.amber500} />}
              <TouchableOpacity onPress={() => setConfirmMs(m.id)} disabled={mutating} hitSlop={8}>
                <Trash2 size={13} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <ConfirmDeleteModal
        visible={!!confirmGrowth}
        message="This measurement record will be permanently deleted."
        onConfirm={() => confirmGrowth && deleteGrowth(confirmGrowth)}
        onClose={() => setConfirmGrowth(null)}
        loading={mutating}
      />
      <ConfirmDeleteModal
        visible={!!confirmMs}
        message="This milestone will be permanently removed."
        onConfirm={() => confirmMs && deleteMilestone(confirmMs)}
        onClose={() => setConfirmMs(null)}
        loading={mutating}
      />

      <Modal title="Add Measurement" visible={showMeas} onClose={() => setShowMeas(false)} disableClose={mutating}>
        <DatePickerField label="Date" value={date} onChange={setDate} maximumDate={new Date()} />
        <FL>Weight (kg)</FL>
        <TI value={weight} onChangeText={setWeight} placeholder="e.g. 6.2" keyboardType="decimal-pad" />
        <FL>Height (cm)</FL>
        <TI value={height} onChangeText={setHeight} placeholder="e.g. 62.0" keyboardType="decimal-pad" />
        <FL>Head Circumference (cm)</FL>
        <TI value={head} onChangeText={setHead} placeholder="e.g. 40.5" keyboardType="decimal-pad" />
        <PBtn onPress={saveMeas} loading={mutating} disabled={mutating}>Save Measurement</PBtn>
      </Modal>

      <Modal title="Add Milestone" visible={showMs} onClose={() => setShowMs(false)} disableClose={mutating}>
        <FL>Milestone</FL>
        <TI value={msTitle} onChangeText={setMsTitle} placeholder="e.g. First steps, First word…" />
        <FL>Expected Age (optional)</FL>
        <TI value={msExp} onChangeText={setMsExp} placeholder="e.g. ~9–12 months" />
        <PBtn onPress={saveMs} loading={mutating} disabled={mutating}>Add Milestone</PBtn>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '700' },
  metricsRow: { flexDirection: 'row', gap: 12 },
  metric: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  metricLabel: { fontSize: 12, color: colors.mutedForeground, marginBottom: 6 },
  metricValue: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  metricTag: { fontSize: 10, fontWeight: '700', opacity: 0.6, marginTop: 4 },
  chartCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
  },
  chartTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground, marginBottom: 16 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1 },
  list: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  listBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  listBody: { flex: 1 },
  listTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  listSub: { fontSize: 12, color: colors.mutedForeground },
  msHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addLink: { fontSize: 12, fontWeight: '700', color: colors.primary },
  msList: { gap: 8 },
  msItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingRight: 14,
    paddingVertical: 4,
  },
  msRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingLeft: 14,
  },
  msCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msCheckDone: { backgroundColor: colors.green100 },
  msBody: { flex: 1 },
  msTitle: { fontSize: 14, fontWeight: '600', color: colors.foreground },
  msTitleDone: { color: colors.green700 },
  msSub: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  msBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  msBadgePending: { backgroundColor: colors.secondary },
  msBadgeDone: { backgroundColor: colors.muted },
  msBadgeText: { fontSize: 10, fontWeight: '700' },
  msBadgeTextPending: { color: colors.primary },
  msBadgeTextDone: { color: colors.mutedForeground },
});
