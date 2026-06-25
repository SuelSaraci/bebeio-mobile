import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { format } from 'date-fns';
import { Droplets, Plus, Sun, Trash2 } from 'lucide-react-native';
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
import { genId, minsToHM, safeFormatTime, todayFeedings } from '../utils';
import type { FeedingEntry, FeedingType } from '../types';

export function FeedingScreen() {
  const { feedings, setFeedings } = useApp();
  const [show, setShow] = useState(false);
  const [type, setType] = useState<FeedingType>('breast');
  const [side, setSide] = useState<'left' | 'right' | 'both'>('left');
  const [duration, setDuration] = useState('15');
  const [amount, setAmount] = useState('120');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState(new Date());
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const todayF = todayFeedings(feedings).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const breastMins = todayF.filter((f) => f.type === 'breast').reduce((a, f) => a + (f.duration || 0), 0);
  const bottleMl = todayF.filter((f) => f.type === 'bottle').reduce((a, f) => a + (f.amount || 0), 0);

  const save = () => {
    const ts = new Date(time);
    setFeedings((p) => [
      {
        id: genId(),
        timestamp: ts.toISOString(),
        type,
        side: type === 'breast' ? side : undefined,
        duration: type === 'breast' ? Number(duration) || undefined : undefined,
        amount: type === 'bottle' ? Number(amount) || undefined : undefined,
        notes: notes || undefined,
      },
      ...p,
    ]);
    setNotes('');
    setTime(new Date());
    setShow(false);
  };

  const feedIcon = (t: FeedingType) => (t === 'breast' ? '🤱' : t === 'bottle' ? '🍼' : '🥣');
  const feedDetail = (f: FeedingEntry) => {
    if (f.type === 'breast') return `${f.side ? f.side.charAt(0).toUpperCase() + f.side.slice(1) : ''} · ${f.duration ?? '?'}m`;
    if (f.type === 'bottle') return `${f.amount ?? '?'}ml`;
    return 'Solid food';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Feeding</Text>
          <Text style={styles.sub}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>
        <TouchableOpacity style={styles.logBtn} onPress={() => { setTime(new Date()); setShow(true); }}>
          <Plus size={15} color={colors.primaryForeground} />
          <Text style={styles.logBtnText}>Log</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        {[
          { value: String(todayF.length), label: 'Sessions' },
          { value: bottleMl > 0 ? `${bottleMl}ml` : '—', label: 'Bottle' },
          { value: breastMins > 0 ? minsToHM(breastMins) : '—', label: 'Breast' },
        ].map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Today's Log</Text>
      {todayF.length === 0 ? (
        <EmptyState icon={<Droplets size={22} color={colors.mutedForeground} />} title="No feedings yet" desc="Tap 'Log' to record today's first feeding." />
      ) : (
        <View style={styles.list}>
          {todayF.map((f, i) => (
            <View key={f.id} style={[styles.listItem, i > 0 && styles.listBorder]}>
              <Text style={styles.emoji}>{feedIcon(f.type)}</Text>
              <View style={styles.listBody}>
                <Text style={styles.listTitle}>
                  {f.type === 'breast' ? 'Breastfeed' : f.type === 'bottle' ? 'Bottle' : 'Solid Food'}
                </Text>
                <Text style={styles.listSub}>{feedDetail(f)}{f.notes ? ` · ${f.notes}` : ''}</Text>
              </View>
              <Text style={styles.listTime}>{safeFormatTime(f.timestamp)}</Text>
              <TouchableOpacity onPress={() => setConfirmId(f.id)}>
                <Trash2 size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.tip}>
        <Sun size={17} color={colors.amber500} />
        <Text style={styles.tipText}>
          <Text style={styles.tipBold}>Tip: </Text>
          Newborns feed 8–12 times/day. By 3–4 months, 5–7 times is typical.
        </Text>
      </View>

      <ConfirmDeleteModal
        visible={!!confirmId}
        message="This feeding entry will be permanently removed from today's log."
        onConfirm={() => confirmId && setFeedings((p) => p.filter((f) => f.id !== confirmId))}
        onClose={() => setConfirmId(null)}
      />

      <Modal title="Log Feeding" visible={show} onClose={() => setShow(false)}>
        <FL>Type</FL>
        <ToggleGroup
          options={[
            { value: 'breast' as FeedingType, label: '🤱 Breast' },
            { value: 'bottle' as FeedingType, label: '🍼 Bottle' },
            { value: 'solid' as FeedingType, label: '🥣 Solid' },
          ]}
          value={type}
          onChange={setType}
        />
        <TimePickerField label="Time" value={time} onChange={setTime} />
        {type === 'breast' && (
          <>
            <FL>Side</FL>
            <ToggleGroup
              options={[
                { value: 'left' as const, label: 'Left' },
                { value: 'right' as const, label: 'Right' },
                { value: 'both' as const, label: 'Both' },
              ]}
              value={side}
              onChange={setSide}
            />
            <FL>Duration (minutes)</FL>
            <TI value={duration} onChangeText={setDuration} keyboardType="numeric" />
          </>
        )}
        {type === 'bottle' && (
          <>
            <FL>Amount (ml)</FL>
            <TI value={amount} onChangeText={setAmount} keyboardType="numeric" />
          </>
        )}
        <FL>Notes (optional)</FL>
        <TI value={notes} onChangeText={setNotes} placeholder="e.g. seemed very hungry, fussy after…" />
        <PBtn onPress={save}>Save Feeding</PBtn>
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
  statValue: { fontSize: 20, fontWeight: '700', color: colors.foreground },
  statLabel: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1 },
  list: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  listBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  emoji: { fontSize: 20 },
  listBody: { flex: 1 },
  listTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  listSub: { fontSize: 12, color: colors.mutedForeground },
  listTime: { fontSize: 12, color: colors.mutedForeground },
  tip: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.amber50,
    borderWidth: 1,
    borderColor: colors.amber200,
    borderRadius: 16,
    padding: 16,
  },
  tipText: { flex: 1, fontSize: 14, color: colors.amber800, lineHeight: 20 },
  tipBold: { fontWeight: '700', color: colors.amber900 },
});
