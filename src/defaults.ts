import { format, parseISO } from 'date-fns';
import type { Appointment, Milestone, Vaccination } from './types';

const genId = () => Math.random().toString(36).slice(2, 10);

const addMonths = (birth: Date, months: number): Date => {
  const d = new Date(birth);
  d.setMonth(d.getMonth() + months);
  return d;
};

const vax = (name: string, date: Date): Vaccination => ({
  id: genId(),
  name,
  scheduledDate: format(date, 'yyyy-MM-dd'),
  done: false,
});

/** Essential infant vaccines only — user can add boosters and others in Health. */
export const makeDefaultVaccinations = (birthDate: string): Vaccination[] => {
  try {
    const bd = parseISO(birthDate);
    const at2m = addMonths(bd, 2);
    const at12m = addMonths(bd, 12);

    return [
      vax('Hepatitis B — birth dose', bd),
      vax('DTaP (Whooping cough) — 2 months', at2m),
      vax('Hib — 2 months', at2m),
      vax('PCV (Pneumococcal) — 2 months', at2m),
      vax('Polio (IPV) — 2 months', at2m),
      vax('Rotavirus (RV) — 2 months', at2m),
      vax('MMR — 12 months', at12m),
      vax('Hepatitis A — 12 months', at12m),
    ];
  } catch {
    return [];
  }
};

export const makeDefaultMilestones = (_birthDate: string): Milestone[] => [
  { id: genId(), title: 'Startles at Loud Sounds', expectedWeeks: 'birth–2 wks', done: false },
  { id: genId(), title: 'Focuses on Faces', expectedWeeks: '2–4 wks', done: false },
  { id: genId(), title: "Recognizes Parent's Voice", expectedWeeks: '2–4 wks', done: false },
  { id: genId(), title: 'Lifts Head Briefly (tummy time)', expectedWeeks: '3–5 wks', done: false },
  { id: genId(), title: 'Follows Objects with Eyes', expectedWeeks: '4–6 wks', done: false },
  { id: genId(), title: 'Social Smile', expectedWeeks: '6–8 wks', done: false },
  { id: genId(), title: 'Tracks Moving Objects', expectedWeeks: '8–10 wks', done: false },
  { id: genId(), title: 'Holds Head Steady', expectedWeeks: '12 wks', done: false },
  { id: genId(), title: 'Laughs Out Loud', expectedWeeks: '~16–17 wks', done: false },
  { id: genId(), title: 'Rolls Front to Back', expectedWeeks: '~18–20 wks', done: false },
  { id: genId(), title: 'Reaches for Objects', expectedWeeks: '~20 wks', done: false },
  { id: genId(), title: 'Sits with Support', expectedWeeks: '~24 wks', done: false },
  { id: genId(), title: 'First Solid Foods', expectedWeeks: '~24–26 wks', done: false },
];

export const makeDefaultAppointments = (birthDate: string): Appointment[] => {
  try {
    const bd = parseISO(birthDate);
    const at4m = addMonths(bd, 4);
    const at6m = addMonths(bd, 6);
    return [
      { id: genId(), doctor: 'Dr. Sarah Miller', specialty: 'Pediatrician', date: format(at4m, 'yyyy-MM-dd'), time: '10:30', type: '4-Month Checkup', done: false },
      { id: genId(), doctor: 'Dr. Sarah Miller', specialty: 'Pediatrician', date: format(at6m, 'yyyy-MM-dd'), time: '09:00', type: '6-Month Checkup', done: false },
    ];
  } catch {
    return [];
  }
};
