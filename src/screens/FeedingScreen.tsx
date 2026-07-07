import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { format } from 'date-fns';
import { Plus, Sun } from 'lucide-react-native';
import { BottleIcon } from '../components/BottleIcon';
import { FeedingTypeIcon } from '../components/ActivityIcons';
import { FeedingHistory, FeedingList } from '../components/FeedingList';
import { useApp } from '../context/AppContext';
import { useFeatureGate } from '../hooks/useFeatureGate';
import { useToast } from '../components/Toast';
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
import { logger } from '../lib/logger';
import { FREE_FEATURE_LIMIT, freeLimitHint } from '../lib/plans';
import { parseDecimalInput } from '../lib/validation';
import { isIosAppStoreCompanionMode } from '../lib/upgradeWeb';
import { getApiBaseUrl } from '../lib/api';
import {
  minsToHM,
  todayFeedings,
  isLocalToday,
  groupByLocalDay,
  todayStr,
} from '../utils';
import { useSubscription } from '../context/SubscriptionContext';
import type { FeedingType } from '../types';

export function FeedingScreen() {
  const { feedings, addFeeding, deleteFeeding, mutating } = useApp();
  const { gateAdd, handleAddSaveResult } = useFeatureGate();
  const { showError, showSuccess } = useToast();
  const { isPremium } = useSubscription();
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
  const atFreeLimit = !isPremium && feedings.length >= FREE_FEATURE_LIMIT;
  const companionMode = isIosAppStoreCompanionMode();

  const historyGroups = useMemo(
    () =>
      groupByLocalDay(
        feedings.filter((f) => !isLocalToday(f.timestamp)),
        (f) => f.timestamp,
      ).filter((g) => g.dayKey !== todayStr()),
    [feedings],
  );

  const save = async () => {
    if (mutating) {
      logger.warn('feeding', 'save ignored — mutating=true');
      return;
    }
    const payload = {
      timestamp: new Date(time).toISOString(),
      type,
      side: type === 'breast' ? side : undefined,
      duration: type === 'breast' ? parseDecimalInput(duration) : undefined,
      amount: type === 'bottle' ? parseDecimalInput(amount) : undefined,
      notes: notes || undefined,
    };
    logger.feeding('save tapped', {
      apiUrl: getApiBaseUrl(),
      payload,
      todayCount: todayF.length,
      totalCount: feedings.length,
    });
    try {
      const ok = await addFeeding(payload);
      logger.feeding('save result', { ok });
      const result = handleAddSaveResult(ok, 'feeding', () => setShow(false), () => {
        setNotes('');
        setTime(new Date());
        setShow(false);
        showSuccess('Feeding saved');
      });
      if (result === 'failed') {
        logger.warn('feeding', 'save returned undefined (mutation skipped?)');
        showError('Could not save feeding. Please try again.');
      }
    } catch (error) {
      logger.error('feeding', 'save threw', error);
      showError('Could not save feeding. Check your connection and try again.');
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Feeding</Text>
            <Text style={styles.sub}>{format(new Date(), 'EEEE, MMMM d')}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            disabled={mutating}
            onPress={() => gateAdd(feedings.length, 'feeding', () => { setTime(new Date()); setShow(true); })}
          >
            <Plus size={15} color={colors.primaryForeground} />
            <Text style={styles.addBtnText}>Add</Text>
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

        {!isPremium && feedings.length > 0 && (
          <View style={[styles.limitBanner, atFreeLimit && styles.limitBannerFull]}>
            <Text style={styles.limitBannerText}>
              {feedings.length} of {FREE_FEATURE_LIMIT} free feeding logs used
              {freeLimitHint(atFreeLimit, companionMode)}
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>Today's Feedings</Text>
        {todayF.length === 0 ? (
          <EmptyState
            icon={<BottleIcon size={22} color={colors.mutedForeground} />}
            title="No feedings today"
            desc="Tap 'Add' to record today's first feeding."
          />
        ) : (
          <FeedingList
            entries={todayF}
            onDelete={(id) => setConfirmId(id)}
            mutating={mutating}
          />
        )}

        {historyGroups.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Past 30 days</Text>
            <FeedingHistory
              groups={historyGroups}
              onDelete={(id) => setConfirmId(id)}
              mutating={mutating}
            />
          </>
        )}

        <View style={styles.tip}>
          <Sun size={17} color={colors.amber500} />
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>Tip: </Text>
            Newborns feed 8–12 times/day. By 3–4 months, 5–7 times is typical.
          </Text>
        </View>
      </ScrollView>

      <ConfirmDeleteModal
        visible={!!confirmId}
        message="This feeding entry will be permanently removed."
        onConfirm={() => confirmId && deleteFeeding(confirmId)}
        onClose={() => setConfirmId(null)}
        loading={mutating}
      />

      <Modal title="Add Feeding" visible={show} onClose={() => setShow(false)} disableClose={mutating}>
        <FL>Type</FL>
        <ToggleGroup
          options={[
            {
              value: 'breast' as FeedingType,
              label: 'Breast',
              icon: <FeedingTypeIcon type="breast" size={16} color={type === 'breast' ? colors.primary : colors.mutedForeground} />,
            },
            {
              value: 'bottle' as FeedingType,
              label: 'Bottle',
              icon: <FeedingTypeIcon type="bottle" size={16} color={type === 'bottle' ? colors.primary : colors.mutedForeground} />,
            },
            {
              value: 'solid' as FeedingType,
              label: 'Solid',
              icon: <FeedingTypeIcon type="solid" size={16} color={type === 'solid' ? colors.primary : colors.mutedForeground} />,
            },
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
        <PBtn onPress={save} loading={mutating} disabled={mutating}>Save Feeding</PBtn>
      </Modal>
    </>
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
  limitBanner: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  limitBannerFull: {
    backgroundColor: colors.amber50,
    borderColor: colors.amber200,
  },
  limitBannerText: { fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },
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