import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { FeedingTypeIcon } from './ActivityIcons';
import { colors } from '../theme/colors';
import { safeFormatTime } from '../utils';
import type { FeedingEntry } from '../types';

export function feedingDetail(f: FeedingEntry) {
  if (f.type === 'breast') {
    const side = f.side ? f.side.charAt(0).toUpperCase() + f.side.slice(1) : '';
    return `${side} · ${f.duration ?? '?'}m`;
  }
  if (f.type === 'bottle') return `${f.amount ?? '?'}ml`;
  return 'Solid food';
}

export function feedingTitle(f: FeedingEntry) {
  if (f.type === 'breast') return 'Breastfeed';
  if (f.type === 'bottle') return 'Bottle';
  return 'Solid Food';
}

interface FeedingListProps {
  entries: FeedingEntry[];
  onDelete?: (id: string) => void;
  mutating?: boolean;
  readOnly?: boolean;
}

export function FeedingList({ entries, onDelete, mutating, readOnly }: FeedingListProps) {
  if (entries.length === 0) return null;

  return (
    <View style={styles.list}>
      {entries.map((f, i) => (
        <View key={f.id} style={[styles.listItem, i > 0 && styles.listBorder]}>
          <View style={styles.listIcon}>
            <FeedingTypeIcon type={f.type} size={18} color={colors.primary} />
          </View>
          <View style={styles.listBody}>
            <Text style={styles.listTitle}>{feedingTitle(f)}</Text>
            <Text style={styles.listSub}>
              {feedingDetail(f)}{f.notes ? ` · ${f.notes}` : ''}
            </Text>
          </View>
          <Text style={styles.listTime}>{safeFormatTime(f.timestamp)}</Text>
          {!readOnly && onDelete ? (
            <TouchableOpacity onPress={() => onDelete(f.id)} disabled={mutating}>
              <Trash2 size={14} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </View>
  );
}

interface FeedingDayGroup {
  dayKey: string;
  heading: string;
  items: FeedingEntry[];
}

interface FeedingHistoryProps {
  groups: FeedingDayGroup[];
  onDelete?: (id: string) => void;
  mutating?: boolean;
  readOnly?: boolean;
}

export function FeedingHistory({ groups, onDelete, mutating, readOnly }: FeedingHistoryProps) {
  return (
    <View style={styles.history}>
      {groups.map((group) => (
        <View key={group.dayKey} style={styles.dayGroup}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayHeading}>{group.heading}</Text>
            <Text style={styles.dayCount}>
              {group.items.length} session{group.items.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <FeedingList
            entries={group.items}
            onDelete={onDelete}
            mutating={mutating}
            readOnly={readOnly}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  history: { gap: 20 },
  dayGroup: { gap: 8 },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  dayCount: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  list: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  listBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listBody: { flex: 1 },
  listTitle: { fontSize: 14, fontWeight: '700', color: colors.foreground },
  listSub: { fontSize: 12, color: colors.mutedForeground },
  listTime: { fontSize: 12, color: colors.mutedForeground },
});
