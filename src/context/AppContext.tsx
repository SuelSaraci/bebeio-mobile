import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type {
  Appointment,
  BabyProfile,
  DiaperEntry,
  FeedingEntry,
  GrowthEntry,
  MedicalNote,
  Milestone,
  Screen,
  SleepEntry,
  Vaccination,
} from '../types';
import {
  makeDefaultAppointments,
  makeDefaultDiapers,
  makeDefaultFeedings,
  makeDefaultGrowth,
  makeDefaultMilestones,
  makeDefaultSleep,
  makeDefaultVaccinations,
} from '../defaults';

interface AppContextValue {
  screen: Screen;
  setScreen: (s: Screen) => void;
  baby: BabyProfile | null;
  onBabySetup: (profile: BabyProfile) => void;
  logout: () => void;
  feedings: FeedingEntry[];
  setFeedings: React.Dispatch<React.SetStateAction<FeedingEntry[]>>;
  sleepEntries: SleepEntry[];
  setSleepEntries: React.Dispatch<React.SetStateAction<SleepEntry[]>>;
  diapers: DiaperEntry[];
  setDiapers: React.Dispatch<React.SetStateAction<DiaperEntry[]>>;
  growth: GrowthEntry[];
  setGrowth: React.Dispatch<React.SetStateAction<GrowthEntry[]>>;
  vaccinations: Vaccination[];
  setVaccinations: React.Dispatch<React.SetStateAction<Vaccination[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  medNotes: MedicalNote[];
  setMedNotes: React.Dispatch<React.SetStateAction<MedicalNote[]>>;
  milestones: Milestone[];
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>('login');
  const [baby, setBaby] = useState<BabyProfile | null>(null);
  const [feedings, setFeedings] = useState<FeedingEntry[]>([]);
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [diapers, setDiapers] = useState<DiaperEntry[]>([]);
  const [growth, setGrowth] = useState<GrowthEntry[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medNotes, setMedNotes] = useState<MedicalNote[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const onBabySetup = (profile: BabyProfile) => {
    setBaby(profile);
    setFeedings(makeDefaultFeedings());
    setSleepEntries(makeDefaultSleep());
    setDiapers(makeDefaultDiapers());
    setGrowth(makeDefaultGrowth(profile.birthDate));
    setVaccinations(makeDefaultVaccinations(profile.birthDate));
    setAppointments(makeDefaultAppointments(profile.birthDate));
    setMilestones(makeDefaultMilestones());
    setMedNotes([]);
    setScreen('app');
  };

  const logout = () => {
    setBaby(null);
    setScreen('login');
  };

  return (
    <AppContext.Provider
      value={{
        screen,
        setScreen,
        baby,
        onBabySetup,
        logout,
        feedings,
        setFeedings,
        sleepEntries,
        setSleepEntries,
        diapers,
        setDiapers,
        growth,
        setGrowth,
        vaccinations,
        setVaccinations,
        appointments,
        setAppointments,
        medNotes,
        setMedNotes,
        milestones,
        setMilestones,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
