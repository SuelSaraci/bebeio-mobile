import { differenceInWeeks, format, parseISO } from 'date-fns';
import { genId, todayStr } from './utils';
import type {
  Appointment,
  DiaperEntry,
  FeedingEntry,
  GrowthEntry,
  Milestone,
  SleepEntry,
  Vaccination,
} from './types';

export const makeDefaultFeedings = (): FeedingEntry[] => {
  const t = todayStr();
  return [
    { id: genId(), timestamp: `${t}T07:12:00`, type: 'breast', side: 'left', duration: 18 },
    { id: genId(), timestamp: `${t}T09:45:00`, type: 'breast', side: 'right', duration: 22 },
    { id: genId(), timestamp: `${t}T12:30:00`, type: 'bottle', amount: 120 },
    { id: genId(), timestamp: `${t}T15:15:00`, type: 'breast', side: 'left', duration: 15 },
    { id: genId(), timestamp: `${t}T17:50:00`, type: 'breast', side: 'right', duration: 20 },
    { id: genId(), timestamp: `${t}T20:20:00`, type: 'bottle', amount: 90 },
  ];
};

export const makeDefaultSleep = (): SleepEntry[] => {
  const t = todayStr();
  return [
    { id: genId(), start: `${t}T09:15:00`, end: `${t}T10:45:00`, type: 'nap' },
    { id: genId(), start: `${t}T14:00:00`, end: `${t}T15:30:00`, type: 'nap' },
  ];
};

export const makeDefaultDiapers = (): DiaperEntry[] => {
  const t = todayStr();
  return [
    { id: genId(), timestamp: `${t}T07:30:00`, type: 'wet' },
    { id: genId(), timestamp: `${t}T09:00:00`, type: 'dirty' },
    { id: genId(), timestamp: `${t}T12:00:00`, type: 'wet' },
    { id: genId(), timestamp: `${t}T14:30:00`, type: 'both' },
  ];
};

export const makeDefaultGrowth = (birthDate: string): GrowthEntry[] => {
  try {
    const bd = parseISO(birthDate);
    const entries: GrowthEntry[] = [];
    const weeksNow = differenceInWeeks(new Date(), bd);
    const step = Math.max(2, Math.floor(weeksNow / 7));
    for (let w = 0; w <= weeksNow; w += step) {
      const d = new Date(bd);
      d.setDate(d.getDate() + w * 7);
      if (d <= new Date()) {
        entries.push({
          id: genId(),
          date: format(d, 'yyyy-MM-dd'),
          weight: parseFloat((3.2 + w * 0.19).toFixed(1)),
          height: parseFloat((50 + w * 0.75).toFixed(1)),
          headCirc: parseFloat((35 + w * 0.35).toFixed(1)),
        });
      }
    }
    return entries;
  } catch {
    return [];
  }
};

export const makeDefaultVaccinations = (birthDate: string): Vaccination[] => {
  try {
    const bd = parseISO(birthDate);
    const at2m = new Date(bd);
    at2m.setMonth(at2m.getMonth() + 2);
    const at4m = new Date(bd);
    at4m.setMonth(at4m.getMonth() + 4);
    const at6m = new Date(bd);
    at6m.setMonth(at6m.getMonth() + 6);
    const at12m = new Date(bd);
    at12m.setMonth(at12m.getMonth() + 12);
    const at18m = new Date(bd);
    at18m.setMonth(at18m.getMonth() + 18);
    const w = differenceInWeeks(new Date(), bd);
    return [
      { id: genId(), name: 'Hepatitis B (Birth dose)', scheduledDate: format(bd, 'yyyy-MM-dd'), done: true, completedDate: format(bd, 'yyyy-MM-dd') },
      { id: genId(), name: '2-Month Vaccines (DTaP, Hib, PCV, IPV, RV)', scheduledDate: format(at2m, 'yyyy-MM-dd'), done: w >= 10, completedDate: w >= 10 ? format(at2m, 'yyyy-MM-dd') : undefined },
      { id: genId(), name: '4-Month Vaccines (DTaP, Hib, PCV, IPV, RV)', scheduledDate: format(at4m, 'yyyy-MM-dd'), done: w >= 18, completedDate: w >= 18 ? format(at4m, 'yyyy-MM-dd') : undefined },
      { id: genId(), name: '6-Month Vaccines (DTaP, Hib, PCV, HepB, Flu)', scheduledDate: format(at6m, 'yyyy-MM-dd'), done: w >= 26 },
      { id: genId(), name: '12-Month Vaccines (MMR, Varicella, HepA)', scheduledDate: format(at12m, 'yyyy-MM-dd'), done: w >= 52 },
      { id: genId(), name: '18-Month Vaccines (DTaP booster, HepA 2nd)', scheduledDate: format(at18m, 'yyyy-MM-dd'), done: w >= 78 },
    ];
  } catch {
    return [];
  }
};

export const makeDefaultMilestones = (): Milestone[] => [
  { id: genId(), title: 'Social Smile', expectedWeeks: '6–8 wks', done: true, achievedDate: 'Mar 15' },
  { id: genId(), title: 'Tracks Moving Objects', expectedWeeks: '8–10 wks', done: true, achievedDate: 'Mar 28' },
  { id: genId(), title: 'Holds Head Steady', expectedWeeks: '12 wks', done: true, achievedDate: 'Apr 5' },
  { id: genId(), title: 'Laughs Out Loud', expectedWeeks: '~16–17 wks', done: false },
  { id: genId(), title: 'Rolls Front to Back', expectedWeeks: '~18–20 wks', done: false },
  { id: genId(), title: 'Reaches for Objects', expectedWeeks: '~20 wks', done: false },
  { id: genId(), title: 'Sits with Support', expectedWeeks: '~24 wks', done: false },
  { id: genId(), title: 'First Solid Foods', expectedWeeks: '~24–26 wks', done: false },
];

export const makeDefaultAppointments = (birthDate: string): Appointment[] => {
  try {
    const bd = parseISO(birthDate);
    const at4m = new Date(bd);
    at4m.setMonth(at4m.getMonth() + 4);
    const at6m = new Date(bd);
    at6m.setMonth(at6m.getMonth() + 6);
    return [
      { id: genId(), doctor: 'Dr. Sarah Miller', specialty: 'Pediatrician', date: format(at4m, 'yyyy-MM-dd'), time: '10:30', type: '4-Month Checkup' },
      { id: genId(), doctor: 'Dr. Sarah Miller', specialty: 'Pediatrician', date: format(at6m, 'yyyy-MM-dd'), time: '09:00', type: '6-Month Checkup' },
    ];
  } catch {
    return [];
  }
};
