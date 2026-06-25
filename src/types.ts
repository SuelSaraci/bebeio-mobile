export type Screen = 'login' | 'signup' | 'setup' | 'app';
export type Tab = 'home' | 'feeding' | 'sleep' | 'growth' | 'health' | 'ai';
export type FeedingType = 'breast' | 'bottle' | 'solid';
export type SleepType = 'night' | 'nap';
export type DiaperType = 'wet' | 'dirty' | 'both';

export interface BabyProfile {
  name: string;
  birthDate: string;
  gender: 'girl' | 'boy';
  birthWeight: number;
}

export interface FeedingEntry {
  id: string;
  timestamp: string;
  type: FeedingType;
  side?: 'left' | 'right' | 'both';
  duration?: number;
  amount?: number;
  notes?: string;
}

export interface SleepEntry {
  id: string;
  start: string;
  end: string;
  type: SleepType;
  notes?: string;
}

export interface DiaperEntry {
  id: string;
  timestamp: string;
  type: DiaperType;
}

export interface GrowthEntry {
  id: string;
  date: string;
  weight?: number;
  height?: number;
  headCirc?: number;
}

export interface Vaccination {
  id: string;
  name: string;
  scheduledDate: string;
  done: boolean;
  completedDate?: string;
}

export interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: string;
}

export interface Milestone {
  id: string;
  title: string;
  expectedWeeks: string;
  done: boolean;
  achievedDate?: string;
}

export interface MedicalNote {
  id: string;
  date: string;
  title: string;
  content: string;
}
