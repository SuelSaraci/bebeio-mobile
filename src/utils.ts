import { format, differenceInWeeks, parseISO } from 'date-fns';
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

export const todayFeedings = (logs: FeedingEntry[]) =>
  logs.filter((f) => f.timestamp.startsWith(todayStr()));

export const todayDiapers = (logs: DiaperEntry[]) =>
  logs.filter((d) => d.timestamp.startsWith(todayStr()));

export const todaySleepMins = (logs: SleepEntry[]): number =>
  logs
    .filter((s) => s.start.startsWith(todayStr()) || s.end.startsWith(todayStr()))
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

export const safeDate = (d: string) => {
  try {
    return format(parseISO(d), 'MMM d, yyyy');
  } catch {
    return d;
  }
};
