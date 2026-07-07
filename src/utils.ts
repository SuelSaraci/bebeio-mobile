import { format, differenceInWeeks, isValid, parseISO, subDays } from 'date-fns';
import type { DiaperEntry, FeedingEntry, SleepEntry } from './types';

export const genId = () => Math.random().toString(36).slice(2, 10);

export const todayStr = () => format(new Date(), 'yyyy-MM-dd');

export const getBabyAge = (birthDate: string): string => {
  try {
    const weeks = differenceInWeeks(new Date(), parseISO(birthDate));
    if (weeks < 16) return `${weeks} week${weeks !== 1 ? 's' : ''} old`;
    const months = Math.floor(weeks / 4.33);
    if (months < 24) return `${months} month${months !== 1 ? 's' : ''} old`;
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? 's' : ''} old`;
  } catch {
    return 'Newborn';
  }
};

export const safeFormatTime = (isoStr: string) => {
  try {
    return format(parseISO(isoStr), 'h:mm a');
  } catch {
    return isoStr;
  }
};

export const isFutureTimestamp = (isoStr: string) => {
  try {
    return parseISO(isoStr).getTime() > Date.now();
  } catch {
    return false;
  }
};

export const calcDuration = (start: string, end: string): string => {
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 60000;
  if (diff <= 0) return '—';
  const h = Math.floor(diff / 60);
  const m = Math.round(diff % 60);
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
};

export const minsToHM = (mins: number): string => {
  if (mins <= 0) return '—';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
};

/** Compare calendar day in the device's local timezone (not UTC date prefix). */
export const isLocalToday = (isoStr: string) => {
  try {
    const d = parseISO(isoStr);
    return isValid(d) && format(d, 'yyyy-MM-dd') === todayStr();
  } catch {
    return false;
  }
};

export const todayFeedings = (logs: FeedingEntry[]) =>
  logs.filter((f) => isLocalToday(f.timestamp));

export const todayDiapers = (logs: DiaperEntry[]) =>
  logs.filter((d) => isLocalToday(d.timestamp));

export const todaySleepMins = (logs: SleepEntry[]): number =>
  logs
    .filter((s) => isLocalToday(s.start) || isLocalToday(s.end))
    .reduce((acc, s) => {
      const diff = (new Date(s.end).getTime() - new Date(s.start).getTime()) / 60000;
      return acc + Math.max(0, diff);
    }, 0);

export const timeToDate = (timeStr: string): Date => {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

export const dateToTimeStr = (d: Date) => format(d, 'HH:mm');

/** Overnight sleep: if end is not after start on the same calendar day, assume next day. */
export const resolveSleepEnd = (start: Date, end: Date): Date => {
  const resolved = new Date(end);
  if (resolved.getTime() <= start.getTime()) {
    resolved.setDate(resolved.getDate() + 1);
  }
  return resolved;
};

export const safeDate = (d: string) => {
  if (!d) return '';
  try {
    const normalized = d.length === 10 ? `${d}T12:00:00` : d;
    return format(parseISO(normalized), 'MMM d, yyyy');
  } catch {
    return d;
  }
};

export const localDayKey = (isoStr: string) => {
  try {
    return format(parseISO(isoStr), 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

export const formatDayHeading = (dayKey: string) => {
  if (!dayKey) return '';
  const today = todayStr();
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  if (dayKey === today) return 'Today';
  if (dayKey === yesterday) return 'Yesterday';
  try {
    return format(parseISO(`${dayKey}T12:00:00`), 'EEEE, MMMM d');
  } catch {
    return dayKey;
  }
};

export function groupByLocalDay<T>(
  items: T[],
  getTimestamp: (item: T) => string,
): { dayKey: string; heading: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = localDayKey(getTimestamp(item));
    if (!key) continue;
    const bucket = map.get(key) ?? [];
    bucket.push(item);
    map.set(key, bucket);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dayKey, dayItems]) => ({
      dayKey,
      heading: formatDayHeading(dayKey),
      items: [...dayItems].sort((a, b) => getTimestamp(b).localeCompare(getTimestamp(a))),
    }));
}
