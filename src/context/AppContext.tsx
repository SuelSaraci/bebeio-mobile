import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
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
} from "../types";
import { makeDefaultMilestones, makeDefaultVaccinations } from "../defaults";
import { auth } from "../lib/firebase";
import { api, ApiError } from "../lib/api";
import {
  loginWithEmail,
  logoutUser,
  mapFirebaseAuthError,
  signupWithEmail,
} from "../lib/auth";
import {
  bindNotificationRefresh,
  clearScheduledNotifications,
  refreshNotificationSchedule,
  setupNotificationsForUser,
  triggerNotificationRefresh,
  unbindNotificationRefresh,
  unregisterPushTokenFromApi,
  wasNotificationPromptShown,
  type NotificationScheduleInput,
} from "../lib/notifications";
import { SubscriptionProvider, useSubscription } from "./SubscriptionContext";
import { isFreeLimitError } from "../lib/api";
import { openUpgradeWebsiteOnLimit } from "../lib/upgradeWeb";

const stripId = <T extends { id: string }>(items: T[]): Omit<T, "id">[] =>
  items.map(({ id: _id, ...rest }) => rest);

interface AppContextValue {
  screen: Screen;
  setScreen: (s: Screen) => void;
  authLoading: boolean;
  loading: boolean;
  mutating: boolean;
  profile: { name: string; has_completed_onboarding: boolean } | null;
  baby: BabyProfile | null;
  feedings: FeedingEntry[];
  sleepEntries: SleepEntry[];
  diapers: DiaperEntry[];
  growth: GrowthEntry[];
  vaccinations: Vaccination[];
  appointments: Appointment[];
  medNotes: MedicalNote[];
  milestones: Milestone[];
  userMilestoneCount: number;
  userVaccinationCount: number;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  onBabySetup: (profile: Omit<BabyProfile, "id">) => Promise<void>;
  addFeeding: (entry: Omit<FeedingEntry, "id">) => Promise<void>;
  deleteFeeding: (id: string) => Promise<void>;
  addSleep: (entry: Omit<SleepEntry, "id">) => Promise<void>;
  deleteSleep: (id: string) => Promise<void>;
  addDiaper: (entry: Omit<DiaperEntry, "id">) => Promise<void>;
  deleteDiaper: (id: string) => Promise<void>;
  addGrowth: (entry: Omit<GrowthEntry, "id">) => Promise<void>;
  deleteGrowth: (id: string) => Promise<void>;
  addMilestone: (entry: Omit<Milestone, "id">) => Promise<void>;
  toggleMilestone: (
    id: string,
    done: boolean,
    achievedDate?: string,
  ) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
  updateVaccination: (
    id: string,
    data: { done: boolean; completedDate?: string },
  ) => Promise<void>;
  addVaccination: (entry: Omit<Vaccination, "id">) => Promise<void>;
  deleteVaccination: (id: string) => Promise<void>;
  addAppointment: (entry: Omit<Appointment, "id">) => Promise<void>;
  updateAppointment: (
    id: string,
    data: { done: boolean; completedDate?: string },
  ) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  addMedNote: (entry: Omit<MedicalNote, "id">) => Promise<void>;
  updateMedNote: (
    id: string,
    data: { done: boolean; completedDate?: string },
  ) => Promise<void>;
  deleteMedNote: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <SubscriptionProvider>
      <AppProviderInner>{children}</AppProviderInner>
    </SubscriptionProvider>
  );
}

function AppProviderInner({ children }: { children: ReactNode }) {
  const { refreshSubscriptionState } = useSubscription();
  const [screen, setScreen] = useState<Screen>("login");
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const mutatingRef = useRef(false);
  const [profile, setProfile] = useState<{
    name: string;
    has_completed_onboarding: boolean;
  } | null>(null);
  const [baby, setBaby] = useState<BabyProfile | null>(null);
  const [feedings, setFeedings] = useState<FeedingEntry[]>([]);
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [diapers, setDiapers] = useState<DiaperEntry[]>([]);
  const [growth, setGrowth] = useState<GrowthEntry[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medNotes, setMedNotes] = useState<MedicalNote[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const baselineVaxCount = useRef<number | null>(null);
  const baselineMsCount = useRef<number | null>(null);
  const notificationInputRef = useRef<NotificationScheduleInput | null>(null);

  const buildNotificationInput = useCallback(
    (overrides?: Partial<NotificationScheduleInput>): NotificationScheduleInput | null => {
      if (!baby) return null;
      return {
        baby,
        vaccinations: overrides?.vaccinations ?? vaccinations,
        appointments: overrides?.appointments ?? appointments,
        feedings: overrides?.feedings ?? feedings,
        sleepEntries: overrides?.sleepEntries ?? sleepEntries,
        diapers: overrides?.diapers ?? diapers,
      };
    },
    [baby, vaccinations, appointments, feedings, sleepEntries, diapers],
  );

  const syncNotifications = useCallback(
    (overrides?: Partial<NotificationScheduleInput>) => {
      const input = buildNotificationInput(overrides);
      if (!input) return;
      notificationInputRef.current = input;
      triggerNotificationRefresh(input);
    },
    [buildNotificationInput],
  );

  useEffect(() => {
    bindNotificationRefresh(() => notificationInputRef.current);
    return () => unbindNotificationRefresh();
  }, []);

  useEffect(() => {
    notificationInputRef.current = buildNotificationInput();
  }, [buildNotificationInput]);

  const clearData = useCallback(() => {
    setBaby(null);
    setProfile(null);
    setFeedings([]);
    setSleepEntries([]);
    setDiapers([]);
    setGrowth([]);
    setVaccinations([]);
    setAppointments([]);
    setMedNotes([]);
    setMilestones([]);
    baselineVaxCount.current = null;
    baselineMsCount.current = null;
  }, []);

  const applyData = useCallback(
    (data: Awaited<ReturnType<typeof api.loadAllData>>) => {
      setBaby(data.baby);
      setProfile(data.profile);
      setFeedings(data.feedings);
      setSleepEntries(data.sleepEntries);
      setDiapers(data.diapers);
      setGrowth(data.growth);
      setVaccinations(data.vaccinations);
      setAppointments(data.appointments);
      setMedNotes(data.medNotes);
      setMilestones(data.milestones);
      if (baselineVaxCount.current === null) {
        baselineVaxCount.current = data.vaccinations.length;
      }
      if (baselineMsCount.current === null) {
        baselineMsCount.current = data.milestones.length;
      }
    },
    [],
  );

  const routeAfterAuth = useCallback(async (hasBaby: boolean) => {
    if (hasBaby) {
      setScreen("app");
    } else {
      setScreen("setup");
    }
  }, []);

  const loadUserData = useCallback(async () => {
    const data = await api.loadAllData();
    applyData(data);
    await routeAfterAuth(Boolean(data.baby));

    if (data.baby) {
      const prompted = await wasNotificationPromptShown();
      if (!prompted) {
        await setupNotificationsForUser({
          baby: data.baby,
          vaccinations: data.vaccinations,
          appointments: data.appointments,
          feedings: data.feedings,
          sleepEntries: data.sleepEntries,
          diapers: data.diapers,
        });
      } else {
        await refreshNotificationSchedule({
          baby: data.baby,
          vaccinations: data.vaccinations,
          appointments: data.appointments,
          feedings: data.feedings,
          sleepEntries: data.sleepEntries,
          diapers: data.diapers,
        });
      }
    }
  }, [applyData, routeAfterAuth]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setLoading(true);
          await loadUserData();
        } else {
          clearData();
          setScreen("login");
        }
      } catch (error) {
        console.error("Auth bootstrap failed:", error);
        await logoutUser();
        clearData();
        setScreen("login");
      } finally {
        setLoading(false);
        setAuthLoading(false);
      }
    });
    return unsub;
  }, [clearData, loadUserData]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await loginWithEmail(email, password);
      await loadUserData();
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code) throw new Error(mapFirebaseAuthError(code));
      if (error instanceof ApiError) throw new Error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      await signupWithEmail(name, email, password);
      clearData();
      setScreen("setup");
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code) throw new Error(mapFirebaseAuthError(code));
      if (error instanceof ApiError) throw new Error(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const syncHealthNotifications = useCallback(
    async (overrides?: {
      vaccinations?: Vaccination[];
      appointments?: Appointment[];
    }) => {
      syncNotifications(overrides);
    },
    [syncNotifications],
  );

  const logout = async () => {
    await unregisterPushTokenFromApi();
    await clearScheduledNotifications();
    await logoutUser();
    clearData();
    setScreen("login");
  };

  const onBabySetup = async (profile: Omit<BabyProfile, "id">) => {
    setLoading(true);
    try {
      const { baby: saved } = await api.putBaby(profile);
      const defaultVax = makeDefaultVaccinations(profile.birthDate);
      const defaultMs = makeDefaultMilestones(profile.birthDate);
      await Promise.all([
        api.bulkVaccinations(stripId(defaultVax)),
        api.bulkMilestones(stripId(defaultMs)),
      ]);
      const data = await api.loadAllData();
      applyData({ ...data, baby: saved });
      await setupNotificationsForUser({
        baby: saved,
        vaccinations: data.vaccinations,
        appointments: data.appointments,
        feedings: data.feedings,
        sleepEntries: data.sleepEntries,
        diapers: data.diapers,
      });
      setScreen("app");
    } finally {
      setLoading(false);
    }
  };

  const runMutation = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
      if (mutatingRef.current) {
        console.warn(
          "[Bebio/mutation] skipped — another mutation is in progress",
        );
        return undefined;
      }
      mutatingRef.current = true;
      setMutating(true);
      try {
        return await fn();
      } catch (error) {
        if (isFreeLimitError(error)) {
          void openUpgradeWebsiteOnLimit((result) => {
            if (result === "success") void refreshSubscriptionState();
          });
          return false as T;
        }
        console.error("[Bebio/mutation] failed:", error);
        throw error;
      } finally {
        mutatingRef.current = false;
        setMutating(false);
      }
    },
    [refreshSubscriptionState],
  );

  const addFeeding = (entry: Omit<FeedingEntry, "id">) =>
    runMutation(async () => {
      console.log("[Bebio/feeding] addFeeding start", {
        existingCount: feedings.length,
        entry,
      });
      const { entry: created } = await api.postFeeding(entry);
      console.log("[Bebio/feeding] addFeeding success", created);
      setFeedings((p) => [created, ...p]);
      syncNotifications({ feedings: [created, ...feedings] });
      return true;
    });

  const deleteFeeding = (id: string) =>
    runMutation(async () => {
      await api.deleteFeeding(id);
      const next = feedings.filter((f) => f.id !== id);
      setFeedings(next);
      syncNotifications({ feedings: next });
    });

  const addSleep = (entry: Omit<SleepEntry, "id">) =>
    runMutation(async () => {
      const { entry: created } = await api.postSleep(entry);
      setSleepEntries((p) => [created, ...p]);
      syncNotifications({ sleepEntries: [created, ...sleepEntries] });
      return true;
    });

  const deleteSleep = (id: string) =>
    runMutation(async () => {
      await api.deleteSleep(id);
      const next = sleepEntries.filter((s) => s.id !== id);
      setSleepEntries(next);
      syncNotifications({ sleepEntries: next });
    });

  const addDiaper = (entry: Omit<DiaperEntry, "id">) =>
    runMutation(async () => {
      const { entry: created } = await api.postDiaper(entry);
      setDiapers((p) => [created, ...p]);
      syncNotifications({ diapers: [created, ...diapers] });
      return true;
    });

  const deleteDiaper = (id: string) =>
    runMutation(async () => {
      await api.deleteDiaper(id);
      const next = diapers.filter((d) => d.id !== id);
      setDiapers(next);
      syncNotifications({ diapers: next });
    });

  const addGrowth = (entry: Omit<GrowthEntry, "id">) =>
    runMutation(async () => {
      const { entry: created } = await api.postGrowth(entry);
      setGrowth((p) => [...p, created]);
      return true;
    });

  const deleteGrowth = (id: string) =>
    runMutation(async () => {
      await api.deleteGrowth(id);
      setGrowth((p) => p.filter((g) => g.id !== id));
    });

  const addMilestone = (entry: Omit<Milestone, "id">) =>
    runMutation(async () => {
      const { milestone: created } = await api.postMilestone(entry);
      setMilestones((p) => [...p, created]);
      return true;
    });

  const toggleMilestone = (
    id: string,
    done: boolean,
    achievedDate?: string | null,
  ) =>
    runMutation(async () => {
      const { milestone } = await api.putMilestone(id, {
        done,
        achievedDate: done ? (achievedDate ?? undefined) : null,
      });
      setMilestones((p) => p.map((m) => (m.id === id ? milestone : m)));
    });

  const deleteMilestone = (id: string) =>
    runMutation(async () => {
      await api.deleteMilestone(id);
      setMilestones((p) => p.filter((m) => m.id !== id));
    });

  const updateVaccination = (
    id: string,
    data: { done: boolean; completedDate?: string },
  ) =>
    runMutation(async () => {
      const { vaccination } = await api.putVaccination(id, data);
      const updated = vaccinations.map((v) => (v.id === id ? vaccination : v));
      setVaccinations(updated);
      void syncHealthNotifications({ vaccinations: updated });
    });

  const addVaccination = (entry: Omit<Vaccination, "id">) =>
    runMutation(async () => {
      const next = [...vaccinations, { ...entry, id: "temp" } as Vaccination];
      await api.bulkVaccinations(stripId(next));
      const { vaccinations: updated } = await api.getVaccinations();
      setVaccinations(updated);
      void syncHealthNotifications({ vaccinations: updated });
      return true;
    });

  const deleteVaccination = (id: string) =>
    runMutation(async () => {
      const next = vaccinations.filter((v) => v.id !== id);
      await api.bulkVaccinations(stripId(next));
      setVaccinations(next);
      void syncHealthNotifications({ vaccinations: next });
    });

  const addAppointment = (entry: Omit<Appointment, "id">) =>
    runMutation(async () => {
      const next = [...appointments, { ...entry, id: "temp" } as Appointment];
      await api.bulkAppointments(stripId(next));
      const { appointments: updated } = await api.getAppointments();
      setAppointments(updated);
      void syncHealthNotifications({ appointments: updated });
      return true;
    });

  const deleteAppointment = (id: string) =>
    runMutation(async () => {
      const next = appointments.filter((a) => a.id !== id);
      await api.bulkAppointments(stripId(next));
      setAppointments(next);
      void syncHealthNotifications({ appointments: next });
    });

  const updateAppointment = (
    id: string,
    data: { done: boolean; completedDate?: string },
  ) =>
    runMutation(async () => {
      const { appointment } = await api.putAppointment(id, {
        done: data.done,
        completedDate: data.done ? (data.completedDate ?? undefined) : null,
      });
      const updated = appointments.map((a) => (a.id === id ? appointment : a));
      setAppointments(updated);
      void syncHealthNotifications({ appointments: updated });
    });

  const addMedNote = (entry: Omit<MedicalNote, "id">) =>
    runMutation(async () => {
      const { note } = await api.postMedNote(entry);
      setMedNotes((p) => [note, ...p]);
      return true;
    });

  const deleteMedNote = (id: string) =>
    runMutation(async () => {
      await api.deleteMedNote(id);
      setMedNotes((p) => p.filter((n) => n.id !== id));
    });

  const updateMedNote = (
    id: string,
    data: { done: boolean; completedDate?: string },
  ) =>
    runMutation(async () => {
      const { note } = await api.putMedNote(id, {
        done: data.done,
        completedDate: data.done ? (data.completedDate ?? undefined) : null,
      });
      setMedNotes((p) => p.map((n) => (n.id === id ? note : n)));
    });

  const userMilestoneCount =
    milestones.length - (baselineMsCount.current ?? milestones.length);
  const userVaccinationCount =
    vaccinations.length - (baselineVaxCount.current ?? vaccinations.length);

  return (
    <AppContext.Provider
      value={{
        screen,
        setScreen,
        authLoading,
        loading,
        mutating,
        profile,
        baby,
        feedings,
        sleepEntries,
        diapers,
        growth,
        vaccinations,
        appointments,
        medNotes,
        milestones,
        userMilestoneCount,
        userVaccinationCount,
        login,
        signup,
        logout,
        onBabySetup,
        addFeeding,
        deleteFeeding,
        addSleep,
        deleteSleep,
        addDiaper,
        deleteDiaper,
        addGrowth,
        deleteGrowth,
        addMilestone,
        toggleMilestone,
        deleteMilestone,
        updateVaccination,
        addVaccination,
        deleteVaccination,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        addMedNote,
        updateMedNote,
        deleteMedNote,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
